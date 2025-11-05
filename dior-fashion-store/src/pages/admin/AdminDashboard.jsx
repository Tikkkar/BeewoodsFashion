import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { BarChart3 } from "lucide-react";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  DollarSign, 
  Clock,
  Loader2,
  Search,
  Users,
} from "lucide-react";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    productsWithSEO: 0,
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
        .from("orders")
        .select("id, total_amount, status, created_at, order_number")
        .order("created_at", { ascending: false })
        .limit(50); // Limit to recent orders only

      if (ordersError) throw ordersError;

      // Calculate stats from limited data
      const totalRevenue =
        orders
          ?.filter((o) => o.status === "completed")
          .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      const totalOrders = orders?.length || 0;
      const pendingOrders =
        orders?.filter((o) => o.status === "pending").length || 0;
      const completedOrders =
        orders?.filter((o) => o.status === "completed").length || 0;

      // Get products count (optimized - count only)
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      const { count: activeProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get products with SEO data
      const { data: productsWithSEO } = await supabase
        .from("products")
        .select("id")
        .not("seo_title", "is", null)
        .not("seo_description", "is", null);

      setStats({
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        productsWithSEO: productsWithSEO?.length || 0,
      });

      // Recent orders (already limited above)
      setRecentOrders(orders?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800" },
      processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800" },
      shipping: {
        label: "Đang giao hàng",
        color: "bg-purple-100 text-purple-800",
      },
      completed: {
        label: "Đã hoàn thành",
        color: "bg-green-100 text-green-800",
      },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
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
        <h1 className="text-3xl font-bold mb-2">Bảng điều khiển</h1>
        <p className="text-gray-600">Tổng quan về cửa hàng của bạn</p>
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
          <p className="text-gray-600 text-sm mb-1">Tổng doanh thu</p>
          <p className="text-2xl font-bold">
            {formatPrice(stats.totalRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Từ các đơn hàng đã hoàn thành
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Tổng đơn hàng</p>
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.completedOrders} đã hoàn thành
          </p>
        </div>
        {/* Analytics Card - NEW */}
        <Link
          to="/admin/analytics"
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 p-6 hover:border-purple-400 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition">
            <BarChart3 className="text-purple-600" size={28} />
          </div>
          <h3 className="text-lg font-bold mb-2 text-gray-900">Phân tích</h3>
          <p className="text-sm text-gray-600 mb-3">
            Báo cáo và thông tin chi tiết
          </p>
          <div className="flex items-center justify-between text-xs text-purple-600 font-medium">
            <span>Xem Báo cáo</span>
            <TrendingUp size={14} />
          </div>
        </Link>
        {/* Pending Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Đơn hàng chờ xử lý</p>
          <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Cần chú ý</p>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Sản phẩm đang hoạt động</p>
          <p className="text-2xl font-bold">
            {stats.activeProducts} / {stats.totalProducts}
          </p>
          <p className="text-xs text-gray-500 mt-1">Sản phẩm đang bán</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Đơn hàng gần đây</h2>
          <Link
            to="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Xem Tất cả
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Chưa có đơn hàng nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mã đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tổng cộng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hành động
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
                        Xem
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
        <h2 className="text-xl font-bold mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* SEO Manager - NEW & FEATURED */}
          <Link
            to="/admin/seo-manager"
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 hover:border-blue-400 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                MỚI
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition">
              <Search className="text-blue-600" size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">
              Quản lý SEO
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Tối ưu hóa SEO và nội dung cho sản phẩm
            </p>
            <div className="flex items-center justify-between text-xs text-blue-600 font-medium">
              <span>
                {stats.productsWithSEO} / {stats.totalProducts} đã tối ưu
              </span>
              <TrendingUp size={14} />
            </div>
          </Link>

          {/* Customer Feedbacks - NEW */}
          <Link
            to="/admin/feedbacks"
            className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border-2 border-pink-200 p-6 hover:border-pink-400 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <span className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                MỚI
              </span>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-200 transition">
              <Users className="text-pink-600" size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">
              Feedback Khách hàng
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Quản lý ảnh khách hàng trên trang chủ
            </p>
            <div className="flex items-center justify-between text-xs text-pink-600 font-medium">
              <span>Quản lý feedback</span>
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
            <h3 className="text-lg font-bold mb-2">Thêm Sản phẩm</h3>
            <p className="text-sm text-gray-600">Tạo danh sách sản phẩm mới</p>
          </Link>

          <Link
            to="/admin/orders"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-black hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition">
              <ShoppingBag className="text-green-600" size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">Quản lý Đơn hàng</h3>
            <p className="text-sm text-gray-600">
              Xem và cập nhật trạng thái đơn hàng
            </p>
          </Link>

          <Link
            to="/admin/categories"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-black hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition">
              <Package className="text-orange-600" size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">Danh mục</h3>
            <p className="text-sm text-gray-600">Quản lý danh mục sản phẩm</p>
          </Link>

          <Link
            to="/admin/banners"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-black hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-200 transition">
              <TrendingUp className="text-pink-600" size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">Banners</h3>
            <p className="text-sm text-gray-600">Quản lý banners trang chủ</p>
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
                <h3 className="text-lg font-bold text-gray-900">
                  Tình trạng tối ưu hóa SEO
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {stats.productsWithSEO} trên tổng số {stats.totalProducts} sản
                phẩm đã được tối ưu hóa SEO
              </p>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Tiến độ</span>
                  <span>
                    {Math.round(
                      (stats.productsWithSEO / stats.totalProducts) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (stats.productsWithSEO / stats.totalProducts) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {stats.productsWithSEO < stats.totalProducts && (
                <p className="text-xs text-blue-600 font-medium">
                  💡 {stats.totalProducts - stats.productsWithSEO} sản phẩm vẫn
                  cần tối ưu hóa SEO
                </p>
              )}
            </div>

            <Link
              to="/admin/seo-manager"
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm whitespace-nowrap"
            >
              Tối ưu ngay
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;