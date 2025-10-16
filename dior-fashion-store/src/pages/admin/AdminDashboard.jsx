import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  DollarSign,
  Clock,
  Loader2,
  Search
} from 'lucide-react';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    productsWithSEO: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Single query for orders with minimal data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, order_number')
        .order('created_at', { ascending: false })
        .limit(50); // Limit to recent orders only

      if (ordersError) throw ordersError;

      // Calculate stats from limited data
      const totalRevenue = orders
        ?.filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;

      // Get products count (optimized - count only)
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get products with SEO data
      const { data: productsWithSEO } = await supabase
        .from('products')
        .select('id')
        .not('seo_title', 'is', null)
        .not('seo_description', 'is', null);

      setStats({
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        productsWithSEO: productsWithSEO?.length || 0
      });

      // Recent orders (already limited above)
      setRecentOrders(orders?.slice(0, 5) || []);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your store</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
          <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">From completed orders</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.completedOrders} completed</p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Pending Orders</p>
          <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Need attention</p>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Active Products</p>
          <p className="text-2xl font-bold">
            {stats.activeProducts} / {stats.totalProducts}
          </p>
          <p className="text-xs text-gray-500 mt-1">Products live</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No orders yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* SEO Manager - NEW & FEATURED */}
          <Link
            to="/admin/seo-manager"
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 hover:border-blue-400 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                NEW
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition">
              <Search className="text-blue-600" size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">SEO Manager</h3>
            <p className="text-sm text-gray-600 mb-3">
              Optimize SEO and content for products
            </p>
            <div className="flex items-center justify-between text-xs text-blue-600 font-medium">
              <span>{stats.productsWithSEO} / {stats.totalProducts} optimized</span>
              <TrendingUp size={14} />
            </div>
          </Link>

          <Link
            to="/admin/products/new"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-black hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition">
              <Package className="text-purple-600" size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">Add Product</h3>
            <p className="text-sm text-gray-600">Create a new product listing</p>
          </Link>

          <Link
            to="/admin/orders"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-black hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition">
              <ShoppingBag className="text-green-600" size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">Manage Orders</h3>
            <p className="text-sm text-gray-600">View and update order status</p>
          </Link>

          <Link
            to="/admin/categories"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-black hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition">
              <Package className="text-orange-600" size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">Categories</h3>
            <p className="text-sm text-gray-600">Manage product categories</p>
          </Link>

          <Link
            to="/admin/banners"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-black hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-200 transition">
              <TrendingUp className="text-pink-600" size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">Banners</h3>
            <p className="text-sm text-gray-600">Manage homepage banners</p>
          </Link>

        </div>
      </div>

      {/* SEO Status Overview */}
      {stats.totalProducts > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">SEO Optimization Status</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {stats.productsWithSEO} out of {stats.totalProducts} products have SEO optimization
              </p>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round((stats.productsWithSEO / stats.totalProducts) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.productsWithSEO / stats.totalProducts) * 100}%` }}
                  />
                </div>
              </div>

              {stats.productsWithSEO < stats.totalProducts && (
                <p className="text-xs text-blue-600 font-medium">
                  💡 {stats.totalProducts - stats.productsWithSEO} products still need SEO optimization
                </p>
              )}
            </div>

            <Link
              to="/admin/seo-manager"
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm whitespace-nowrap"
            >
              Optimize Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;