import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserOrders } from '../../lib/api/user';
import { Loader2, ShoppingBag, Package, Eye, Filter, User } from 'lucide-react';

// Config trạng thái với icon và màu gradient
const STATUS_CONFIG = {
  pending: { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-900', icon: Package },
  processing: { label: 'Đang chuẩn bị', color: 'bg-blue-100 text-blue-900', icon: Package },
  shipping: { label: 'Đang giao', color: 'bg-purple-100 text-purple-900', icon: Package },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-900', icon: Package },
  cancelled: { label: 'Đã huỷ', color: 'bg-red-100 text-red-900', icon: Package }
};

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const formatDate = (date) =>
  new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

const getOrderItemsCount = (order) =>
  order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full font-bold text-xs shadow ${config.color}`}>
      <Icon size={13} />
      {config.label}
    </span>
  );
};

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { loadOrders(); }, []);
  useEffect(() => { filterOrders(); }, [statusFilter, orders]);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await getUserOrders(user.id);
    if (data) {
      setOrders(data);
      setFilteredOrders(data);
    }
    setLoading(false);
  };

  const filterOrders = () => {
    if (statusFilter === 'all') setFilteredOrders(orders);
    else setFilteredOrders(orders.filter(order => order.status === statusFilter));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-14 h-14 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-7 pb-5 border-b border-gray-200 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold mb-1 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
            Lịch sử đơn hàng
          </h2>
          <p className="text-gray-600">Xem và theo dõi các đơn hàng đã đặt</p>
        </div>
        {/* Filter */}
        <div className="relative min-w-[180px]">
          <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl border border-gray-300 shadow bg-white"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Đang chờ</option>
            <option value="processing">Đang chuẩn bị</option>
            <option value="shipping">Đang giao</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã huỷ</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-24">
          <ShoppingBag size={72} className="mx-auto text-gray-200 mb-5" />
          <div className="font-bold text-xl text-gray-900 mb-3">
            {statusFilter === 'all' ? 'Chưa có đơn hàng nào' : `Không có đơn hàng ${STATUS_CONFIG[statusFilter]?.label?.toLowerCase() || ''}`}
          </div>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'all'
              ? 'Bắt đầu mua sắm để thấy đơn hàng của bạn xuất hiện tại đây'
              : 'Hãy chọn bộ lọc khác để xem đơn hàng'}
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition font-bold"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl transition bg-white shadow-sm"
            >
              <div className="bg-gradient-to-r from-gray-50 to-white px-7 py-4 flex flex-wrap items-center justify-between gap-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center gap-5">
                  <div>
                    <p className="text-xs text-gray-500">Mã đơn hàng</p>
                    <p className="font-mono font-medium text-lg tracking-wider">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ngày đặt</p>
                    <p className="font-semibold">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tổng tiền</p>
                    <p className="font-bold text-green-700">{formatPrice(order.total_amount)}</p>
                  </div>
                  {/* Thêm Customer nếu là admin */}
                  {user.isAdmin && (
                    <div>
                      <p className="text-xs text-gray-500">Khách hàng</p>
                      <div className="flex items-center gap-1">
                        <User size={13} />
                        <span className="font-medium">{order.customer_name || 'Guest'}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="flex items-center gap-2 px-5 py-2 bg-gray-50 border border-gray-300 rounded-xl hover:bg-white transition text-sm font-bold"
                  >
                    <Eye size={16} />
                    Chi tiết
                  </Link>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="p-7">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Package size={16} />
                  <span>{getOrderItemsCount(order)} sản phẩm</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {order.order_items?.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <img
                        src={item.products?.product_images?.[0]?.image_url || '/placeholder.png'}
                        alt={item.products?.name}
                        className="w-14 h-14 object-cover rounded-xl shadow"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.products?.name}</p>
                        <p className="text-xs text-gray-500">SL: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.order_items?.length > 4 && (
                    <div className="flex items-center justify-center text-gray-500 text-sm">
                      +{order.order_items.length - 4} sản phẩm nữa
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <div className="mt-10 pt-5 border-t border-gray-200 text-sm flex flex-col md:flex-row items-center justify-between">
          <span className="text-gray-700 mb-2 md:mb-0">
            Hiển thị <strong>{filteredOrders.length}</strong> / <strong>{orders.length}</strong> đơn hàng
          </span>
          <span className="text-gray-700">
            Tổng đã chi: <strong className="text-green-700">{formatPrice(
              filteredOrders
                .filter(o => o.status === 'completed')
                .reduce((sum, order) => sum + order.total_amount, 0)
            )}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
