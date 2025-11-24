import React, { useState, useEffect } from 'react';
import { getMyStats, getOrdersForEmployee } from '../../lib/api/employees';
import { useRBAC } from '../../hooks/useRBAC';
import { TrendingUp, DollarSign, ShoppingBag, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const SaleDashboard = () => {
    const { user, userRole } = useRBAC();
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);

        // Load stats
        const { data: statsData } = await getMyStats();
        if (statsData) {
            setStats(statsData);
        }

        // Load recent orders
        const { data: ordersData } = await getOrdersForEmployee({ limit: 5 });
        if (ordersData) {
            setRecentOrders(ordersData);
        }

        setLoading(false);
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);

    const formatDate = (date) => new Date(date).toLocaleDateString('vi-VN');

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
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">
                    Chào mừng, {user?.full_name || user?.email}!
                </h1>
                <p className="text-blue-100">
                    Vai trò: <span className="font-semibold">Nhân viên Sale</span>
                </p>
                <p className="text-sm text-blue-200 mt-2">
                    Bạn có thể xem và quản lý đơn hàng của mình trong 30 ngày gần nhất
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Today's Orders */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs text-gray-500">Hôm nay</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {stats?.orders_today || 0}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Đơn hàng</p>
                </div>

                {/* Today's Revenue */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-500">Hôm nay</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {formatPrice(stats?.revenue_today || 0)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Doanh thu</p>
                </div>

                {/* 30 Days Orders */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xs text-gray-500">30 ngày</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {stats?.orders_30d || 0}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Đơn hàng</p>
                </div>

                {/* 30 Days Revenue */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-yellow-600" />
                        </div>
                        <span className="text-xs text-gray-500">30 ngày</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {formatPrice(stats?.revenue_30d || 0)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Doanh thu</p>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h2>
                        <Link
                            to="/admin/orders"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Xem tất cả →
                        </Link>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {recentOrders.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p>Chưa có đơn hàng nào</p>
                        </div>
                    ) : (
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
                                        Ngày tạo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tổng tiền
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Trạng thái
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {recentOrders.map((order) => (
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                            order.status === 'shipping' ? 'bg-purple-100 text-purple-800' :
                                                                'bg-red-100 text-red-800'
                                                }`}>
                                                {order.status === 'completed' ? 'Hoàn thành' :
                                                    order.status === 'pending' ? 'Chờ xử lý' :
                                                        order.status === 'processing' ? 'Đang xử lý' :
                                                            order.status === 'shipping' ? 'Đang giao' :
                                                                'Đã hủy'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    to="/admin/orders"
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                            <ShoppingBag className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Quản lý Đơn hàng</h3>
                            <p className="text-sm text-gray-600">Xem và quản lý đơn hàng của bạn</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/admin/orders"
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Thống kê Chi tiết</h3>
                            <p className="text-sm text-gray-600">Xem báo cáo doanh số của bạn</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default SaleDashboard;
