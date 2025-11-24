# Hướng dẫn chạy Migration Auto-Sync Shipments

## Cách 1: Sử dụng Supabase Dashboard (Khuyến nghị)

1. Truy cập Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor** (biểu tượng database ở sidebar)
4. Tạo một query mới
5. Copy toàn bộ nội dung file `migrations/auto_sync_shipments.sql`
6. Paste vào SQL Editor
7. Nhấn **Run** hoặc `Ctrl + Enter`

## Cách 2: Sử dụng Supabase CLI

```bash
# Cài đặt Supabase CLI (nếu chưa có)
npm install -g supabase

# Link project
supabase link --project-ref ftqwpsftzbagidoudwoq

# Chạy migration
supabase db push

# Hoặc chạy trực tiếp file SQL
supabase db execute -f migrations/auto_sync_shipments.sql
```

## Cách 3: Sử dụng psql (PostgreSQL CLI)

```bash
# Lấy connection string từ Supabase Dashboard > Settings > Database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.ftqwpsftzbagidoudwoq.supabase.co:5432/postgres" -f migrations/auto_sync_shipments.sql
```

## Sau khi chạy migration

Migration sẽ tự động:

1. ✅ Tạo function `sync_shipment_from_order()` để tự động sync dữ liệu
2. ✅ Tạo trigger `trigger_sync_shipment_from_order` áp dụng cho mọi INSERT/UPDATE
3. ✅ Tạo function `update_existing_shipments()` để cập nhật dữ liệu cũ
4. ✅ Tạo view `v_shipments_full` để xem dữ liệu đầy đủ
5. ✅ Tạo các index để tối ưu performance

## Cập nhật dữ liệu hiện có

Sau khi chạy migration, chạy câu lệnh sau để cập nhật tất cả shipments hiện có:

```sql
SELECT * FROM update_existing_shipments();
```

## Kiểm tra kết quả

```sql
-- Xem shipments với đầy đủ thông tin
SELECT * FROM v_shipments_full LIMIT 10;

-- Kiểm tra trigger đã được tạo
SELECT * FROM pg_trigger WHERE tgname = 'trigger_sync_shipment_from_order';

-- Kiểm tra function
SELECT proname FROM pg_proc WHERE proname IN ('sync_shipment_from_order', 'update_existing_shipments');
```

## Lưu ý

- Migration này an toàn và không xóa dữ liệu hiện có
- Chỉ cập nhật các trường NULL hoặc rỗng
- Từ giờ mọi shipment mới sẽ tự động được sync thông tin từ orders và products
