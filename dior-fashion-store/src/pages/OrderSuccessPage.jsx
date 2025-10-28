import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle, Package, Truck, Loader2 } from "lucide-react";
import { getOrderByNumber } from "../lib/api/orders";

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderNumber = location.state?.orderNumber;

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
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
      <div className="max-w-3xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Đặt Hàng Thành Công!</h1>
          <p className="text-gray-600">
            Cảm ơn bạn đã mua hàng. Chúng tôi đã nhận được đơn hàng của bạn.
          </p>
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
