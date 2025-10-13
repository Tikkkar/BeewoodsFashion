import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserOrders } from '../../lib/api/user';
import { Loader2, ShoppingBag, Package, Eye, Filter } from 'lucide-react';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { 
  style: 'currency', 
  currency: 'VND' 
}).format(price);

const formatDate = (date) => new Date(date).toLocaleDateString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
    shipping: { label: 'Shipping', color: 'bg-purple-100 text-purple-800' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
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

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [statusFilter, orders]);

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
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  };

  const getOrderItemsCount = (order) => {
    return order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold mb-1">Order History</h2>
          <p className="text-gray-600 text-sm">View and track your orders</p>
        </div>
        
        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent appearance-none bg-white cursor-pointer"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipping">Shipping</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'all' 
              ? 'Start shopping to see your orders here' 
              : 'Try changing the filter to see more orders'
            }
          </p>
          {statusFilter === 'all' && (
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              Start Shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
            >
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Order Number</p>
                    <p className="font-mono font-medium">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="font-bold">{formatPrice(order.total_amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                  <Link
                    to={`/profile/orders/${order.id}`}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition text-sm font-medium"
                  >
                    <Eye size={16} />
                    <span>View Details</span>
                  </Link>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Package size={16} />
                  <span>{getOrderItemsCount(order)} items</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {order.order_items?.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <img
                        src={item.products?.product_images?.[0]?.image_url || '/placeholder.png'}
                        alt={item.products?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.products?.name}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.order_items?.length > 4 && (
                    <div className="flex items-center justify-center text-gray-500 text-sm">
                      +{order.order_items.length - 4} more
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
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
            </span>
            <span className="text-gray-600">
              Total spent: <strong>{formatPrice(
                filteredOrders
                  .filter(o => o.status === 'completed')
                  .reduce((sum, order) => sum + order.total_amount, 0)
              )}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;