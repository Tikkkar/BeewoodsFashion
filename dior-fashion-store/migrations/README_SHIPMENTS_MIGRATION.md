# Hướng Dẫn: Cập Nhật Cấu Trúc Bảng Shipments

## 📋 Tổng quan

Cập nhật bảng `shipments` để khớp với format chuẩn của các đơn vị vận chuyển tại Việt Nam (J&T, GHN, GHTK, Viettel Post).

## 🔧 Các cột mới được thêm

### Thông tin người nhận
- `receiver_name` - Tên người nhận
- `receiver_phone` - Số điện thoại
- `receiver_address_detail` - Địa chỉ chi tiết đầy đủ

### Thông tin sản phẩm
- `product_code` - Mã hàng
- `product_type` - Loại hàng hóa (Quần áo, Điện tử, Mỹ phẩm, etc.)

### Thông tin dịch vụ
- `service_type` - Loại dịch vụ:
  - `EXPRESS` - Nhanh (1-2 ngày)
  - `FAST` - Tiêu chuẩn (2-3 ngày)
  - `STANDARD` - Tiết kiệm (3-5 ngày)
- `service_package` - Gói dịch vụ (tùy carrier)
- `payment_method` - Phương thức thanh toán:
  - `PP_CASH` - Người gửi trả phí ship
  - `CC_CASH` - Người nhận trả phí ship

### Chi tiết vận chuyển
- `shipping_fee_customer` - Tiền ship khách hàng trả
- `cod_type` - Loại COD (FULL/PARTIAL)
- `package_weight_g` - Trọng lượng (gram)
- `package_length_cm` - Chiều dài (cm)
- `package_width_cm` - Chiều rộng (cm)
- `package_height_cm` - Chiều cao (cm)
- `package_count` - Số kiện
- `product_value` - Giá trị hàng hóa khai báo
- `note` - Ghi chú

## 📝 Cách chạy Migration

### Bước 1: Backup dữ liệu
```sql
-- Export bảng shipments hiện tại
COPY (SELECT * FROM shipments) TO '/tmp/shipments_backup.csv' CSV HEADER;
```

### Bước 2: Chạy migration
1. Mở Supabase Dashboard
2. Vào SQL Editor
3. Copy toàn bộ nội dung file `migrations/update_shipments_structure.sql`
4. Paste và click "Run"

### Bước 3: Verify
```sql
-- Kiểm tra cấu trúc mới
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'shipments'
ORDER BY ordinal_position;

-- Kiểm tra dữ liệu đã migrate
SELECT * FROM shipments LIMIT 5;
```

## 📊 View Export

Đã tạo view `v_shipments_export` để xuất dữ liệu theo format chuẩn:

```sql
SELECT * FROM v_shipments_export;
```

Kết quả sẽ có các cột:
1. STT
2. Tên người nhận
3. Số điện thoại
4. Địa chỉ chi tiết
5. Mã hàng
6. Loại hàng hóa
7. Loại dịch vụ
8. Gói dịch vụ
9. Phương thức thanh toán
10. Tiền ship
11. Loại COD
12. Trọng lượng (kg)
13. Chiều dài (cm)
14. Chiều rộng (cm)
15. Chiều cao (cm)
16. Số kiện
17. Tiền hàng
18. Tiền thu hộ (COD)
19. Ghi chú

## 🔄 Cập nhật Frontend

Sau khi chạy migration, cần cập nhật:

### 1. API (`src/lib/api/shipments.js`)
Thêm các field mới vào query

### 2. Components
- `ShipmentEditModal.jsx` - Thêm inputs cho các field mới
- `AdminShipments.jsx` - Hiển thị các cột mới

### 3. Excel Export
Cập nhật `excelExport.js` để match với view `v_shipments_export`

## ✅ Checklist

- [ ] Backup dữ liệu
- [ ] Chạy migration SQL
- [ ] Verify cấu trúc bảng
- [ ] Test view export
- [ ] Cập nhật API
- [ ] Cập nhật UI components
- [ ] Test tạo shipment mới
- [ ] Test export Excel

## 🐛 Troubleshooting

### Lỗi: Column already exists
```sql
-- Drop column nếu cần
ALTER TABLE shipments DROP COLUMN IF EXISTS receiver_name;
-- Rồi chạy lại migration
```

### Lỗi: Permission denied
```sql
-- Grant quyền cho authenticated users
GRANT ALL ON shipments TO authenticated;
```

## 📞 Support

Nếu gặp vấn đề, check:
1. Supabase logs
2. PostgreSQL version (cần >= 12)
3. RLS policies
