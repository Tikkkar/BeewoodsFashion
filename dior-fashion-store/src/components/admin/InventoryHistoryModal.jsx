import React, { useState, useEffect } from "react";
import {
  X,
  History,
  TrendingUp,
  TrendingDown,
  Package,
  User,
  Calendar,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { getInventoryLogs } from "../../lib/api/inventory";

const InventoryHistoryModal = ({ isOpen, onClose, product }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState(null);
  const [filter, setFilter] = useState("all"); // all, import, export, adjustment

  useEffect(() => {
    if (isOpen && product) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product, filter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data } = await getInventoryLogs(product.id, {
        changeType: filter !== "all" ? filter : null,
        limit: 50,
      });
      if (data) setLogs(data);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const changeTypeConfig = {
    import: {
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      label: "Nhập hàng",
    },
    export: {
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "Xuất hàng",
    },
    adjustment: {
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      label: "Điều chỉnh",
    },
    order: {
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      label: "Đơn hàng",
    },
    return: {
      icon: TrendingUp,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-200",
      label: "Trả hàng",
    },
    damaged: {
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "Hàng hỏng",
    },
    lost: {
      icon: TrendingDown,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      label: "Thất thoát",
    },
    found: {
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      label: "Kiểm kê thừa",
    },
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDateOnly = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return formatDate(dateString);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Lịch sử tồn kho
                  </h3>
                  <p className="text-sm text-purple-100">{product?.name}</p>
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

          {/* Filter */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2 overflow-x-auto">
              {[
                { value: "all", label: "Tất cả" },
                { value: "import", label: "Nhập hàng" },
                { value: "adjustment", label: "Điều chỉnh" },
                { value: "order", label: "Đơn hàng" },
                { value: "return", label: "Trả hàng" },
              ].map((filterOption) => (
                <button
                  key={filterOption.value}
                  onClick={() => setFilter(filterOption.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    filter === filterOption.value
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có lịch sử
                </h3>
                <p className="text-gray-500">
                  Chưa có thay đổi nào được ghi nhận cho sản phẩm này
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const config =
                    changeTypeConfig[log.change_type] ||
                    changeTypeConfig.adjustment;
                  const Icon = config.icon;
                  const isExpanded = expandedLog === log.id;

                  // Get import date from metadata
                  const importDate = log.metadata?.import_date;

                  return (
                    <div
                      key={log.id}
                      className={`border-2 rounded-lg overflow-hidden transition ${config.border} ${config.bg}`}
                    >
                      {/* Log Header */}
                      <button
                        onClick={() =>
                          setExpandedLog(isExpanded ? null : log.id)
                        }
                        className="w-full p-4 hover:bg-white/50 transition"
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Left side */}
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2 bg-white rounded-lg ${config.color}`}>
                              <Icon className="w-5 h-5" />
                            </div>

                            <div className="text-left flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`font-semibold ${config.color}`}>
                                  {config.label}
                                </span>
                                {log.product_sizes?.size && (
                                  <span className="px-2 py-0.5 bg-white rounded text-xs font-medium">
                                    Size: {log.product_sizes.size}
                                  </span>
                                )}
                                {/* Show import date badge for import type */}
                                {log.change_type === 'import' && importDate && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDateOnly(importDate)}
                                  </span>
                                )}
                              </div>

                              <div className="text-sm text-gray-600">
                                {log.stock_before} → {log.stock_after}
                                <span
                                  className={`ml-2 font-semibold ${
                                    log.quantity_change > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  ({log.quantity_change > 0 ? "+" : ""}
                                  {log.quantity_change})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right side */}
                          <div className="text-right flex items-center gap-3">
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center gap-1 justify-end">
                                <Clock className="w-3 h-3" />
                                {getRelativeTime(log.created_at)}
                              </div>
                              {log.created_by_user && (
                                <div className="flex items-center gap-1 justify-end mt-1">
                                  <User className="w-3 h-3" />
                                  {log.created_by_user.full_name ||
                                    log.created_by_user.email}
                                </div>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-200 bg-white space-y-3">
                          {/* Import Date - Highlighted for import transactions */}
                          {log.change_type === 'import' && importDate && (
                            <div className="flex items-start gap-2 pt-3 bg-blue-50 -mx-4 px-4 py-3">
                              <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="text-sm text-blue-900 font-semibold mb-1">
                                  Ngày nhập hàng
                                </div>
                                <div className="text-base text-blue-700 font-medium">
                                  {formatDate(importDate)}
                                </div>
                              </div>
                            </div>
                          )}

                          {log.reason && (
                            <div className="flex items-start gap-2 pt-3">
                              <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs text-gray-500 font-medium mb-1">
                                  Lý do:
                                </div>
                                <div className="text-sm text-gray-900">
                                  {log.reason}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>Thời gian ghi nhận: {formatDate(log.created_at)}</span>
                          </div>

                          {log.reference_type && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">Loại tham chiếu:</span>{" "}
                              {log.reference_type}
                              {log.reference_id && (
                                <span className="ml-2">
                                  (ID: {log.reference_id.slice(0, 8)}...)
                                </span>
                              )}
                            </div>
                          )}

                          {/* Stock Change Summary */}
                          <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Trước</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {log.stock_before}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Thay đổi</div>
                              <div className={`text-lg font-semibold ${
                                log.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Sau</div>
                              <div className="text-lg font-semibold text-purple-600">
                                {log.stock_after}
                              </div>
                            </div>
                          </div>

                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium text-gray-700 mb-2 text-xs">
                                Thông tin bổ sung:
                              </div>
                              <div className="space-y-1 text-xs">
                                {log.metadata.updateTarget && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">Cập nhật:</span>{" "}
                                    {log.metadata.updateTarget === 'size' ? 'Theo size' : 'Tổng sản phẩm'}
                                  </div>
                                )}
                                {log.metadata.timestamp && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">Timestamp:</span>{" "}
                                    {formatDate(log.metadata.timestamp)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Hiển thị {logs.length} thay đổi gần nhất
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition font-medium"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryHistoryModal;