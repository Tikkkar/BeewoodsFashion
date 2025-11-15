import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Edit2,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  getInventoryProducts,
  updateStock,
  getInventoryStats,
  exportInventoryToExcel,
} from "../../lib/api/inventory";
import InventoryHistoryModal from "../../components/admin/InventoryHistoryModal";
import { toast } from "react-hot-toast";

const InventoryManagement = () => {
  // States
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantity: 0,
    type: "import",
    reason: "",
    import_date: new Date().toISOString().split('T')[0],
  });
  const [exporting, setExporting] = useState(false);

  // Load data
  useEffect(() => {
    loadInventoryData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, statusFilter]);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const [productsResult, statsResult] = await Promise.all([
        getInventoryProducts({ lowStockThreshold: 10 }),
        getInventoryStats(),
      ]);

      if (productsResult.data) setProducts(productsResult.data);
      if (statsResult.data) setStats(statsResult.data);
    } catch (err) {
      console.error("Error loading inventory:", err);
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.stockStatus === statusFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportInventoryToExcel();
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleUpdateStock = async (product) => {
    if (!adjustmentForm.quantity || adjustmentForm.quantity === 0) {
      toast.error("Vui lòng nhập số lượng!");
      return;
    }

    if (!adjustmentForm.reason.trim()) {
      toast.error("Vui lòng nhập lý do!");
      return;
    }

    if (adjustmentForm.type === 'import' && !adjustmentForm.import_date) {
      toast.error("Vui lòng chọn ngày nhập hàng!");
      return;
    }

    try {
      const quantity_change =
        adjustmentForm.type === "import" || adjustmentForm.type === "return"
          ? Math.abs(adjustmentForm.quantity)
          : -Math.abs(adjustmentForm.quantity);

      await updateStock({
        product_id: product.id,
        quantity_change,
        change_type: adjustmentForm.type,
        reason: adjustmentForm.reason,
        import_date: adjustmentForm.import_date,
        reference_type: "manual",
      });

      toast.success("Đã cập nhật tồn kho!");
      setEditingProduct(null);
      setAdjustmentForm({
        quantity: 0,
        type: "import",
        reason: "",
        import_date: new Date().toISOString().split('T')[0],
      });
      loadInventoryData();
    } catch (err) {
      console.error("Error updating stock:", err);
      toast.error("Lỗi khi cập nhật: " + err.message);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStockStatusConfig = (status) => {
    const configs = {
      out_of_stock: {
        label: "Hết hàng",
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: XCircle,
      },
      low_stock: {
        label: "Sắp hết",
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon: AlertTriangle,
      },
      in_stock: {
        label: "Còn hàng",
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
        icon: CheckCircle,
      },
    };
    return configs[status] || configs.in_stock;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Quản lý tồn kho
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và điều chỉnh tồn kho sản phẩm
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang xuất...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-5 h-5" />
              Xuất Excel
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng sản phẩm</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalProducts}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng tồn kho</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalUnits}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Giá trị tồn</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatPrice(stats.totalStockValue)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hết hàng</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.outOfStock}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {[
              { value: "all", label: "Tất cả", count: products.length },
              {
                value: "in_stock",
                label: "Còn hàng",
                count: stats?.inStock || 0,
              },
              {
                value: "low_stock",
                label: "Sắp hết",
                count: stats?.lowStock || 0,
              },
              {
                value: "out_of_stock",
                label: "Hết hàng",
                count: stats?.outOfStock || 0,
              },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  statusFilter === filter.value
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Sản phẩm
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Danh mục
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Tồn kho
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Giá
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Giá trị tồn
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const statusConfig = getStockStatusConfig(product.stockStatus);
                const StatusIcon = statusConfig.icon;

                return (
                  <React.Fragment key={product.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.primaryImage ? (
                            <img
                              src={product.primaryImage}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {product.name}
                            </p>
                            {product.brand_name && (
                              <p className="text-sm text-gray-500">
                                {product.brand_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {product.categories?.map((cat) => (
                            <span
                              key={cat.id}
                              className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-lg font-semibold">
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                          <span
                            className={`text-sm font-medium ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-purple-600">
                        {formatPrice(product.stock * product.price)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            title="Điều chỉnh tồn kho"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowHistoryModal(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            title="Xem lịch sử"
                          >
                            <History className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Adjustment Form */}
                    {editingProduct?.id === product.id && (
                      <tr className="bg-purple-50">
                        <td colSpan="7" className="px-4 py-4">
                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">
                              Điều chỉnh tồn kho: {product.name}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Loại điều chỉnh
                                </label>
                                <select
                                  value={adjustmentForm.type}
                                  onChange={(e) =>
                                    setAdjustmentForm({
                                      ...adjustmentForm,
                                      type: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="import">Nhập hàng (+)</option>
                                  <option value="adjustment">Điều chỉnh</option>
                                  <option value="return">Trả hàng (+)</option>
                                  <option value="damaged">Hàng hỏng (-)</option>
                                  <option value="lost">Thất thoát (-)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Số lượng
                                </label>
                                <input
                                  type="number"
                                  value={adjustmentForm.quantity}
                                  onChange={(e) =>
                                    setAdjustmentForm({
                                      ...adjustmentForm,
                                      quantity: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                  placeholder="Nhập số lượng"
                                />
                              </div>

                              {adjustmentForm.type === 'import' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Ngày nhập hàng
                                  </label>
                                  <input
                                    type="date"
                                    value={adjustmentForm.import_date}
                                    onChange={(e) =>
                                      setAdjustmentForm({
                                        ...adjustmentForm,
                                        import_date: e.target.value,
                                      })
                                    }
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>
                              )}

                              <div className={adjustmentForm.type === 'import' ? 'md:col-span-1' : 'md:col-span-2'}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Lý do
                                </label>
                                <input
                                  type="text"
                                  value={adjustmentForm.reason}
                                  onChange={(e) =>
                                    setAdjustmentForm({
                                      ...adjustmentForm,
                                      reason: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                  placeholder="Nhập lý do điều chỉnh"
                                />
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Tồn kho hiện tại:
                                </span>{" "}
                                {product.stock} →{" "}
                                <span className="font-semibold text-purple-600">
                                  {adjustmentForm.type === "import" ||
                                  adjustmentForm.type === "return"
                                    ? product.stock +
                                      Math.abs(adjustmentForm.quantity)
                                    : product.stock -
                                      Math.abs(adjustmentForm.quantity)}
                                </span>
                              </p>
                              {adjustmentForm.type === 'import' && adjustmentForm.import_date && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Ngày nhập:</span>{" "}
                                  {new Date(adjustmentForm.import_date).toLocaleDateString('vi-VN')}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateStock(product)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                              >
                                Xác nhận
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProduct(null);
                                  setAdjustmentForm({
                                    quantity: 0,
                                    type: "import",
                                    reason: "",
                                    import_date: new Date().toISOString().split('T')[0],
                                  });
                                }}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-gray-500">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <InventoryHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}
    </div>
  );
};

export default InventoryManagement;