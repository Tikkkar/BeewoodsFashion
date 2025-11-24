-- FIX: Shipment Trigger - Thêm tenant_id
-- Chạy script này trong Supabase SQL Editor

-- 1. Drop trigger cũ (nếu có)
DROP TRIGGER IF EXISTS create_shipment_on_processing ON orders;
DROP FUNCTION IF EXISTS create_shipment_for_order();

-- 2. Tạo function mới với tenant_id
CREATE OR REPLACE FUNCTION create_shipment_for_order()
RETURNS TRIGGER AS $$
DECLARE
  v_total_weight INTEGER;
  v_cod_amount NUMERIC;
BEGIN
  -- Chỉ tạo shipment khi status chuyển sang 'processing'
  IF NEW.status = 'processing' AND (OLD.status IS NULL OR OLD.status != 'processing') THEN
    
    -- Tính tổng trọng lượng từ order_items
    SELECT COALESCE(SUM(oi.weight_g * oi.quantity), 0)
    INTO v_total_weight
    FROM order_items oi
    WHERE oi.order_id = NEW.id;
    
    -- Nếu không có weight từ order_items, dùng weight từ products
    IF v_total_weight = 0 THEN
      SELECT COALESCE(SUM(p.weight_g * oi.quantity), 500)
      INTO v_total_weight
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = NEW.id;
    END IF;
    
    -- COD amount = total_amount (tiền thu hộ)
    v_cod_amount := NEW.total_amount;
    
    -- Insert shipment với tenant_id từ order
    INSERT INTO shipments (
      tenant_id,
      order_id,
      carrier_code,
      cod_amount,
      total_weight_g,
      shipping_fee_actual,
      status
    ) VALUES (
      NEW.tenant_id,  -- ✅ FIX: Lấy tenant_id từ order
      NEW.id,
      'J&T',
      v_cod_amount,
      v_total_weight,
      NEW.shipping_fee,
      'ready_to_pick'
    );
    
    RAISE NOTICE 'Created shipment for order % with tenant_id %', NEW.order_number, NEW.tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Tạo trigger mới
CREATE TRIGGER create_shipment_on_processing
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_shipment_for_order();

-- 4. Test: Kiểm tra trigger đã được tạo
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'create_shipment_on_processing';

-- ✅ Kết quả mong đợi: 1 row với trigger_name = 'create_shipment_on_processing'
