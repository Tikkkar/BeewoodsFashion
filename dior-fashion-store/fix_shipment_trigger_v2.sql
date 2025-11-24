-- FIX: Shipment Trigger - Xử lý tenant_id NULL
-- Chạy script này trong Supabase SQL Editor

-- 1. Drop trigger cũ
DROP TRIGGER IF EXISTS create_shipment_on_processing ON orders;
DROP FUNCTION IF EXISTS create_shipment_for_order();

-- 2. Tạo function mới với fallback tenant_id
CREATE OR REPLACE FUNCTION create_shipment_for_order()
RETURNS TRIGGER AS $$
DECLARE
  v_total_weight INTEGER;
  v_cod_amount NUMERIC;
  v_tenant_id UUID;
BEGIN
  -- Chỉ tạo shipment khi status chuyển sang 'processing'
  IF NEW.status = 'processing' AND (OLD.status IS NULL OR OLD.status != 'processing') THEN
    
    -- ✅ FIX: Lấy tenant_id, nếu NULL thì dùng tenant đầu tiên
    v_tenant_id := NEW.tenant_id;
    IF v_tenant_id IS NULL THEN
      SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
      RAISE NOTICE 'Order % has no tenant_id, using default: %', NEW.order_number, v_tenant_id;
    END IF;
    
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
    
    -- Insert shipment
    INSERT INTO shipments (
      tenant_id,
      order_id,
      carrier_code,
      cod_amount,
      total_weight_g,
      shipping_fee_actual,
      status
    ) VALUES (
      v_tenant_id,  -- ✅ Dùng tenant_id đã xử lý
      NEW.id,
      'J&T',
      v_cod_amount,
      v_total_weight,
      NEW.shipping_fee,
      'ready_to_pick'
    );
    
    RAISE NOTICE 'Created shipment for order % with tenant_id %', NEW.order_number, v_tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Tạo trigger mới
CREATE TRIGGER create_shipment_on_processing
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_shipment_for_order();

-- 4. BONUS: Update tất cả orders hiện tại để có tenant_id
DO $$
DECLARE
  default_tenant_id UUID;
  updated_count INTEGER;
BEGIN
  -- Lấy tenant_id đầu tiên
  SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
  
  IF default_tenant_id IS NOT NULL THEN
    -- Update orders chưa có tenant_id
    UPDATE orders 
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % orders with tenant_id %', updated_count, default_tenant_id;
  ELSE
    RAISE WARNING 'No tenant found in database!';
  END IF;
END $$;

-- 5. Verify
SELECT 
  'Trigger created' as status,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'create_shipment_on_processing'

UNION ALL

SELECT 
  'Orders updated' as status,
  COUNT(*)::text as trigger_name,
  'orders with tenant_id' as event_manipulation,
  '' as event_object_table
FROM orders
WHERE tenant_id IS NOT NULL;
