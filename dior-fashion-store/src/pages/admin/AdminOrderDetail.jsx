import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminOrderDetails, updateOrderStatus } from '../../lib/api/admin';
import { Loader2 } from 'lucide-react';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
const ORDER_STATUSES = ['pending', 'processing', 'shipping', 'completed', 'cancelled'];

const AdminOrderDetail = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadOrder = async () => {
        setLoading(true);
        const { data } = await getAdminOrderDetails(id);
        if (data) setOrder(data);
        setLoading(false);
    };

    useEffect(() => { loadOrder(); }, [id]);

    const handleStatusUpdate = async (e) => {
        await updateOrderStatus(id, e.target.value);
        loadOrder();
    };

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-12 h-12 animate-spin text-black" /></div>;
    if (!order) return <div>Order not found.</div>;

    return (
        <div className="space-y-6">
            <div>
                <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">&larr; Back to Orders</Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
                        <p className="text-gray-500">Placed on {new Date(order.created_at).toLocaleString('vi-VN')}</p>
                    </div>
                    <select value={order.status} onChange={handleStatusUpdate} className="p-2 border rounded-md capitalize bg-white">
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">Order Items</h2>
                    <ul className="divide-y divide-gray-200">
                        {order.order_items.map(item => (
                            <li key={item.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{item.products.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity} | Size: {item.size}</p>
                                </div>
                                <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                            </li>
                        ))}
                    </ul>
                    <div className="pt-4 mt-4 border-t border-gray-200 text-right">
                        <p className="font-bold text-lg">Total: {formatPrice(order.total_amount)}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-bold mb-4">Customer</h2>
                        <p className="font-medium">{order.shipping_address?.name}</p>
                        <p className="text-sm text-gray-600">{order.users?.email || order.shipping_address?.email}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                        <address className="not-italic text-sm text-gray-600">
                            {order.shipping_address?.address}<br/>
                            {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}<br/>
                            {order.shipping_address?.country}
                        </address>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetail;