import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Minus,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { updateStock } from "../../lib/api/inventory";

const StockAdjustmentModal = ({ isOpen, onClose, product, size, onSuccess }) => {
  const [formData, setFormData] = useState({
    change_type: "adjustment",
    quantity_change: 0,
    reason: "",
    operation: "add", // 'add' or 'subtract'
  });
  const [loading, setLoading] = useState(false);
  const [currentStock, setCurrentStock] = useState(0);

  useEffect(() => {
    if (isOpen && product) {
      // Set current stock based on whether we're adjusting size or product
      const stock = size ? size.stock : product.stock;
      setCurrentStock(stock);
      
      // Reset form
      setFormData({
        change_type: "adjustment",
        quantity_change: 0,
        reason: "",
        operation: "add",
      });
    }
  }, [isOpen, product, size]);

  if (!isOpen) return null;

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      quantity_change: Math.abs(numValue),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.quantity_change === 0) {
      toast.error("Vui lòng nhập số lượng thay đổi");
      return;
    }

    if (!formData.reason.trim()) {
      toast.error("Vui lòng nhập lý do thay đổi");
      return;
    }

    try {
      setLoading(true);

      // Calculate actual quantity change based on operation
      const actualChange =
        formData.operation === "add"
          ? formData.quantity_change
          : -formData.quantity_change;

      const adjustmentData = {
        product_id: product.id,
        product_size_id: size?.id || null,
        size: size?.size || null,
        quantity_change: actualChange,
        change_type: formData.change_type,
        reason: formData.reason,
        reference_type: "manual",
        metadata: {
          adjusted_by_modal: true,
          operation: formData.operation,
        },
      };

      const result = await updateStock(adjustmentData);

      toast.success(
        `✅ Đã cập nhật tồn kho từ ${result.stock_before} → ${result.stock_after}`
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Stock adjustment error:", err);
      toast.error("Lỗi khi cập nhật tồn kho: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickAdjustments = [5, 10, 20, 50, 100];

  const changeTypeOptions = [
    { value: "import", label: "📦 Nhập hàng", color: "text-green-600" },
    { value: "adjustment", label: "⚖️ Điều chỉnh", color: "text-blue-600" },
    { value: "damaged", label: "🔨 Hàng hỏng", color: "text-red-600" },
    { value: "lost", label: "❓ Thất thoát", color: "text-orange-600" },
    { value: "found", label: "🔍 Kiểm kê thừa", color: "text-purple-600" },
    { value: "return", label: "↩️ Trả hàng", color: "text-teal-600" },
  ];

  const newStock =
    formData.operation === "add"
      ? currentStock + formData.quantity_change
      : Math.max(0, currentStock - formData.quantity_change);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Điều chỉnh tồn kho
                  </h3>
                  <p className="text-sm text-blue-100">
                    {product?.name}
                    {size && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">
                        Size: {size.size}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Current Stock Display */}
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Tồn kho hiện tại
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {currentStock}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">→</div>
                  <div className="text-xs text-gray-500">Sau khi thay đổi</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Tồn kho mới
                  </div>
                  <div
                    className={`text-3xl font-bold ${
                      newStock > currentStock
                        ? "text-green-600"
                        : newStock < currentStock
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {newStock}
                  </div>
                </div>
              </div>

              {/* Change indicator */}
              {formData.quantity_change > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="flex items-center justify-center gap-2">
                    {formData.operation === "add" ? (
                      <>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-semibold">
                          +{formData.quantity_change}
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        <span className="text-red-600 font-semibold">
                          -{formData.quantity_change}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Operation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại thao tác
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, operation: "add" }))
                  }
                  className={`p-4 rounded-lg border-2 transition ${
                    formData.operation === "add"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Plus className="w-6 h-6 mx-auto mb-1" />
                  <div className="font-semibold">Nhập / Tăng</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, operation: "subtract" }))
                  }
                  className={`p-4 rounded-lg border-2 transition ${
                    formData.operation === "subtract"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Minus className="w-6 h-6 mx-auto mb-1" />
                  <div className="font-semibold">Xuất / Giảm</div>
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng thay đổi
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity_change || ""}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="Nhập số lượng"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                required
              />

              {/* Quick adjustment buttons */}
              <div className="flex gap-2 mt-2">
                <span className="text-xs text-gray-500 py-2">Nhanh:</span>
                {quickAdjustments.map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => handleQuantityChange(qty)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do thay đổi
              </label>
              <select
                value={formData.change_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    change_type: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                {changeTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú chi tiết
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Nhập lý do cụ thể (bắt buộc)..."
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {/* Warning for stock reduction */}
            {formData.operation === "subtract" &&
              formData.quantity_change > currentStock && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <div className="font-semibold">Cảnh báo!</div>
                    <div>
                      Số lượng giảm ({formData.quantity_change}) lớn hơn tồn
                      kho hiện tại ({currentStock}). Tồn kho sẽ về 0.
                    </div>
                  </div>
                </div>
              )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || formData.quantity_change === 0}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Xác nhận thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;