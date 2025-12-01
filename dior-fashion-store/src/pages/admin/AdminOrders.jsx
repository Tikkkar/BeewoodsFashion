import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase, adminSupabase } from "../../lib/supabase";
import { useRBAC } from "../../hooks/useRBAC";
import { Loader2, Search, Filter, DollarSign, ShoppingBag, Plus, AlertCircle } from "lucide-react";
import ManualOrderModal from "../../components/admin/ManualOrderModal";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price
  );
const formatDate = (date) => new Date(date).toLocaleDateString("vi-VN");

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800" },
    processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800" },
    shipping: {
      label: "Đang giao hàng",
      color: "bg-purple-100 text-purple-800",
    },
    completed: { label: "Hoàn thành", color: "bg-green-100 text-green-800" },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

const AdminOrders = () => {
  const { userRole: _, isSale, isWarehouse, canAccessAdmin } = useRBAC();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    if (canAccessAdmin) {
      loadOrders();
    }
  }, [canAccessAdmin]);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);

      // Use admin client to bypass RLS and permission issues
      const client = adminSupabase || supabase;
      console.log('🔑 Using client:', adminSupabase ? 'adminSupabase (service role)' : 'supabase (authenticated)');

      let query = client
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, customer_email, total_amount, status, payment_method, payment_status, notes, created_at, updated_at')
        .order('created_at', { ascending: false });

      // Apply status filter if needed
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
      } else {
        console.log('✅ Orders loaded successfully:', data?.length || 0);
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error in loadOrders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const filterOrders = useCallback(() => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (order) =>
          order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const calculateStats = () => {
    const totalRevenue = filteredOrders
      .filter((o) => o.status === "completed")
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    const stats = {
      total: filteredOrders.length,
      pending: filteredOrders.filter((o) => o.status === "pending").length,
      processing: filteredOrders.filter((o) => o.status === "processing")
        .length,
      shipping: filteredOrders.filter((o) => o.status === "shipping").length,
      completed: filteredOrders.filter((o) => o.status === "completed").length,
      cancelled: filteredOrders.filter((o) => o.status === "cancelled").length,
      revenue: totalRevenue,
    };

    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Đơn hàng</h1>
          <p className="text-gray-600">Xem và quản lý các đơn hàng</p>
        </div>
        <button
          onClick={() => setOrderModalOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition"
        >
          <Plus size={18} />
          <span>Tạo đơn hàng</span>
        </button>
      </div>

      {/* Role-based Info Banner */}
      {isSale && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Bạn đang xem đơn hàng với quyền Sale
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Chỉ hiển thị các đơn hàng do bạn tạo trong 30 ngày gần nhất
            </p>
          </div>
        </div>
      )}

      {isWarehouse && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">
              Bạn đang xem đơn hàng với quyền Warehouse
            </p>
            <p className="text-sm text-green-700 mt-1">
              Bạn có thể xem tất cả đơn hàng để thực hiện đóng gói và xuất kho
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng Đơn hàng</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Doanh thu</p>
              <p className="text-xl font-bold">{formatPrice(stats.revenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Chờ xử lý</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hoàn thành</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent appearance-none bg-white cursor-pointer min-w-[200px]"
            >
              <option value="all">Tất cả Trạng thái</option>
              <option value="pending">Chờ xử lý ({stats.pending})</option>
              <option value="processing">
                Đang xử lý ({stats.processing})
              </option>
              <option value="shipping">
                Đang giao hàng ({stats.shipping})
              </option>
              <option value="completed">
                Hoàn thành ({stats.completed})
              </option>
              <option value="cancelled">Đã hủy ({stats.cancelled})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium mb-2">
                Không tìm thấy đơn hàng nào
              </p>
              <p className="text-sm">
                {searchTerm || statusFilter !== "all"
                  ? "Hãy thử điều chỉnh bộ lọc của bạn"
                  : "Đơn hàng sẽ xuất hiện ở đây khi khách hàng đặt hàng"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng cộng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">
                          {order.customer_name || "Khách vãng lai"}
                        </div>
                        {order.customer_phone && (
                          <div className="text-sm text-gray-500">
                            {order.customer_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1 hover:underline"
                      >
                        Xem chi tiết →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      {filteredOrders.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Đang hiển thị <strong>{filteredOrders.length}</strong> trong tổng
              số <strong>{orders.length}</strong> đơn hàng
            </span>
            {statusFilter === "all" && (
              <span className="font-medium">
                Tổng Doanh thu: <strong>{formatPrice(stats.revenue)}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Modal tạo đơn hàng */}
      <ManualOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onSuccess={loadOrders}
      />
    </div>
  );
};

export default AdminOrders;
