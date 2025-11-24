# ⚠️ QUAN TRỌNG: Chạy Migration Trước Khi Test Frontend

## Bước 1: Chạy Migration SQL

Bạn CẦN chạy 2 file SQL này trong Supabase SQL Editor theo thứ tự:

### 1.1. File: `link_products_orders_shipments.sql`
```
Mở Supabase Dashboard → SQL Editor → New Query
Copy toàn bộ nội dung file migrations/link_products_orders_shipments.sql
Paste và click "Run"
```

**File này sẽ tạo:**
- 2 Views: `v_orders_with_products`, `v_shipments_full`
- 2 Triggers: Auto sync product_code & weight
- 3 Functions: Helper functions
- Migrate dữ liệu cũ

### 1.2. File: `update_shipments_structure.sql` (Optional - nếu chưa chạy)
```
Copy nội dung file migrations/update_shipments_structure.sql
Paste vào SQL Editor
Click "Run"
```

**File này sẽ thêm:**
- Các cột mới vào bảng `shipments` (receiver_name, product_code, etc.)

---

## Bước 2: Verify Migration

Chạy các query sau để kiểm tra:

```sql
-- 1. Check views đã được tạo
SELECT * FROM v_shipments_full LIMIT 5;
SELECT * FROM v_orders_with_products LIMIT 5;

-- 2. Check triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%sync%';

-- 3. Check functions
SELECT proname FROM pg_proc 
WHERE proname LIKE '%order%';

-- 4. Check data đã migrate
SELECT COUNT(*) FROM order_items WHERE product_code IS NOT NULL;
SELECT COUNT(*) FROM shipments WHERE receiver_name IS NOT NULL;
```

**Expected Results:**
- Views trả về data ✅
- 2 triggers tồn tại ✅
- 3 functions tồn tại ✅
- Data đã được migrate ✅

---

## Bước 3: Test Frontend

Sau khi migration thành công, frontend sẽ tự động sử dụng views mới.

### Test 1: Trang Shipments
```
Vào: http://localhost:3000/admin/shipments
```

**Verify:**
- Trang load thành công
- Hiển thị danh sách shipments
- Product codes hiển thị (nếu có)

### Test 2: Tạo Order Mới
```
1. Tạo order mới từ frontend
2. Check trong database:
   SELECT * FROM order_items WHERE order_id = 'new-order-id';
```

**Expected:**
- `product_code` tự động được fill ✅
- `weight_g` tự động được fill ✅

### Test 3: Tạo Shipment
```
1. Xác nhận đơn hàng (chuyển status → processing)
2. Check shipment:
   SELECT * FROM v_shipments_full WHERE order_id = 'order-id';
```

**Expected:**
- `receiver_name` tự động fill từ orders ✅
- `product_codes` tự động fill từ order_items ✅
- `package_weight_g` tự động calculate ✅

---

## 🐛 Troubleshooting

### Lỗi: View không tồn tại
```
ERROR: relation "v_shipments_full" does not exist
```

**Fix:** Chạy lại migration `link_products_orders_shipments.sql`

### Lỗi: Trigger không chạy
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_sync_order_item_info';

-- Nếu không có, chạy lại phần tạo trigger trong migration
```

### Lỗi: Frontend không load data
```
Mở Console (F12) → Tab Network
Check request đến /rest/v1/v_shipments_full
Xem response error
```

**Common issues:**
- RLS policies chưa grant SELECT cho view
- View chưa được tạo
- Data structure không match

---

## 📞 Nếu Gặp Vấn Đề

1. Check Supabase logs
2. Check browser console errors
3. Verify migration đã chạy thành công
4. Test từng query SQL riêng lẻ

---

## ✅ Checklist

- [ ] Đã chạy `link_products_orders_shipments.sql`
- [ ] Đã verify views tồn tại
- [ ] Đã verify triggers tồn tại
- [ ] Đã verify data đã migrate
- [ ] Frontend load thành công
- [ ] Tạo order mới → product_code auto-fill
- [ ] Tạo shipment → receiver info auto-fill
