-- ============================================
-- PHÂN TÍCH & CẢI THIỆN RELATIONSHIPS
-- Products ↔ Orders ↔ Shipments
-- ============================================

-- HIỆN TRẠNG:
-- ✅ products → order_items (via product_id) - ĐÃ CÓ FK
-- ✅ orders → order_items (via order_id) - ĐÃ CÓ FK  
-- ✅ orders → shipments (via order_id) - ĐÃ CÓ FK
-- ❌ THIẾU: Liên kết trực tiếp product dimensions → shipment dimensions
-- ❌ THIẾU: Tự động sync product_code từ products → shipments
-- ❌ THIẾU: Tự động tính total_weight từ order_items

-- ============================================
-- PART 1: BỔ SUNG CÁC CỘT THIẾU
-- ============================================

-- 1.1. Thêm product_code vào order_items (để trace sản phẩm)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_code TEXT,
  ADD COLUMN IF NOT EXISTS product_sku TEXT;

-- 1.2. Đảm bảo order_items có weight
-- (Đã có weight_g và total_weight_g - OK)

-- 1.3. Thêm indexes để tăng performance
CREATE INDEX IF NOT EXISTS idx_order_items_product_code ON order_items(product_code);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);

-- ============================================
-- PART 2: TẠO VIEWS ĐỂ JOIN DỮ LIỆU
-- ============================================

-- 2.1. View: Order với Product Details
CREATE OR REPLACE VIEW v_orders_with_products AS
SELECT 
  o.id as order_id,
  o.order_number,
  o.customer_name,
  o.customer_phone,
  o.status as order_status,
  o.total_amount,
  o.shipping_fee,
  o.created_at as order_created_at,
  
  -- Order Items
  json_agg(
    json_build_object(
      'item_id', oi.id,
      'product_id', oi.product_id,
      'product_name', oi.product_name,
      'product_code', COALESCE(oi.product_code, p.product_code),
      'size', oi.size,
      'quantity', oi.quantity,
      'price', oi.price,
      'weight_g', COALESCE(oi.weight_g, p.weight_g),
      'total_weight_g', oi.quantity * COALESCE(oi.weight_g, p.weight_g, 0)
    )
  ) as items,
  
  -- Totals
  SUM(oi.quantity) as total_items,
  SUM(oi.quantity * COALESCE(oi.weight_g, p.weight_g, 0)) as total_weight_g,
  
  -- Product codes (comma separated)
  STRING_AGG(DISTINCT COALESCE(oi.product_code, p.product_code), ', ') as product_codes
  
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY o.id;

-- 2.2. View: Shipment với Order & Product Details
CREATE OR REPLACE VIEW v_shipments_full AS
SELECT 
  s.id as shipment_id,
  s.tracking_number,
  s.carrier_code,
  s.status as shipment_status,
  s.service_type,
  s.payment_method,
  s.cod_amount,
  s.shipping_fee_actual,
  s.package_weight_g,
  s.created_at as shipment_created_at,
  
  -- Order info
  o.id as order_id,
  o.order_number,
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  o.status as order_status,
  o.total_amount,
  
  -- Shipping address
  CONCAT_WS(', ', 
    o.shipping_address, 
    o.shipping_ward, 
    o.shipping_district, 
    o.shipping_city
  ) as full_address,
  
  -- Order items with products
  (
    SELECT json_agg(
      json_build_object(
        'product_id', oi.product_id,
        'product_name', oi.product_name,
        'product_code', COALESCE(oi.product_code, p.product_code),
        'size', oi.size,
        'quantity', oi.quantity,
        'weight_g', COALESCE(oi.weight_g, p.weight_g),
        'dimensions', json_build_object(
          'length_cm', p.length_cm,
          'width_cm', p.width_cm,
          'height_cm', p.height_cm
        )
      )
    )
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = o.id
  ) as products,
  
  -- Product codes
  (
    SELECT STRING_AGG(DISTINCT COALESCE(oi.product_code, p.product_code), ', ')
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = o.id
  ) as product_codes,
  
  -- Total weight from items
  (
    SELECT SUM(oi.quantity * COALESCE(oi.weight_g, p.weight_g, 0))
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = o.id
  ) as calculated_weight_g

FROM shipments s
INNER JOIN orders o ON s.order_id = o.id;

-- ============================================
-- PART 3: TRIGGERS ĐỂ TỰ ĐỘNG SYNC DỮ LIỆU
-- ============================================

-- 3.1. Trigger: Auto sync product_code khi tạo order_item
CREATE OR REPLACE FUNCTION sync_order_item_product_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Lấy product_code và weight từ products
  SELECT 
    product_code,
    weight_g
  INTO 
    NEW.product_code,
    NEW.weight_g
  FROM products
  WHERE id = NEW.product_id;
  
  -- Tính total_weight_g
  NEW.total_weight_g := NEW.quantity * COALESCE(NEW.weight_g, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_order_item_info ON order_items;
CREATE TRIGGER trigger_sync_order_item_info
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_item_product_info();

-- 3.2. Trigger: Auto update shipment info từ order & products
CREATE OR REPLACE FUNCTION sync_shipment_from_order()
RETURNS TRIGGER AS $$
DECLARE
  v_order RECORD;
  v_total_weight INTEGER;
  v_product_codes TEXT;
  v_max_length INTEGER;
  v_max_width INTEGER;
  v_max_height INTEGER;
BEGIN
  -- Lấy thông tin order
  SELECT * INTO v_order FROM orders WHERE id = NEW.order_id;
  
  -- Tính total weight từ order_items
  SELECT 
    SUM(oi.quantity * COALESCE(oi.weight_g, p.weight_g, 500)) as total_weight,
    STRING_AGG(DISTINCT COALESCE(oi.product_code, p.product_code), ', ') as codes,
    MAX(p.length_cm) as max_l,
    MAX(p.width_cm) as max_w,
    MAX(p.height_cm) as max_h
  INTO 
    v_total_weight,
    v_product_codes,
    v_max_length,
    v_max_width,
    v_max_height
  FROM order_items oi
  LEFT JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = NEW.order_id;
  
  -- Auto fill shipment fields
  NEW.receiver_name := COALESCE(NEW.receiver_name, v_order.customer_name);
  NEW.receiver_phone := COALESCE(NEW.receiver_phone, v_order.customer_phone);
  NEW.receiver_address_detail := COALESCE(
    NEW.receiver_address_detail,
    CONCAT_WS(', ', 
      v_order.shipping_address, 
      v_order.shipping_ward, 
      v_order.shipping_district, 
      v_order.shipping_city
    )
  );
  
  NEW.product_code := COALESCE(NEW.product_code, v_product_codes);
  NEW.package_weight_g := COALESCE(NEW.package_weight_g, v_total_weight);
  NEW.total_weight_g := COALESCE(NEW.total_weight_g, v_total_weight);
  
  -- Auto fill dimensions (lấy max của các sản phẩm)
  NEW.package_length_cm := COALESCE(NEW.package_length_cm, v_max_length, 30);
  NEW.package_width_cm := COALESCE(NEW.package_width_cm, v_max_width, 25);
  NEW.package_height_cm := COALESCE(NEW.package_height_cm, v_max_height, 10);
  
  -- Auto fill COD
  NEW.cod_amount := COALESCE(NEW.cod_amount, v_order.total_amount);
  NEW.product_value := COALESCE(NEW.product_value, v_order.total_amount - v_order.shipping_fee);
  
  -- Auto fill payment method
  NEW.payment_method := COALESCE(
    NEW.payment_method,
    CASE 
      WHEN v_order.payment_method = 'cod' THEN 'CC_CASH'
      ELSE 'PP_CASH'
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_shipment_info ON shipments;
CREATE TRIGGER trigger_sync_shipment_info
  BEFORE INSERT OR UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION sync_shipment_from_order();

-- ============================================
-- PART 4: FUNCTIONS HỖ TRỢ
-- ============================================

-- 4.1. Function: Lấy tất cả products trong 1 order
CREATE OR REPLACE FUNCTION get_order_products(p_order_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_code TEXT,
  size TEXT,
  quantity INTEGER,
  weight_g INTEGER,
  total_weight_g INTEGER,
  length_cm INTEGER,
  width_cm INTEGER,
  height_cm INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    COALESCE(oi.product_code, p.product_code),
    oi.size,
    oi.quantity,
    COALESCE(oi.weight_g, p.weight_g),
    oi.quantity * COALESCE(oi.weight_g, p.weight_g, 0),
    p.length_cm,
    p.width_cm,
    p.height_cm
  FROM order_items oi
  LEFT JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- 4.2. Function: Tính tổng weight của order
CREATE OR REPLACE FUNCTION calculate_order_weight(p_order_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_weight INTEGER;
BEGIN
  SELECT SUM(oi.quantity * COALESCE(oi.weight_g, p.weight_g, 500))
  INTO v_total_weight
  FROM order_items oi
  LEFT JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = p_order_id;
  
  RETURN COALESCE(v_total_weight, 0);
END;
$$ LANGUAGE plpgsql;

-- 4.3. Function: Lấy dimensions lớn nhất trong order
CREATE OR REPLACE FUNCTION get_order_max_dimensions(p_order_id UUID)
RETURNS TABLE (
  max_length_cm INTEGER,
  max_width_cm INTEGER,
  max_height_cm INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    MAX(p.length_cm)::INTEGER,
    MAX(p.width_cm)::INTEGER,
    MAX(p.height_cm)::INTEGER
  FROM order_items oi
  LEFT JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: MIGRATE DỮ LIỆU CŨ
-- ============================================

-- 5.1. Sync product_code vào order_items
UPDATE order_items oi
SET 
  product_code = p.product_code,
  weight_g = COALESCE(oi.weight_g, p.weight_g),
  total_weight_g = oi.quantity * COALESCE(oi.weight_g, p.weight_g, 0)
FROM products p
WHERE oi.product_id = p.id
  AND (oi.product_code IS NULL OR oi.weight_g IS NULL);

-- 5.2. Sync shipment info từ orders
UPDATE shipments s
SET 
  receiver_name = o.customer_name,
  receiver_phone = o.customer_phone,
  receiver_address_detail = CONCAT_WS(', ', 
    o.shipping_address, 
    o.shipping_ward, 
    o.shipping_district, 
    o.shipping_city
  ),
  product_value = o.total_amount - o.shipping_fee,
  cod_amount = COALESCE(s.cod_amount, o.total_amount),
  payment_method = CASE 
    WHEN o.payment_method = 'cod' THEN 'CC_CASH'
    ELSE 'PP_CASH'
  END
FROM orders o
WHERE s.order_id = o.id
  AND s.receiver_name IS NULL;

-- 5.3. Sync weight và product_code vào shipments
UPDATE shipments s
SET 
  product_code = (
    SELECT STRING_AGG(DISTINCT COALESCE(oi.product_code, p.product_code), ', ')
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = s.order_id
  ),
  package_weight_g = (
    SELECT SUM(oi.quantity * COALESCE(oi.weight_g, p.weight_g, 500))
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = s.order_id
  ),
  total_weight_g = (
    SELECT SUM(oi.quantity * COALESCE(oi.weight_g, p.weight_g, 500))
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = s.order_id
  )
WHERE s.product_code IS NULL OR s.package_weight_g IS NULL;

-- ============================================
-- PART 6: VERIFY
-- ============================================

-- 6.1. Kiểm tra relationships
SELECT 
  'Orders with items' as check_name,
  COUNT(DISTINCT o.id) as count
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id

UNION ALL

SELECT 
  'Orders with shipments',
  COUNT(DISTINCT o.id)
FROM orders o
INNER JOIN shipments s ON o.id = s.order_id

UNION ALL

SELECT 
  'Order items with products',
  COUNT(DISTINCT oi.id)
FROM order_items oi
INNER JOIN products p ON oi.product_id = p.id

UNION ALL

SELECT 
  'Shipments with product codes',
  COUNT(*)
FROM shipments
WHERE product_code IS NOT NULL;

-- 6.2. Test views
SELECT * FROM v_orders_with_products LIMIT 5;
SELECT * FROM v_shipments_full LIMIT 5;

-- 6.3. Test functions
SELECT * FROM get_order_products(
  (SELECT id FROM orders LIMIT 1)
);

SELECT calculate_order_weight(
  (SELECT id FROM orders LIMIT 1)
) as total_weight_g;

SELECT * FROM get_order_max_dimensions(
  (SELECT id FROM orders LIMIT 1)
);

-- ============================================
-- PART 7: PERMISSIONS
-- ============================================

GRANT SELECT ON v_orders_with_products TO authenticated;
GRANT SELECT ON v_shipments_full TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_products(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_order_weight(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_max_dimensions(UUID) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON VIEW v_orders_with_products IS 'View tổng hợp order với product details, weight, product codes';
COMMENT ON VIEW v_shipments_full IS 'View tổng hợp shipment với order và product details đầy đủ';
COMMENT ON FUNCTION sync_order_item_product_info() IS 'Trigger function: Auto sync product_code và weight khi tạo order_item';
COMMENT ON FUNCTION sync_shipment_from_order() IS 'Trigger function: Auto fill shipment info từ order và products';
COMMENT ON FUNCTION get_order_products(UUID) IS 'Lấy danh sách products trong 1 order với đầy đủ thông tin';
COMMENT ON FUNCTION calculate_order_weight(UUID) IS 'Tính tổng trọng lượng của order';
COMMENT ON FUNCTION get_order_max_dimensions(UUID) IS 'Lấy kích thước lớn nhất trong order';
