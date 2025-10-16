import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserOrderDetail, cancelOrder } from '../../lib/api/user';
import { Loader2, ArrowLeft, Package, Truck, CheckCircle, XCircle, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';


const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { 
  style: 'currency', 
  currency: 'VND' 
}).format(price);


const formatDate = (date) => new Date(date).toLocaleString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});


const OrderDetailPage = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);


  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);


  const loadOrderDetail = async () => {
    setLoading(true);
    const { data } = await getUserOrderDetail(orderId, user.id);
    if (data) {
      setOrder(data);
    } else {
      navigate('/profile/orders');
    }
    setLoading(false);
  };


  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }


    setCancelling(true);
    const { success } = await cancelOrder(orderId, user.id);
    
    if (success) {
      loadOrderDetail();
    }
    
    setCancelling(false);
  };


  const getStatusInfo = (status) => {
    const statusConfig = {
      pending: { 
        label: 'Pending', 
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: Package,
        description: 'Your order is being processed'
      },
      processing: { 
        label: 'Processing', 
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: Package,
        description: 'We are preparing your order'
      },
      shipping: { 
        label: 'Shipping', 
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        icon: Truck,
        description: 'Your order is on the way'
      },
      completed: { 
        label: 'Completed', 
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CheckCircle,
        description: 'Order delivered successfully'
      },
      cancelled: { 
        label: 'Cancelled', 
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: XCircle,
        description: 'This order has been cancelled'
      }
    };
    
    return statusConfig[status] || statusConfig.pending;
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }


  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">Order not found</p>
        <Link to="/profile/orders" className="text-blue-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }


  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;


  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/profile/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition"
        >
          <ArrowLeft size={20} />
          <span>Back to Orders</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Order Details</h2>
            <p className="text-gray-600 font-mono">{order.order_number}</p>
          </div>
          
          {order.status === 'pending' && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>


      {/* Order Status */}
      <div className={`border-2 ${statusInfo.color} rounded-lg p-6`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <StatusIcon size={24} className={statusInfo.color.split(' ')[0]} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">{statusInfo.label}</h3>
            <p className="text-sm opacity-80">{statusInfo.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80 mb-1">Order Date</p>
            <p className="font-medium">{formatDate(order.created_at)}</p>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold">Order Items</h3>
            </div>
            <div className="p-6 space-y-4">
              {order.order_items?.map((item, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                  <img
                    src={item.products?.product_images?.[0]?.image_url || '/placeholder.png'}
                    alt={item.products?.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{item.products?.name}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {item.size && <p>Size: {item.size}</p>}
                      <p>Quantity: {item.quantity}</p>
                      <p className="font-medium text-black">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Order Summary & Shipping */}
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold">Order Summary</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg">{formatPrice(order.total_amount)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">COD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`font-medium ${
                    order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>
          </div>


          {/* Shipping Address */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold">Shipping Address</h3>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">{order.shipping_name}</p>
                  <p className="text-gray-600">{order.shipping_address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400" />
                <p className="text-gray-600">{order.shipping_phone}</p>
              </div>
              {order.shipping_email && (
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-400" />
                  <p className="text-gray-600">{order.shipping_email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default OrderDetailPage;