import React, { useEffect, useState, useCallback, useRef } from "react";
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

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [alertState, setAlertState] = useState({
    message: null,
    type: "success",
  });
  const widgetRef = useRef(null);

  const orderNumber = location.state?.orderNumber;

  const showAlert = useCallback((message, type) => {
    setAlertState({ message, type });
    setTimeout(() => setAlertState({ message: null, type: "success" }), 5000);
  }, []);

  const handleCloseAlert = useCallback(() => {
    setAlertState({ message: null, type: "success" });
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDateForZNS = (dateString) => {
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

  const handleManualZNSConsent = async () => {
    if (!order) {
      showAlert("❌ Không tìm thấy thông tin đơn hàng", "error");
      return;
    }

    try {
      const orderData = {
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        zalo_user_id: order.customer_phone.replace(/^0/, "84"),
        order_date: formatDateForZNS(order.created_at),
        order_status: getOrderStatus(order.status),
      };

      const response = await fetch(
        "https://ftqwpsftzbagidoudwoq.supabase.co/functions/v1/chatbot-process",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: "SEND_ORDER_ZNS",
            payload: orderData,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        showAlert(
          "✅ Đã đăng ký nhận thông báo qua Zalo!",
          "success"
        );
      } else {
        showAlert(
          `⚠️ ${result.error || "Có lỗi xảy ra"}`,
          "error"
        );
      }
    } catch (error) {
      showAlert(
        "❌ Không thể kết nối. Vui lòng thử lại sau.",
        "error"
      );
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice =
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent.toLowerCase()
        );
      setIsMobile(isMobileDevice);
    };
    checkMobile();
  }, []);

  useEffect(() => {
    if (!orderNumber) {
      navigate("/");
      return;
    }
    const fetchOrder = async () => {
      const { data, error } = await getOrderByNumber(orderNumber);
      if (!error && data) {
        setOrder(data);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderNumber, navigate]);

  // ✅ FINAL FIX: Proper Zalo SDK loading
  useEffect(() => {
    if (!order || isMobile) return;

    // Clean up existing scripts
    const existingScripts = document.querySelectorAll(
      'script[src*="zalo.me"]'
    );
    existingScripts.forEach((s) => s.remove());

    // Define callback BEFORE loading SDK
    window.handleZaloConsent = function (response) {
      console.log("Zalo response:", response);
      
      const { action, error, data, user_id } = response || {};

      if (action === "loaded_successfully") return;

      if (action === "click_interaction_accepted" || error === 0) {
        const zaloUserId = user_id || data?.user_id_by_app || order.customer_phone;

        if (zaloUserId) {
          localStorage.setItem("zalo_user_id", zaloUserId);
        }

        const orderData = {
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          zalo_user_id: zaloUserId,
          order_date: formatDateForZNS(order.created_at),
          order_status: getOrderStatus(order.status),
        };

        fetch(
          "https://ftqwpsftzbagidoudwoq.supabase.co/functions/v1/chatbot-process",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              action: "SEND_ORDER_ZNS",
              payload: orderData,
            }),
          }
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              showAlert("✅ Đã đăng ký nhận thông báo Zalo!", "success");
            } else {
              showAlert("⚠️ Có lỗi xảy ra.", "error");
            }
          })
          .catch(() => {
            showAlert("❌ Không thể kết nối.", "error");
          });
      } else if (action === "click_interaction_declined") {
        showAlert("Bạn đã từ chối nhận thông báo.", "warning");
      }
    };

    // Load SDK after a short delay to ensure DOM is ready
    setTimeout(() => {
      const script = document.createElement("script");
      script.src = "https://sp.zalo.me/plugins/sdk.js";
      script.async = true;
      script.onload = () => {
        console.log("Zalo SDK loaded");
        // Parse the widget after SDK loads
        if (window.ZaloSocialSDK) {
          setTimeout(() => {
            window.ZaloSocialSDK.parse();
          }, 500);
        }
      };
      document.body.appendChild(script);
    }, 1000);

    return () => {
      delete window.handleZaloConsent;
    };
  }, [order, isMobile, showAlert]);

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
        <div className="text-center mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Đặt Hàng Thành Công!</h1>
          <p className="text-gray-600">
            Cảm ơn bạn đã mua hàng. Chúng tôi đã nhận được đơn hàng của bạn.
          </p>
        </div>

        {/* Zalo Consent Widget */}
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
                📱 Nhận thông báo qua Zalo
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Đồng ý nhận thông báo cập nhật đơn hàng qua Zalo OA
              </p>

              {isMobile ? (
                <button
                  onClick={handleManualZNSConsent}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md"
                >
                  ✓ Đồng ý nhận thông báo
                </button>
              ) : (
                <div
                  ref={widgetRef}
                  className="zalo-consent-widget"
                  data-callback="handleZaloConsent"
                  data-oaid="870752253827008707"
                  data-user-external-id={order.customer_phone}
                  data-appid="2783779431140209468"
                  data-reason-msg="Nhan thong bao don hang"
                ></div>
              )}

              <p className="text-xs text-blue-600 mt-3">
                ✓ Cập nhật trạng thái giao hàng
                <br />✓ Ưu đãi độc quyền
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
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

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Thông tin người nhận:</h3>
            <div className="text-sm space-y-1 text-gray-700">
              <p><strong>Họ tên:</strong> {order.customer_name}</p>
              <p><strong>SĐT:</strong> {order.customer_phone}</p>
              <p><strong>Email:</strong> {order.customer_email}</p>
              <p><strong>Địa chỉ:</strong> {order.shipping_address}, {order.shipping_ward}, {order.shipping_district}, {order.shipping_city}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Sản phẩm:</h3>
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
                    <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                <span>- {formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold">
              <span>Tổng cộng:</span>
              <span className="text-red-600">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
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
                <p className="font-medium">Đang chuẩn bị</p>
                <p className="text-sm text-gray-500">Chờ xử lý</p>
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">Đang giao</p>
                <p className="text-sm text-gray-500">Chờ xử lý</p>
              </div>
            </div>
          </div>
        </div>

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

        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="mb-2">
            Email: <strong>{order.customer_email}</strong>
          </p>
          <p>Hotline: <strong>036 2014571</strong></p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;