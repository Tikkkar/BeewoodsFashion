import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminOrderDetails, updateOrderStatus } from '../../lib/api/admin';
// Đầu file, sửa lại như sau:
import { Loader2, Package, Truck, CheckCircle, XCircle, User, MapPin, Mail, CreditCard, Phone } from 'lucide-react';


const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price) || 0);

const statusMeta = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-50 text-yellow-700", icon: Package },
  processing: { label: "Đang chuẩn bị", color: "bg-blue-50 text-blue-700", icon: Package },
  shipping: { label: "Đang giao hàng", color: "bg-purple-50 text-purple-700", icon: Truck },
  completed: { label: "Đã giao thành công", color: "bg-green-50 text-green-700", icon: CheckCircle },
  cancelled: { label: "Đã hủy", color: "bg-red-50 text-red-700", icon: XCircle }
};

const ORDER_STATUSES = Object.keys(statusMeta);

const AdminOrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = async () => {
    setLoading(true);
    const { data } = await getAdminOrderDetails(id);
    setOrder(data || null);
    setLoading(false);
  };

  useEffect(() => { loadOrder(); }, [id]);

  const handleStatusUpdate = async (e) => {
    await updateOrderStatus(id, e.target.value);
    loadOrder();
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-12 h-12 animate-spin text-black" /></div>;
  if (!order) return <div className="text-center py-12 text-gray-700 text-xl">Không tìm thấy đơn hàng</div>;

  const meta = statusMeta[order.status] || statusMeta.pending;
  const StatusIcon = meta.icon;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header - Back link + Order Number + Status */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <Link to="/admin/orders" className="text-md text-blue-600 hover:underline">&larr; Quay lại danh sách đơn</Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-2xl font-bold">Đơn {order.order_number}</span>
          <span className={`px-4 py-1 rounded-lg border inline-flex items-center gap-2 ${meta.color} font-semibold`}>
            <StatusIcon size={18} />{meta.label}
          </span>
          <select value={order.status} onChange={handleStatusUpdate} 
            className="ml-3 border text-sm p-2 rounded-lg bg-white shadow-sm"
          >
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{statusMeta[s].label}</option>)}
          </select>
        </div>
      </div>

      {/* Timeline Status */}
      <div className="flex gap-10 items-center justify-center my-3">
        {ORDER_STATUSES.map((st, idx) => (
          <div key={st} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status === st ? statusMeta[st].color : "bg-gray-200 text-gray-500"}`}>
              {React.createElement(statusMeta[st].icon, {size:24})}
            </div>
            <div className={`mt-1 text-xs font-medium ${order.status === st ? "text-black" : "text-gray-400"}`}>{statusMeta[st].label}</div>
            {idx < ORDER_STATUSES.length-1 && <div className="w-10 h-1 mx-1 bg-gray-200 rounded-full"></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="col-span-2 bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Sản phẩm đã đặt</h2>
          <ul className="divide-y divide-gray-200">
            {order.order_items.map(item => (
              <li key={item.id} className="py-3 flex gap-4 items-center">
                <img src={item.products?.product_images?.[0]?.image_url || "/placeholder.png"} 
                  alt={item.products?.name} className="w-14 h-14 rounded-md object-cover border" />
                <div className="flex-1">
                  <p className="font-semibold">{item.products?.name}</p>
                  <p className="text-xs text-gray-500">SL: {item.quantity} | Size: {item.size}</p>
                </div>
                <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="pt-4 mt-4 border-t border-gray-200 text-right space-y-1 text-lg">
            <div>Tạm tính: <span className="font-medium">{formatPrice(order.subtotal)}</span></div>
            {Number(order.discount_amount) > 0 && (
              <div>Giảm giá: <span className="font-medium text-green-600">- {formatPrice(order.discount_amount)}</span></div>
            )}
            <div>Phí vận chuyển: <span className="font-medium">{formatPrice(order.shipping_fee)}</span></div>
            <div className="text-xl font-bold mt-2">Tổng cộng: <span className="text-red-600">{formatPrice(order.total_amount)}</span></div>
          </div>
        </div>
        
        {/* Customer Info & Address */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User size={22}/> Thông tin khách hàng</h2>
            <p className="font-semibold">{order.customer_name}</p>
            <p className="text-sm text-gray-600 flex items-center gap-2"><Mail size={16} />{order.customer_email || "Chưa có email"}</p>
            <p className="text-sm text-gray-600 flex items-center gap-2"><Phone size={16} />{order.customer_phone}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><MapPin size={22}/> Địa chỉ giao hàng</h2>
            <p className="text-sm text-gray-700">{order.shipping_address}, {order.shipping_ward}, {order.shipping_district}, {order.shipping_city}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard size={22}/> Thanh toán</h2>
            <p className="flex items-center gap-2">Phương thức: <span className="font-semibold">{order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.payment_method}</span></p>
            <p className="flex items-center gap-2">Trạng thái: <span className={order.payment_status === 'paid' ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>{order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
