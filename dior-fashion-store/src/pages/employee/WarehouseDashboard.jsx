import React, { useState, useEffect } from 'react';
import { getWarehousePendingOrders, updateOrderStatus } from '../../lib/api/employees';
import { useRBAC } from '../../hooks/useRBAC';
import { Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const WarehouseDashboard = () => {
    const { user } = useRBAC();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingOrderId, setProcessingOrderId] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        const { data } = await getWarehousePendingOrders();
        if (data) {
            setOrders(data);
        }
        setLoading(false);
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        setProcessingOrderId(orderId);
        await updateOrderStatus(orderId, newStatus);
        await loadOrders();
        setProcessingOrderId(null);
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);

    const formatDate = (date) => new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const processingOrders = orders.filter(o => o.status === 'processing');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">
                    Chào mừng, {user?.full_name || user?.email}!
                </h1>
                <p className="text-green-100">
                    Vai trò: <span className="font-semibold">Nhân viên Kho</span>
                </p>
                <p className="text-sm text-green-200 mt-2">
                    Quản lý đóng gói và xuất kho đơn hàng
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending Orders */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">
                        {pendingOrders.length}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Đơn chờ xử lý</p>
                </div>

                {/* Processing Orders */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">
                        {processingOrders.length}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Đang đóng gói</p>
                </div>

                {/* Total */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Truck className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">
                        {orders.length}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Tổng đơn cần xử lý</p>
                </div>
            </div>

            {/* Pending Orders List */}
            {pendingOrders.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200 bg-yellow-50">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-yellow-600" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Đơn hàng chờ xử lý ({pendingOrders.length})
                                </h2>
                                <p className="text-sm text-gray-600">Cần bắt đầu đóng gói</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Mã đơn hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Khách hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Ngày đặt
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tổng tiền
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {pendingOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                to={`/admin/orders/${order.id}`}
                                                className="font-mono text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                {order.order_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{order.customer_name}</div>
                                            <div className="text-sm text-gray-500">{order.customer_phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatPrice(order.total_amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleUpdateStatus(order.id, 'processing')}
                                                disabled={processingOrderId === order.id}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
                                            >
                                                {processingOrderId === order.id ? 'Đang xử lý...' : 'Bắt đầu đóng gói'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Processing Orders List */}
            {processingOrders.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200 bg-blue-50">
                        <div className="flex items-center gap-3">
                            <Package className="w-6 h-6 text-blue-600" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Đang đóng gói ({processingOrders.length})
                                </h2>
                                <p className="text-sm text-gray-600">Sẵn sàng giao cho đơn vị vận chuyển</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Mã đơn hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Khách hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Địa chỉ giao hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tổng tiền
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {processingOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                to={`/admin/orders/${order.id}`}
                                                className="font-mono text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                {order.order_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{order.customer_name}</div>
                                            <div className="text-sm text-gray-500">{order.customer_phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {order.shipping_address}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatPrice(order.total_amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleUpdateStatus(order.id, 'shipping')}
                                                disabled={processingOrderId === order.id}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium flex items-center gap-2 ml-auto"
                                            >
                                                {processingOrderId === order.id ? (
                                                    'Đang xử lý...'
                                                ) : (
                                                    <>
                                                        <Truck className="w-4 h-4" />
                                                        Xuất kho
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {orders.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Tuyệt vời! Không có đơn hàng cần xử lý
                    </h3>
                    <p className="text-gray-600">
                        Tất cả đơn hàng đã được xử lý xong
                    </p>
                </div>
            )}
        </div>
    );
};

export default WarehouseDashboard;
