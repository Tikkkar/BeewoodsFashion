import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-4">Không tìm thấy đơn hàng</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-light tracking-widest mb-2">
              ĐẶT HÀNG THÀNH CÔNG!
            </h1>
            <p className="text-gray-600">
              Cảm ơn bạn đã mua hàng tại DIOR
            </p>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-light tracking-widest mb-4">
              THÔNG TIN ĐƠN HÀNG
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between pb-3 border-b">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-medium">#{order.id}</span>
              </div>
              <div className="flex justify-between pb-3 border-b">
                <span className="text-gray-600">Ngày đặt:</span>
                <span className="font-medium">
                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-bold text-lg">{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between pb-3 border-b">
                <span className="text-gray-600">Phương thức thanh toán:</span>
                <span className="font-medium">
                  {order.paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản'}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-light tracking-widest mb-4">
              THÔNG TIN GIAO HÀNG
            </h2>

            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Người nhận:</span> <span className="font-medium">{order.fullName}</span></p>
              <p><span className="text-gray-600">Số điện thoại:</span> <span className="font-medium">{order.phone}</span></p>
              <p><span className="text-gray-600">Email:</span> <span className="font-medium">{order.email}</span></p>
              <p><span className="text-gray-600">Địa chỉ:</span> <span className="font-medium">
                {order.address}, {order.district}, {order.city}
              </span></p>
              {order.note && (
                <p><span className="text-gray-600">Ghi chú:</span> <span className="font-medium">{order.note}</span></p>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-light tracking-widest mb-4">
              SẢN PHẨM
            </h2>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                    {item.size && (
                      <p className="text-sm text-gray-600">Size: {item.size}</p>
                    )}
                    <p className="font-medium mt-2">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Package size={20} />
              Các bước tiếp theo
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Chúng tôi đã gửi email xác nhận đến {order.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Đơn hàng sẽ được xử lý trong 24h</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Bạn sẽ nhận được thông báo khi đơn hàng được giao</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Home size={20} />
              Về trang chủ
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package size={20} />
              Tiếp tục mua sắm
            </button>
          </div>

          {/* Support */}
          <div className="text-center mt-8 text-sm text-gray-600">
            <p>Cần hỗ trợ? Liên hệ với chúng tôi:</p>
            <p className="font-medium mt-1">Hotline: 1900 1234 | Email: support@dior.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;