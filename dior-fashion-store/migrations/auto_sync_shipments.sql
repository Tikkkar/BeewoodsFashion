-- =====================================================
-- MIGRATION: Auto-sync Shipments with Orders & Products
-- =====================================================
-- Mục đích: Tự động đồng bộ thông tin từ orders và products vào shipments
-- Ngày tạo: 2025-11-24

-- =====================================================
-- 1. FUNCTION: Tự động sync thông tin từ order sang shipment
-- =====================================================
CREATE OR REPLACE FUNCTION sync_shipment_from_order()
RETURNS TRIGGER AS $$
DECLARE
    v_order RECORD;
    v_product_codes TEXT;
    v_total_weight INTEGER;
    v_product_value NUMERIC;
BEGIN
    -- Lấy thông tin từ order
    SELECT 
        customer_name,
        customer_phone,
        shipping_address,
        shipping_ward,
        shipping_district,
        shipping_city,
        total_amount
    INTO v_order
    FROM orders
    WHERE id = NEW.order_id;

    -- Lấy thông tin sản phẩm từ order_items
    SELECT 
        STRING_AGG(DISTINCT COALESCE(p.product_code, ''), ', ') FILTER (WHERE p.product_code IS NOT NULL),
        SUM(COALESCE(oi.weight_g, p.weight_g, 0) * oi.quantity),
        SUM(oi.subtotal)
    INTO 
        v_product_codes,
        v_total_weight,
        v_product_value
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = NEW.order_id;

    -- Cập nhật shipment với thông tin từ order
    NEW.receiver_name := COALESCE(NEW.receiver_name, v_order.customer_name);
    NEW.receiver_phone := COALESCE(NEW.receiver_phone, v_order.customer_phone);
    NEW.receiver_address_detail := COALESCE(NEW.receiver_address_detail, v_order.shipping_address);
    
    -- Cập nhật product codes
    NEW.product_code := COALESCE(NEW.product_code, v_product_codes);
    
    -- Cập nhật trọng lượng nếu chưa có
    NEW.package_weight_g := COALESCE(NEW.package_weight_g, v_total_weight);
    NEW.total_weight_g := COALESCE(NEW.total_weight_g, v_total_weight);
    
    -- Cập nhật giá trị hàng
    NEW.product_value := COALESCE(NEW.product_value, v_product_value::INTEGER);
    
    -- Cập nhật COD amount nếu chưa có
    NEW.cod_amount := COALESCE(NEW.cod_amount, v_order.total_amount);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. TRIGGER: Áp dụng function khi INSERT hoặc UPDATE shipment
-- =====================================================
DROP TRIGGER IF EXISTS trigger_sync_shipment_from_order ON shipments;

CREATE TRIGGER trigger_sync_shipment_from_order
    BEFORE INSERT OR UPDATE ON shipments
    FOR EACH ROW
    WHEN (NEW.order_id IS NOT NULL)
    EXECUTE FUNCTION sync_shipment_from_order();

-- =====================================================
-- 3. FUNCTION: Cập nhật shipments hiện có
-- =====================================================
CREATE OR REPLACE FUNCTION update_existing_shipments()
RETURNS TABLE (
    shipment_id UUID,
    order_number TEXT,
    updated_fields TEXT[]
) AS $$
DECLARE
    v_shipment RECORD;
    v_order RECORD;
    v_product_codes TEXT;
    v_total_weight INTEGER;
    v_product_value NUMERIC;
    v_updated_fields TEXT[];
BEGIN
    FOR v_shipment IN 
        SELECT s.id, s.order_id, o.order_number
        FROM shipments s
        JOIN orders o ON s.order_id = o.id
    LOOP
        v_updated_fields := ARRAY[]::TEXT[];
        
        -- Lấy thông tin order
        SELECT 
            customer_name,
            customer_phone,
            shipping_address,
            shipping_ward,
            shipping_district,
            shipping_city,
            total_amount
        INTO v_order
        FROM orders
        WHERE id = v_shipment.order_id;

        -- Lấy thông tin sản phẩm
        SELECT 
            STRING_AGG(DISTINCT COALESCE(p.product_code, ''), ', ') FILTER (WHERE p.product_code IS NOT NULL),
            SUM(COALESCE(oi.weight_g, p.weight_g, 0) * oi.quantity),
            SUM(oi.subtotal)
        INTO 
            v_product_codes,
            v_total_weight,
            v_product_value
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = v_shipment.order_id;

        -- Cập nhật shipment
        UPDATE shipments s
        SET 
            receiver_name = COALESCE(s.receiver_name, v_order.customer_name),
            receiver_phone = COALESCE(s.receiver_phone, v_order.customer_phone),
            receiver_address_detail = COALESCE(s.receiver_address_detail, v_order.shipping_address),
            product_code = COALESCE(s.product_code, v_product_codes),
            package_weight_g = COALESCE(s.package_weight_g, v_total_weight),
            total_weight_g = COALESCE(s.total_weight_g, v_total_weight),
            product_value = COALESCE(s.product_value, v_product_value::INTEGER),
            cod_amount = COALESCE(s.cod_amount, v_order.total_amount),
            updated_at = NOW()
        WHERE s.id = v_shipment.id
        RETURNING 
            CASE WHEN receiver_name IS DISTINCT FROM v_order.customer_name THEN 'receiver_name' END,
            CASE WHEN receiver_phone IS DISTINCT FROM v_order.customer_phone THEN 'receiver_phone' END,
            CASE WHEN receiver_address_detail IS DISTINCT FROM v_order.shipping_address THEN 'receiver_address' END,
            CASE WHEN product_code IS DISTINCT FROM v_product_codes THEN 'product_code' END,
            CASE WHEN package_weight_g IS DISTINCT FROM v_total_weight THEN 'weight' END,
            CASE WHEN product_value IS DISTINCT FROM v_product_value::INTEGER THEN 'product_value' END
        INTO v_updated_fields;

        shipment_id := v_shipment.id;
        order_number := v_shipment.order_number;
        updated_fields := array_remove(v_updated_fields, NULL);
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CHẠY CẬP NHẬT DỮ LIỆU HIỆN CÓ
-- =====================================================
-- Uncomment dòng dưới để chạy cập nhật
-- SELECT * FROM update_existing_shipments();

-- =====================================================
-- 5. VIEW: Xem shipments với đầy đủ thông tin
-- =====================================================
DROP VIEW IF EXISTS v_shipments_full;

CREATE OR REPLACE VIEW v_shipments_full AS
SELECT 
    s.id,
    s.tenant_id,
    s.order_id,
    o.order_number,
    
    -- Thông tin người nhận (từ shipment hoặc order)
    COALESCE(s.receiver_name, o.customer_name) as receiver_name,
    COALESCE(s.receiver_phone, o.customer_phone) as receiver_phone,
    COALESCE(s.receiver_address_detail, o.shipping_address) as receiver_address_detail,
    
    -- Thông tin vận chuyển
    s.carrier_code,
    s.tracking_number,
    s.service_type,
    s.service_package,
    s.payment_method,
    s.status,
    
    -- Thông tin sản phẩm
    s.product_code,
    s.product_type,
    s.product_value,
    
    -- Thông tin COD và phí
    COALESCE(s.cod_amount, o.total_amount) as cod_amount,
    s.cod_type,
    s.shipping_fee_customer,
    s.shipping_fee_actual,
    
    -- Thông tin gói hàng
    s.package_weight_g,
    s.package_length_cm,
    s.package_width_cm,
    s.package_height_cm,
    s.package_count,
    
    -- Ghi chú
    s.note,
    s.note_for_shipper,
    
    -- Thời gian
    s.created_at as shipment_created_at,
    s.updated_at as shipment_updated_at,
    o.created_at as order_created_at,
    
    -- Thông tin đơn hàng
    o.customer_email,
    o.status as order_status,
    o.payment_status,
    o.total_amount as order_total
FROM shipments s
JOIN orders o ON s.order_id = o.id;

-- =====================================================
-- 6. INDEXES để tối ưu performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_receiver_phone ON shipments(receiver_phone);
CREATE INDEX IF NOT EXISTS idx_shipments_product_code ON shipments(product_code);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- 7. COMMENTS
-- =====================================================
COMMENT ON FUNCTION sync_shipment_from_order() IS 
'Tự động đồng bộ thông tin từ orders và products vào shipments khi INSERT/UPDATE';

COMMENT ON FUNCTION update_existing_shipments() IS 
'Cập nhật tất cả shipments hiện có với thông tin từ orders và products';

COMMENT ON VIEW v_shipments_full IS 
'View hiển thị shipments với đầy đủ thông tin từ orders và products';

-- =====================================================
-- HOÀN THÀNH
-- =====================================================
-- Để sử dụng:
-- 1. Chạy migration này để tạo trigger
-- 2. Uncomment và chạy: SELECT * FROM update_existing_shipments(); để cập nhật dữ liệu cũ
-- 3. Từ giờ mọi shipment mới sẽ tự động được sync thông tin
