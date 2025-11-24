# Hướng Dẫn: Liên Kết Products ↔ Orders ↔ Shipments

## 🎯 Mục tiêu

Tạo hệ thống liên kết tự động giữa 3 bảng chính để:
- ✅ Tự động sync `product_code` từ `products` → `order_items` → `shipments`
- ✅ Tự động tính `total_weight` từ `products` → `order_items` → `shipments`
- ✅ Tự động fill thông tin receiver từ `orders` → `shipments`
- ✅ Tự động tính dimensions (lấy max) từ `products` → `shipments`

---

## 📊 Luồng Dữ Liệu

```
PRODUCTS (master data)
  ├─ product_code
  ├─ weight_g
  ├─ length_cm, width_cm, height_cm
  │
  ↓ (FK: product_id)
  │
ORDER_ITEMS (line items)
  ├─ product_code ← AUTO SYNC
  ├─ weight_g ← AUTO SYNC
  ├─ total_weight_g ← AUTO CALCULATE
  │
  ↓ (FK: order_id)
  │
ORDERS (header)
  ├─ customer_name
  ├─ customer_phone
  ├─ shipping_address
  ├─ total_amount
  │
  ↓ (FK: order_id)
  │
SHIPMENTS (logistics)
  ├─ receiver_name ← AUTO FROM orders
  ├─ receiver_phone ← AUTO FROM orders
  ├─ product_code ← AUTO FROM order_items
  ├─ package_weight_g ← AUTO CALCULATE
  ├─ package_length/width/height_cm ← AUTO MAX
  └─ cod_amount ← AUTO FROM orders
```

---

## 🔧 Các Thành Phần Đã Tạo

### 1. Triggers (Tự động hóa)

#### Trigger 1: `sync_order_item_product_info`
**Khi:** Tạo/update `order_items`  
**Làm gì:**
- Lấy `product_code` từ `products`
- Lấy `weight_g` từ `products`
- Tính `total_weight_g` = `quantity * weight_g`

**Ví dụ:**
```sql
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES ('...', '...', 2, 500000);

-- Tự động fill:
-- product_code = 'SP001' (từ products)
-- weight_g = 300 (từ products)
-- total_weight_g = 600 (2 * 300)
```

#### Trigger 2: `sync_shipment_from_order`
**Khi:** Tạo/update `shipments`  
**Làm gì:**
- Lấy `receiver_name`, `receiver_phone` từ `orders`
- Ghép `receiver_address_detail` từ `shipping_address + ward + district + city`
- Lấy `product_code` (comma-separated) từ `order_items`
- Tính `package_weight_g` = SUM(quantity * weight_g)
- Lấy `max(length_cm)`, `max(width_cm)`, `max(height_cm)` từ products
- Set `cod_amount` = `total_amount`
- Set `payment_method` = 'CC_CASH' nếu COD, 'PP_CASH' nếu prepaid

**Ví dụ:**
```sql
INSERT INTO shipments (order_id, carrier_code)
VALUES ('...', 'J&T');

-- Tự động fill:
-- receiver_name = 'Nguyễn Văn A'
-- receiver_phone = '0123456789'
-- receiver_address_detail = '123 Hàng Bạc, Hàng Bạc, Hoàn Kiếm, Hà Nội'
-- product_code = 'SP001, SP002'
-- package_weight_g = 1200
-- package_length_cm = 35 (max)
-- cod_amount = 1500000
```

---

### 2. Views (Truy vấn nhanh)

#### View 1: `v_orders_with_products`
Tổng hợp order với product details

**Columns:**
- `order_id`, `order_number`, `customer_name`
- `items` (JSON array of products)
- `total_items` (số lượng sản phẩm)
- `total_weight_g` (tổng trọng lượng)
- `product_codes` (danh sách mã SP)

**Usage:**
```sql
SELECT * FROM v_orders_with_products
WHERE order_number = 'BEWO-12345';
```

#### View 2: `v_shipments_full`
Tổng hợp shipment với order & product details

**Columns:**
- Shipment info (tracking, carrier, status)
- Order info (order_number, customer, address)
- Products (JSON array)
- `product_codes` (danh sách mã SP)
- `calculated_weight_g` (weight tính từ items)

**Usage:**
```sql
SELECT * FROM v_shipments_full
WHERE tracking_number = 'JT123456789';
```

---

### 3. Functions (Tiện ích)

#### Function 1: `get_order_products(order_id)`
Lấy danh sách products trong 1 order

**Returns:**
- `product_id`, `product_name`, `product_code`
- `size`, `quantity`
- `weight_g`, `total_weight_g`
- `length_cm`, `width_cm`, `height_cm`

**Usage:**
```sql
SELECT * FROM get_order_products('order-uuid-here');
```

#### Function 2: `calculate_order_weight(order_id)`
Tính tổng trọng lượng của order

**Returns:** INTEGER (gram)

**Usage:**
```sql
SELECT calculate_order_weight('order-uuid-here');
-- Result: 1200 (gram)
```

#### Function 3: `get_order_max_dimensions(order_id)`
Lấy kích thước lớn nhất trong order

**Returns:**
- `max_length_cm`
- `max_width_cm`
- `max_height_cm`

**Usage:**
```sql
SELECT * FROM get_order_max_dimensions('order-uuid-here');
-- Result: 35, 30, 15
```

---

## 📝 Cách Sử Dụng

### Scenario 1: Tạo đơn hàng mới

```javascript
// Frontend: Tạo order
const order = await createOrder({
  customer_name: 'Nguyễn Văn A',
  customer_phone: '0123456789',
  shipping_address: '123 Hàng Bạc',
  shipping_ward: 'Hàng Bạc',
  shipping_district: 'Hoàn Kiếm',
  shipping_city: 'Hà Nội',
  items: [
    { product_id: 'uuid-1', quantity: 2, size: 'M' },
    { product_id: 'uuid-2', quantity: 1, size: 'L' }
  ]
});

// ✅ Trigger tự động:
// - order_items.product_code = 'SP001', 'SP002'
// - order_items.weight_g = 300, 500
// - order_items.total_weight_g = 600, 500
```

### Scenario 2: Tạo shipment

```javascript
// Frontend: Xác nhận đơn → Tạo shipment
const shipment = await createShipment({
  order_id: order.id,
  carrier_code: 'J&T'
});

// ✅ Trigger tự động fill:
// - receiver_name = 'Nguyễn Văn A'
// - receiver_phone = '0123456789'
// - receiver_address_detail = '123 Hàng Bạc, Hàng Bạc, Hoàn Kiếm, Hà Nội'
// - product_code = 'SP001, SP002'
// - package_weight_g = 1100 (600 + 500)
// - package_length_cm = 35 (max của 2 sản phẩm)
// - cod_amount = 1500000
```

### Scenario 3: Xem chi tiết shipment

```javascript
// Frontend: Query view
const shipment = await supabase
  .from('v_shipments_full')
  .select('*')
  .eq('tracking_number', 'JT123456789')
  .single();

// Result bao gồm:
// - Shipment info
// - Order info
// - Products (JSON array với đầy đủ thông tin)
// - Calculated weight
```

---

## ✅ Checklist Triển Khai

### Bước 1: Chạy Migration
- [ ] Backup database
- [ ] Chạy `link_products_orders_shipments.sql`
- [ ] Verify triggers đã được tạo
- [ ] Verify views đã được tạo

### Bước 2: Test Triggers
- [ ] Tạo order_item mới → Check product_code auto-fill
- [ ] Tạo shipment mới → Check receiver info auto-fill
- [ ] Verify weight calculation

### Bước 3: Test Views
- [ ] Query `v_orders_with_products`
- [ ] Query `v_shipments_full`
- [ ] Verify JSON data structure

### Bước 4: Test Functions
- [ ] Call `get_order_products()`
- [ ] Call `calculate_order_weight()`
- [ ] Call `get_order_max_dimensions()`

### Bước 5: Update Frontend
- [ ] Cập nhật API để dùng views
- [ ] Cập nhật UI để hiển thị product_code
- [ ] Test end-to-end flow

---

## 🐛 Troubleshooting

### Issue 1: Trigger không chạy
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname LIKE '%sync%';

-- Re-create trigger
DROP TRIGGER IF EXISTS trigger_sync_order_item_info ON order_items;
-- Rồi chạy lại CREATE TRIGGER
```

### Issue 2: View trả về NULL
```sql
-- Check data exists
SELECT COUNT(*) FROM order_items WHERE product_code IS NOT NULL;

-- Re-run migration Part 5 (migrate dữ liệu cũ)
```

### Issue 3: Function lỗi
```sql
-- Check function exists
SELECT * FROM pg_proc WHERE proname LIKE '%order%';

-- Test function
SELECT get_order_products('valid-order-uuid');
```

---

## 📊 Performance Tips

1. **Indexes đã tạo:**
   - `idx_order_items_product_code`
   - `idx_order_items_order_id`
   - `idx_shipments_order_id`
   - `idx_products_product_code`

2. **Optimize queries:**
   ```sql
   -- Dùng view thay vì JOIN thủ công
   SELECT * FROM v_shipments_full WHERE ...
   
   -- Dùng function thay vì subquery
   SELECT calculate_order_weight(order_id) ...
   ```

3. **Caching:**
   - Cache views trong Redis (TTL 5 phút)
   - Invalidate cache khi order/shipment update

---

## 🎯 Kết Quả Mong Đợi

Sau khi triển khai:

✅ **Tự động hóa 100%:**
- Không cần thủ công copy product_code
- Không cần thủ công tính weight
- Không cần thủ công fill receiver info

✅ **Data consistency:**
- Product code luôn đồng bộ
- Weight luôn chính xác
- Dimensions luôn cập nhật

✅ **Performance:**
- Query nhanh hơn với views
- Giảm số lượng JOIN trong frontend
- Indexes tối ưu

✅ **Developer Experience:**
- API đơn giản hơn
- Ít bug hơn
- Dễ maintain hơn
