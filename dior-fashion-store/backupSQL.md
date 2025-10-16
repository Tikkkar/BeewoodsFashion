-- Bước 1: Xóa bảng trung gian "product_categories" nếu nó tồn tại.
-- Thao tác này sẽ xóa bỏ cấu trúc nhiều-nhiều.
DROP TABLE IF EXISTS public.product_categories;

-- Bước 2: Thêm lại cột "category_id" vào bảng "products".
-- Cột này sẽ được dùng để lưu trữ mối quan hệ một-nhiều (mỗi sản phẩm chỉ có một danh mục).
ALTER TABLE public.products
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Ghi chú:
-- ON DELETE SET NULL: Nếu một danh mục bị xóa, các sản phẩm thuộc danh mục đó sẽ có category_id là NULL thay vì bị xóa theo.
-- Bạn cần vào trang Admin để gán lại danh mục cho từng sản phẩm sau khi chạy mã này.