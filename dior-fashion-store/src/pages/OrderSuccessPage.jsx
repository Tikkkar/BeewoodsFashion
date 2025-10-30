import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle,
  Package,
  Truck,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { getOrderByNumber } from "../lib/api/orders";

// --- CUSTOM ALERT COMPONENT ---
const CustomAlert = ({ message, type, onClose }) => {
  const bgColor =
    type === "success"
      ? "bg-green-100"
      : type === "error"
      ? "bg-red-100"
      : "bg-yellow-100";
  const textColor =
    type === "success"
      ? "text-green-800"
      : type === "error"
      ? "text-red-800"
      : "text-yellow-800";
  const borderColor =
    type === "success"
      ? "border-green-400"
      : type === "error"
      ? "border-red-400"
      : "border-yellow-400";
  const Icon =
    type === "error" || type === "warning" ? AlertTriangle : CheckCircle;

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div
        className={`shadow-2xl max-w-sm w-full p-4 rounded-lg border-l-4 ${bgColor} ${textColor} ${borderColor}`}
        role="alert"
      >
        <div className="flex items-start">
          <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm font-medium flex-1">{message}</div>
          <button
            onClick={onClose}
            className={`ml-4 ${textColor} hover:text-gray-600 transition`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
// --- END CUSTOM ALERT COMPONENT ---

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertState, setAlertState] = useState({
    message: null,
    type: "success",
  });

  const orderNumber = location.state?.orderNumber;

  // Function to show custom alert message
  const showAlert = useCallback((message, type) => {
    setAlertState({ message, type });
    // Tự động đóng sau 5 giây
    setTimeout(() => setAlertState({ message: null, type: "success" }), 5000);
  }, []); // Sử dụng useCallback để ổn định hàm

  const handleCloseAlert = useCallback(() => {
    setAlertState({ message: null, type: "success" });
  }, []);

  useEffect(() => {
    if (!orderNumber) {
      navigate("/");
      return;
    }

    const fetchOrder = async () => {
      const { data, error } = await getOrderByNumber(orderNumber);

      if (error) {
        console.error("Error fetching order:", error);
      } else {
        setOrder(data);
      }

      setLoading(false);
    };

    fetchOrder();
  }, [orderNumber, navigate]);

  // Khởi tạo Zalo Consent Widget và định nghĩa callback
  useEffect(() => {
    if (!order) return; // Đảm bảo order đã load xong

    // ✅ Định nghĩa global callback function cho Zalo SDK
    window.handleZaloConsent = function (response) {
      console.log("🔔 Zalo Consent Response:", response);

      // --- SỬA LỖI 1: Bỏ qua các thông báo trạng thái không phải là kết quả cuối cùng ---
      // Nếu response là một hành động trạng thái (state action) hoặc không có lỗi,
      // thì không xử lý như một sự kiện đồng ý/hủy cuối cùng.
      if (
        response.action === "loaded_successfully" ||
        response.action === "click_interaction_accepted" ||
        response.error === undefined
      ) {
        // Log để debug nhưng không xử lý logic tiếp theo
        console.log("Zalo SDK action:", response.action || "Status update");
        return;
      }
      // --- KẾT THÚC SỬA LỖI 1 ---

      if (response.error === 0) {
        // Trường hợp người dùng đồng ý (error: 0)
        const zaloUserId = response.data.user_id_by_app;
        localStorage.setItem("zalo_user_id", zaloUserId);

        console.log("✅ Consent granted, sending ZNS...");

        // Gửi request đến backend
        const orderData = {
          order_number: order?.order_number || "",
          customer_name: order?.customer_name || "",
          customer_phone: order?.customer_phone || "",
          zalo_user_id: zaloUserId,
          order_date: order?.created_at
            ? formatDateForZNS(order.created_at)
            : "",
          order_status: order?.status
            ? getOrderStatus(order.status)
            : "Đang xử lý",
        };

        // ✅ URL Supabase Function
        fetch(
          "https://ftqwpsftzbagidoudwoq.supabase.co/functions/v1/chatbot-process",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cXdwc2Z0emJhZ2lkb3Vkd29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3NjIwOTQsImV4cCI6MjA0NTMzODA5NH0.DpjLxzE-5bRkE6zQXWA8b77C-5kZqNIHvBcl5pf5Yeo",
            },
            body: JSON.stringify({
              action: "SEND_ORDER_ZNS",
              payload: orderData,
            }),
          }
        )
          .then((res) => res.json())
          .then((data) => {
            console.log("✅ ZNS sent successfully:", data);
            showAlert(
              "✅ Đã đồng ý nhận thông báo! Bạn sẽ nhận được cập nhật đơn hàng qua Zalo.",
              "success"
            );
          })
          .catch((err) => {
            console.error("❌ Error sending ZNS:", err);
            showAlert(
              "⚠️ Có lỗi xảy ra khi đăng ký thông báo. Vui lòng thử lại sau.",
              "error"
            );
          });
      } else {
        // Trường hợp lỗi (bao gồm cả hủy đồng ý)
        console.error("❌ Zalo consent error:", response);
        if (response.error === 3) {
          showAlert(
            "⚠️ Bạn đã hủy đồng ý. Vui lòng thử lại nếu muốn nhận thông báo.",
            "warning"
          );
        } else {
          showAlert("⚠️ Có lỗi xảy ra. Vui lòng thử lại sau.", "error");
        }
      }
    };

    // Debug logs
    console.log("🔍 Zalo Debug:");
    console.log("- Order:", order);
    console.log("- ZaloSDK loaded:", !!window.ZaloSocialSDK);
    console.log("- Callback defined:", !!window.handleZaloConsent);

    let timer;

    // --- SỬA LỖI 2: Tăng độ trễ cho reload để đảm bảo DOM của widget đã sẵn sàng ---
    if (window.ZaloSocialSDK) {
      console.log("🔄 Reloading Zalo SDK for Consent Widget...");
      // Tăng timeout lên 500ms để đảm bảo React đã hoàn tất việc render DOM của widget
      // và widget iframe đã kịp load, giảm thiểu lỗi 'postMessage'
      timer = setTimeout(() => {
        // Kiểm tra an toàn lần nữa trước khi gọi reload
        if (window.ZaloSocialSDK) {
          window.ZaloSocialSDK.reload();
        } else {
          console.warn("ZaloSocialSDK not found inside timeout.");
        }
      }, 1000); // Đã tăng lên 500ms
    } else {
      console.warn("ZaloSocialSDK not loaded when useEffect ran.");
    }
    // --- KẾT THÚC SỬA LỖI 2 ---

    // Cleanup: Xóa callback và timeout
    return () => {
      clearTimeout(timer);
      // Xóa callback trên global window khi component unmount
      if (window.handleZaloConsent) {
        delete window.handleZaloConsent;
      }
    };
    // --- SỬA LỖI 3: Thêm showAlert vào dependency array để đảm bảo useCallback hoạt động đúng ---
  }, [order, showAlert]);
  // --- KẾT THÚC SỬA LỖI 3 ---

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDateForZNS = (dateString) => {
    // Format: DD/MM/YYYY
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getOrderStatus = (status) => {
    const statusMap = {
      pending: "Chờ xác nhận",
      processing: "Đang xử lý",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao hàng",
      delivered: "Đã giao hàng",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || "Đang xử lý";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Không tìm thấy đơn hàng</p>
          <Link to="/" className="text-black underline">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <CustomAlert
        message={alertState.message}
        type={alertState.type}
        onClose={handleCloseAlert}
      />
      <div className="max-w-3xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Đặt Hàng Thành Công!</h1>
          <p className="text-gray-600">
            Cảm ơn bạn đã mua hàng. Chúng tôi đã nhận được đơn hàng của bạn.
          </p>
        </div>

        {/* Zalo ZNS Consent Widget */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-md p-6 mb-6 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                className="w-12 h-12"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="24" cy="24" r="24" fill="#0068FF" />
                <path
                  d="M24 12C17.373 12 12 16.925 12 23c0 3.025 1.575 5.775 4.05 7.725v5.775l5.55-3.05c1.125.3 2.325.45 3.525.45 6.627 0 12-4.925 12-11 0-6.075-5.373-11-12.125-11z"
                  fill="white"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 text-blue-900">
                📱 Nhận thông báo đơn hàng qua Zalo
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Đồng ý để nhận thông báo cập nhật trạng thái đơn hàng và ưu đãi
                độc quyền qua Zalo OA. Hoàn toàn miễn phí!
              </p>

              {/* Zalo Consent Widget */}
              <div
                className="zalo-consent-widget"
                data-callback="handleZaloConsent"
                data-oaid="870752253827008707"
                data-user-external-id={order.customer_phone || order.id}
                data-appid="2783779431140209468"
                data-reason-msg={`thông báo đơn hàng ${order.order_number}`}
                data-status="show"
                style={{ minHeight: "60px" }}
              ></div>

              <p className="text-xs text-blue-600 mt-3">
                ✓ Nhận thông báo đơn hàng ngay lập tức
                <br />✓ Cập nhật trạng thái giao hàng theo thời gian thực
                <br />✓ Ưu đãi và khuyến mãi độc quyền
              </p>
            </div>
          </div>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-xl font-bold mb-2">Thông Tin Đơn Hàng</h2>
            <p className="text-gray-600">
              Mã đơn hàng:{" "}
              <span className="font-semibold text-black">
                {order.order_number}
              </span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Ngày đặt: {new Date(order.created_at).toLocaleDateString("vi-VN")}
            </p>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Thông tin người nhận:</h3>
            <div className="text-sm space-y-1 text-gray-700">
              <p>
                <strong>Họ tên:</strong> {order.customer_name}
              </p>
              <p>
                <strong>Số điện thoại:</strong> {order.customer_phone}
              </p>
              <p>
                <strong>Email:</strong> {order.customer_email}
              </p>
              <p>
                <strong>Địa chỉ:</strong> {order.shipping_address},{" "}
                {order.shipping_ward}, {order.shipping_district},{" "}
                {order.shipping_city}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Sản phẩm đã đặt:</h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-3">
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600">Size: {item.size}</p>
                    <p className="text-sm text-gray-600">SL: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span>Tạm tính:</span>
              <span>{formatPrice(order.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Phí vận chuyển:</span>
              <span>{formatPrice(order.shipping_fee || 0)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between mb-2">
                <span>Giảm giá:</span>
                <span>- {formatPrice(order.discount_amount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold">
              <span>Tổng cộng:</span>
              <span className="text-red-600">
                {formatPrice(order.total_amount || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Status Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold mb-4">Trạng Thái Đơn Hàng</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Đơn hàng đã được đặt</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-50">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">Đang chuẩn bị hàng</p>
                <p className="text-sm text-gray-500">Chờ xử lý</p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-50">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">Đang giao hàng</p>
                <p className="text-sm text-gray-500">Chờ xử lý</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="flex-1 bg-black text-white text-center py-3 rounded-lg hover:bg-gray-800 transition font-medium"
          >
            Tiếp Tục Mua Sắm
          </Link>
          <Link
            to="/products"
            className="flex-1 border-2 border-black text-center py-3 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Xem Sản Phẩm Khác
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="mb-2">
            Bạn có thể theo dõi đơn hàng qua email:{" "}
            <strong>{order.customer_email}</strong>
          </p>
          <p>
            Liên hệ: <strong>0962.209.4195</strong> nếu cần hỗ trợ
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
