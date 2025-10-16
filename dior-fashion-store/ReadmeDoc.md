Các tính năng hiện có của web
Tính năng cho Khách hàng (Frontend & User Features)
Duyệt và tìm kiếm sản phẩm: Trang web có lưới sản phẩm với các chức năng tìm kiếm, lọc, sắp xếp và phân trang ( đang hoàn thiện để kết nối với data của backend). Ngoài ra còn có một cửa sổ xem nhanh sản phẩm.

Giỏ hàng và danh mục yêu thích: Người dùng có thể thêm sản phẩm vào giỏ hàng và danh sách yêu thích (wishlist), dữ liệu này được lưu vào database.

Thanh toán: Quy trình thanh toán hoàn chỉnh, dẫn đến một trang xác nhận đơn hàng thành công.

Quản lý tài khoản người dùng:

Hồ sơ: Xem, chỉnh sửa thông tin cá nhân và thay đổi mật khẩu.

Lịch sử đơn hàng: Xem lại tất cả các đơn hàng đã đặt, lọc theo trạng thái, theo dõi đơn hàng và có thể hủy các đơn hàng đang chờ xử lý.

Quản lý địa chỉ: Thêm, sửa, xóa các địa chỉ giao hàng và đặt địa chỉ mặc định.

Đánh giá sản phẩm: Gửi đánh giá cho sản phẩm với hệ thống xếp hạng sao và có huy hiệu "Verified purchase" (Đã xác minh mua hàng).

Tính năng cho Quản trị viên
Trang quản trị có một bảng điều khiển (dashboard) hoàn chỉnh và các công cụ quản lý.

Bảng điều khiển: Hiển thị các số liệu thống kê quan trọng như tổng doanh thu, tổng số đơn hàng, số sản phẩm đang hoạt động, và danh sách các sản phẩm bán chạy nhất.

Quản lý sản phẩm (CRUD): Thêm, sửa, xóa sản phẩm một cách toàn diện, bao gồm quản lý nhiều hình ảnh, kích thước (size), số lượng tồn kho và trạng thái (nổi bật, hoạt động/không hoạt động).

Quản lý danh mục (CRUD): Quản lý các danh mục sản phẩm, bao gồm cả việc tải lên hình ảnh cho từng danh mục.

Quản lý Banner (CRUD): Quản lý các banner quảng cáo trên trang chủ, cho phép thêm, sửa, xóa và sắp xếp lại thứ tự hiển thị.

Quản lý đơn hàng: Xem danh sách tất cả đơn hàng, tìm kiếm theo mã đơn hoặc thông tin khách hàng, lọc theo trạng thái và cập nhật trạng thái đơn hàng (ví dụ: đang xử lý, đang giao, đã hoàn thành).

Tính năng Hệ thống & Backend
Xác thực và phân quyền: Hệ thống đăng nhập/đăng ký bằng Email và Mật khẩu hoàn chỉnh. Có cơ chế phân quyền dựa trên vai trò (khách hàng/admin) và các tuyến đường được bảo vệ (protected routes) để chỉ người dùng có quyền mới có thể truy cập.

Cơ sở dữ liệu: Sử dụng Supabase với một lược đồ schema

Bảo mật: Chính sách bảo mật cấp độ hàng (Row Level Security - RLS) đã được cấu hình để đảm bảo người dùng chỉ có thể truy cập dữ liệu của chính họ và admin có toàn quyền.

Quản lý kho: Hệ thống tự động quản lý số lượng tồn kho sau khi một đơn hàng được tạo.

Hiện toàn bộ đều được quản lý trong 