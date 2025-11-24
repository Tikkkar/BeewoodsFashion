-- Migration: Update shipments table structure to match Vietnamese carrier format
-- Run this in Supabase SQL Editor

-- 1. Add new columns to shipments table
ALTER TABLE shipments
  -- Receiver info (from orders, but denormalized for carrier export)
  ADD COLUMN IF NOT EXISTS receiver_name TEXT,
  ADD COLUMN IF NOT EXISTS receiver_phone TEXT,
  ADD COLUMN IF NOT EXISTS receiver_address_detail TEXT,
  
  -- Product info
  ADD COLUMN IF NOT EXISTS product_code TEXT,
  ADD COLUMN IF NOT EXISTS product_type TEXT, -- Loại hàng hóa (Quần áo, Điện tử, etc.)
  
  -- Service info
  ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'EXPRESS', -- EXPRESS, FAST, STANDARD
  ADD COLUMN IF NOT EXISTS service_package TEXT, -- Gói dịch vụ
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'PP_CASH', -- PP_CASH (người gửi trả), CC_CASH (người nhận trả)
  
  -- Shipping details
  ADD COLUMN IF NOT EXISTS shipping_fee_customer INTEGER DEFAULT 0, -- Tiền ship khách trả
  ADD COLUMN IF NOT EXISTS cod_type TEXT, -- Loại COD
  
  -- Package dimensions (already have some, add missing)
  ADD COLUMN IF NOT EXISTS package_weight_g INTEGER, -- Trọng lượng (gram)
  ADD COLUMN IF NOT EXISTS package_length_cm INTEGER, -- Chiều dài (cm)
  ADD COLUMN IF NOT EXISTS package_width_cm INTEGER, -- Chiều rộng (cm)
  ADD COLUMN IF NOT EXISTS package_height_cm INTEGER, -- Chiều cao (cm)
  ADD COLUMN IF NOT EXISTS package_count INTEGER DEFAULT 1, -- Số kiện
  
  -- Value
  ADD COLUMN IF NOT EXISTS product_value INTEGER DEFAULT 0, -- Tiền hàng (giá trị khai báo)
  
  -- Note (may already exist)
  ADD COLUMN IF NOT EXISTS note TEXT; -- Ghi chú

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shipments_receiver_phone ON shipments(receiver_phone);
CREATE INDEX IF NOT EXISTS idx_shipments_product_code ON shipments(product_code);
CREATE INDEX IF NOT EXISTS idx_shipments_service_type ON shipments(service_type);

-- 3. Update existing records with data from orders
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
  package_weight_g = s.total_weight_g,
  service_type = CASE 
    WHEN o.shipping_city IN ('Hà Nội', 'Hồ Chí Minh') THEN 'EXPRESS'
    ELSE 'STANDARD'
  END,
  payment_method = CASE 
    WHEN o.payment_method = 'cod' THEN 'CC_CASH'
    ELSE 'PP_CASH'
  END
FROM orders o
WHERE s.order_id = o.id
  AND s.receiver_name IS NULL;

-- 4. Create view for carrier export (format chuẩn)
CREATE OR REPLACE VIEW v_shipments_export AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY s.created_at) as stt,
  s.receiver_name as "Tên người nhận",
  s.receiver_phone as "Số điện thoại",
  s.receiver_address_detail as "Địa chỉ chi tiết",
  s.product_code as "Mã hàng",
  COALESCE(s.product_type, 'Quần áo') as "Loại hàng hóa",
  s.service_type as "Loại dịch vụ",
  s.service_package as "Gói dịch vụ",
  s.payment_method as "Phương thức thanh toán",
  s.shipping_fee_customer as "Tiền ship",
  s.cod_type as "Loại COD",
  ROUND(s.package_weight_g / 1000.0, 2) as "Trọng lượng (kg)",
  s.package_length_cm as "Chiều dài (cm)",
  s.package_width_cm as "Chiều rộng (cm)",
  s.package_height_cm as "Chiều cao (cm)",
  s.package_count as "Số kiện",
  s.product_value as "Tiền hàng",
  s.cod_amount as "Tiền thu hộ (COD)",
  s.note as "Ghi chú",
  s.tracking_number as "Mã vận đơn",
  s.carrier_code as "Đơn vị vận chuyển",
  s.status as "Trạng thái",
  s.created_at as "Ngày tạo"
FROM shipments s
ORDER BY s.created_at DESC;

-- 5. Grant permissions
GRANT SELECT ON v_shipments_export TO authenticated;

-- 6. Verify
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'shipments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

COMMENT ON TABLE shipments IS 'Bảng quản lý vận chuyển - format chuẩn các đơn vị vận chuyển VN';
COMMENT ON COLUMN shipments.service_type IS 'EXPRESS (nhanh), FAST (tiêu chuẩn), STANDARD (tiết kiệm)';
COMMENT ON COLUMN shipments.payment_method IS 'PP_CASH (người gửi trả ship), CC_CASH (người nhận trả ship)';
COMMENT ON COLUMN shipments.cod_type IS 'Loại thu hộ: FULL (thu đủ), PARTIAL (thu 1 phần)';
