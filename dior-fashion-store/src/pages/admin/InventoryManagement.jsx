import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Edit2,
  History,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getInventoryProducts,
  getInventoryStats,
  exportInventoryData,
} from "../../lib/api/inventory";
import StockAdjustmentModal from "../../components/admin/StockAdjustmentModal";
import InventoryHistoryModal from "../../components/admin/InventoryHistoryModal";
import BulkImportModal from "../../components/admin/BulkImportModal";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

const InventoryManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, out_of_stock, low_stock, in_stock
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  // Modals
  const [adjustmentModal, setAdjustmentModal] = useState({
    open: false,
    product: null,
    size: null,
  });
  const [historyModal, setHistoryModal] = useState({
    open: false,
    product: null,
  });
  const [bulkImportModal, setBulkImportModal] = useState(false);

  useEffect(() => {
    loadInventory();
    loadStats();
  }, [statusFilter, lowStockThreshold]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const { data } = await getInventoryProducts({
        status: statusFilter,
        lowStockThreshold,
        search: searchTerm,
      });
      if (data) setProducts(data);
    } catch (err) {
      console.error("Error loading inventory:", err);
      toast.error("Không thể tải dữ liệu inventory");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const { data } = await getInventoryStats();
    if (data) setStats(data);
  };

  const handleSearch = () => {
    loadInventory();
  };

  const handleExport = async () => {
    try {
      const { data } = await exportInventoryData();
      if (!data) throw new Error("No data to export");

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers.map((h) => `"${row[h] || ""}"`).join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success("Đã xuất file thành công!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Lỗi khi xuất file");
    }
  };

  const openAdjustment = (product, size = null) => {
    setAdjustmentModal({ open: true, product, size });
  };

  const openHistory = (product) => {
    setHistoryModal({ open: true, product });
  };

  const getStockStatusBadge = (status) => {
    const config = {
      out_of_stock: {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200",
        icon: XCircle,
        label: "Hết hàng",
      },
      low_stock: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        border: "border-yellow-200",
        icon: AlertTriangle,
        label: "Sắp hết",
      },
      in_stock: {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200",
        icon: CheckCircle,
        label: "Còn hàng",
      },
    };

    const { bg, text, border, icon: Icon, label } = config[status];

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${bg} ${text} ${border}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  };

  if (loading && !products.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8" />
            Quản lý Kho hàng
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và cập nhật tồn kho sản phẩm
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setBulkImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Upload className="w-4 h-4" />
            Nhập hàng loạt
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Tổng sản phẩm</div>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Tổng số lượng</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalUnits}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="text-sm text-green-700 mb-1">Còn hàng</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.inStock}
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
            <div className="text-sm text-yellow-700 mb-1">Sắp hết</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.lowStock}
            </div>
          </div>

          <div className="bg-red-50 rounded-lg border border-red-200 p-4">
            <div className="text-sm text-red-700 mb-1">Hết hàng</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.outOfStock}
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="in_stock">Còn hàng</option>
              <option value="low_stock">Sắp hết</option>
              <option value="out_of_stock">Hết hàng</option>
            </select>
          </div>

          {/* Low Stock Threshold */}
          <div>
            <select
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">Ngưỡng cảnh báo: 5</option>
              <option value="10">Ngưỡng cảnh báo: 10</option>
              <option value="20">Ngưỡng cảnh báo: 20</option>
              <option value="50">Ngưỡng cảnh báo: 50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tổng tồn kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Chi tiết sizes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giá trị tồn
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  {/* Product Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.primaryImage ? (
                          <img
                            src={product.primaryImage}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400 m-auto mt-3" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.brand_name && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            🏷️ {product.brand_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Total Stock */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl font-bold ${
                          product.stock === 0
                            ? "text-red-600"
                            : product.stock <= lowStockThreshold
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {product.stock}
                      </span>
                      <button
                        onClick={() => openAdjustment(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Điều chỉnh tồn kho"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                  {/* Size Details */}
                  <td className="px-6 py-4">
                    {product.hasVariants ? (
                      <div className="space-y-1">
                        {product.product_sizes.slice(0, 3).map((size) => (
                          <div
                            key={size.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="font-medium">{size.size}:</span>
                            <div className="flex items-center gap-1">
                              <span
                                className={`font-semibold ${
                                  size.stock === 0
                                    ? "text-red-600"
                                    : size.stock <= 5
                                    ? "text-yellow-600"
                                    : "text-gray-900"
                                }`}
                              >
                                {size.stock}
                              </span>
                              <button
                                onClick={() => openAdjustment(product, size)}
                                className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {product.product_sizes.length > 3 && (
                          <div className="text-xs text-blue-600 font-medium">
                            +{product.product_sizes.length - 3} sizes khác
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">
                        Không có variants
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {getStockStatusBadge(product.stockStatus)}
                  </td>

                  {/* Stock Value */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPrice(product.stock * product.price)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(product.price)} / sp
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openHistory(product)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition group relative"
                        title="Lịch sử thay đổi"
                      >
                        <History className="w-4 h-4" />
                        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          Lịch sử
                        </span>
                      </button>

                      <button
                        onClick={() => openAdjustment(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition group relative"
                        title="Điều chỉnh kho"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          Điều chỉnh
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy sản phẩm
            </h3>
            <p className="text-gray-500">
              Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <StockAdjustmentModal
        isOpen={adjustmentModal.open}
        onClose={() => setAdjustmentModal({ open: false, product: null, size: null })}
        product={adjustmentModal.product}
        size={adjustmentModal.size}
        onSuccess={() => {
          loadInventory();
          loadStats();
        }}
      />

      <InventoryHistoryModal
        isOpen={historyModal.open}
        onClose={() => setHistoryModal({ open: false, product: null })}
        product={historyModal.product}
      />

      <BulkImportModal
        isOpen={bulkImportModal}
        onClose={() => setBulkImportModal(false)}
        onSuccess={() => {
          loadInventory();
          loadStats();
        }}
      />
    </div>
  );
};

export default InventoryManagement;