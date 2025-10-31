import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminOrders } from "../../lib/api/admin";
import { Loader2, Search, Filter, DollarSign, ShoppingBag } from "lucide-react";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price
  );
const formatDate = (date) => new Date(date).toLocaleDateString("vi-VN");

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800" }, // Dịch: Pending
    processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800" }, // Dịch: Processing
    shipping: {
      label: "Đang giao hàng",
      color: "bg-purple-100 text-purple-800",
    }, // Dịch: Shipping
    completed: { label: "Hoàn thành", color: "bg-green-100 text-green-800" }, // Dịch: Completed
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" }, // Dịch: Cancelled
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
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await getAdminOrders();
    if (data) setOrders(data);
    setLoading(false);
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.users?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

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
      <div>
        <h1 className="text-3xl font-bold">Đơn hàng</h1> {/* Dịch: Orders */}
        <p className="text-gray-600">Xem và quản lý các đơn hàng</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng Đơn hàng</p>{" "}
              {/* Dịch: Total Orders */}
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
              <p className="text-sm text-gray-600">Doanh thu</p>{" "}
              {/* Dịch: Revenue */}
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
              <p className="text-sm text-gray-600">Chờ xử lý</p>{" "}
              {/* Dịch: Pending */}
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
              <p className="text-sm text-gray-600">Hoàn thành</p>{" "}
              {/* Dịch: Completed */}
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
              <option value="all">Tất cả Trạng thái</option>{" "}
              {/* Dịch: All Status */}
              <option value="pending">Chờ xử lý ({stats.pending})</option>{" "}
              {/* Dịch: Pending */}
              <option value="processing">
                Đang xử lý ({stats.processing})
              </option>{" "}
              {/* Dịch: Processing */}
              <option value="shipping">
                Đang giao hàng ({stats.shipping})
              </option>{" "}
              {/* Dịch: Shipping */}
              <option value="completed">
                Hoàn thành ({stats.completed})
              </option>{" "}
              {/* Dịch: Completed */}
              <option value="cancelled">Đã hủy ({stats.cancelled})</option>{" "}
              {/* Dịch: Cancelled */}
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
              </p>{" "}
              {/* Dịch: No orders found */}
              <p className="text-sm">
                {searchTerm || statusFilter !== "all"
                  ? "Hãy thử điều chỉnh bộ lọc của bạn" // Dịch: Try adjusting your filters
                  : "Đơn hàng sẽ xuất hiện ở đây khi khách hàng đặt hàng"}{" "}
                // Dịch: Orders will appear here when customers place them
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã Đơn hàng
                  </th>{" "}
                  {/* Dịch: Order # */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày
                  </th>{" "}
                  {/* Dịch: Date */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>{" "}
                  {/* Dịch: Customer */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng cộng
                  </th>{" "}
                  {/* Dịch: Total */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>{" "}
                  {/* Dịch: Status */}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>{" "}
                  {/* Dịch: Action */}
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
                          {order.users?.full_name || "Khách vãng lai"}
                        </div>{" "}
                        {/* Dịch: Guest */}
                        {order.users?.email && (
                          <div className="text-sm text-gray-500">
                            {order.users.email}
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
                        Xem chi tiết → {/* Dịch: View Details → */}
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
              số <strong>{orders.length}</strong> đơn hàng{" "}
              {/* Dịch: Showing X of Y orders */}
            </span>
            {statusFilter === "all" && (
              <span className="font-medium">
                Tổng Doanh thu: <strong>{formatPrice(stats.revenue)}</strong>{" "}
                {/* Dịch: Total Revenue: */}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
