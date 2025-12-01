import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase, adminSupabase } from "../../lib/supabase";
import { BarChart3, MessageSquare, Star } from "lucide-react";
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
    totalFeedbacks: 0,
    averageRating: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Call RPC for all stats (Fast & Secure)
      const { data: rpcStats, error: rpcError } = await supabase
        .rpc('get_admin_dashboard_stats');

      if (rpcError) {
        console.error("RPC Error:", rpcError);
        // Fallback or throw? Let's log and continue if possible, but stats will be 0
      }

      if (rpcStats) {
        setStats({
          totalRevenue: rpcStats.totalRevenue || 0,
          totalOrders: rpcStats.totalOrders || 0,
          pendingOrders: rpcStats.pendingOrders || 0,
          completedOrders: rpcStats.completedOrders || 0,
          totalProducts: rpcStats.totalProducts || 0,
          activeProducts: rpcStats.activeProducts || 0,
          productsWithSEO: rpcStats.productsWithSEO || 0,
          totalFeedbacks: rpcStats.totalFeedbacks || 0,
          averageRating: rpcStats.averageRating || 0,
        });
      }

      // 2. Fetch Recent Orders (Admin bypass RLS)
      const client = adminSupabase || supabase;
      const { data: orders, error: ordersError } = await client
        .from("orders")
        .select("id, total_amount, status, created_at, order_number")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!ordersError) {
        setRecentOrders(orders || []);
      }

      // 3. Fetch Recent Feedbacks (Admin bypass RLS)
      const { data: feedbacks, error: feedbacksError } = await client
        .from("customer_feedbacks")
        .select("id, customer_name, customer_image, rating_average, total_responses")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!feedbacksError) {
        setRecentFeedbacks(feedbacks || []);
      }

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

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={14}
        className={i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
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

        {/* Analytics Card */}
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

        {/* ✅ Customer Feedbacks Stats */}
        <Link
          to="/admin/feedbacks"
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200 p-6 hover:border-amber-400 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-200 transition">
            <MessageSquare className="text-amber-600" size={24} />
          </div>
          <p className="text-gray-600 text-sm mb-1">Phản hồi khách hàng</p>
          <p className="text-2xl font-bold">{stats.totalFeedbacks}</p>
          <div className="flex items-center gap-1 mt-2">
            {renderStars(stats.averageRating)}
            <span className="text-sm text-gray-600 ml-1">
              {stats.averageRating}
            </span>
          </div>
        </Link>
      </div>

      {/* Recent Orders & Feedbacks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="divide-y">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{order.order_number}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {formatDate(order.created_at)}
                    </span>
                    <span className="font-bold text-green-600">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ Recent Feedbacks */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold">Phản hồi gần đây</h2>
            <Link
              to="/admin/feedbacks"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Xem Tất cả
            </Link>
          </div>

          {recentFeedbacks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Chưa có phản hồi nào
            </div>
          ) : (
            <div className="divide-y">
              {recentFeedbacks.map((feedback) => (
                <div key={feedback.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <img
                      src={feedback.customer_image}
                      alt={feedback.customer_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">
                        {feedback.customer_name}
                      </h4>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {renderStars(feedback.rating_average)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {feedback.rating_average}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {feedback.total_responses} phản hồi
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* SEO Manager */}
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

          {/* Customer Feedbacks */}
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
              Quản lý phản hồi trên trang chủ
            </p>
            <div className="flex items-center justify-between text-xs text-pink-600 font-medium">
              <span>{stats.totalFeedbacks} feedbacks</span>
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
                      width: `${(stats.productsWithSEO / stats.totalProducts) * 100
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
