import React, { useState } from "react";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { bulkUpdateStock } from "../../lib/api/inventory";
import { supabase } from "../../lib/supabase";

const BulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [results, setResults] = useState(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Vui lòng chọn file CSV");
      return;
    }

    setFile(selectedFile);
    previewFile(selectedFile);
  };

  const previewFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n").filter((line) => line.trim());

      // Parse CSV (simple parser, assumes comma-separated)
      const rows = lines.map((line) => {
        // Handle quoted values
        const values = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        return values;
      });

      const headers = rows[0];
      const data = rows.slice(1, 6).map((row) => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      setPreview({ headers, data, totalRows: rows.length - 1 });
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Vui lòng chọn file");
      return;
    }

    setUploading(true);
    setResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split("\n").filter((line) => line.trim());

        // Parse CSV
        const rows = lines.map((line) => {
          const values = [];
          let current = "";
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              values.push(current.trim().replace(/^"|"$/g, ""));
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current.trim().replace(/^"|"$/g, ""));
          return values;
        });

        const headers = rows[0];
        const data = rows.slice(1);

        console.log("Headers:", headers);
        console.log("Sample data:", data.slice(0, 3));

        // Validate headers
        const requiredHeaders = ["product_slug", "quantity_change", "change_type", "reason"];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.some((header) => header.toLowerCase() === h.toLowerCase())
        );

        if (missingHeaders.length > 0) {
          toast.error(`Thiếu cột: ${missingHeaders.join(", ")}`);
          setUploading(false);
          return;
        }

        // Map headers to indexes
        const headerMap = {};
        headers.forEach((header, index) => {
          headerMap[header.toLowerCase()] = index;
        });

        // Get all product slugs to resolve IDs
        const slugs = data.map((row) => row[headerMap["product_slug"]]).filter(Boolean);
        const { data: products } = await supabase
          .from("products")
          .select("id, slug, name, stock, product_sizes(id, size, stock)")
          .in("slug", slugs);

        if (!products || products.length === 0) {
          toast.error("Không tìm thấy sản phẩm nào");
          setUploading(false);
          return;
        }

        // Create lookup map
        const productMap = {};
        products.forEach((p) => {
          productMap[p.slug] = p;
        });

        // Build adjustments array
        const adjustments = [];
        const errors = [];

        data.forEach((row, index) => {
          const slug = row[headerMap["product_slug"]];
          const quantityChange = parseInt(row[headerMap["quantity_change"]]);
          const changeType = row[headerMap["change_type"]];
          const reason = row[headerMap["reason"]];
          const size = row[headerMap["size"]] || null;

          // Validation
          if (!slug) {
            errors.push(`Dòng ${index + 2}: Thiếu slug`);
            return;
          }

          const product = productMap[slug];
          if (!product) {
            errors.push(`Dòng ${index + 2}: Không tìm thấy sản phẩm "${slug}"`);
            return;
          }

          if (isNaN(quantityChange)) {
            errors.push(`Dòng ${index + 2}: Số lượng không hợp lệ`);
            return;
          }

          if (!changeType) {
            errors.push(`Dòng ${index + 2}: Thiếu loại thay đổi`);
            return;
          }

          if (!reason) {
            errors.push(`Dòng ${index + 2}: Thiếu lý do`);
            return;
          }

          // Find size if specified
          let product_size_id = null;
          if (size && product.product_sizes) {
            const sizeData = product.product_sizes.find(
              (s) => s.size.toLowerCase() === size.toLowerCase()
            );
            if (sizeData) {
              product_size_id = sizeData.id;
            } else {
              errors.push(`Dòng ${index + 2}: Không tìm thấy size "${size}"`);
              return;
            }
          }

          adjustments.push({
            product_id: product.id,
            product_name: product.name,
            product_size_id,
            size,
            quantity_change: quantityChange,
            change_type: changeType,
            reason,
            reference_type: "bulk_import",
            metadata: {
              import_row: index + 2,
              import_file: file.name,
              import_date: new Date().toISOString(),
            },
          });
        });

        if (errors.length > 0) {
          console.error("Import errors:", errors);
          toast.error(`Có ${errors.length} lỗi. Kiểm tra console.`);
          setResults({
            success: false,
            errors,
            processed: 0,
            total: data.length,
          });
          setUploading(false);
          return;
        }

        // Process bulk update
        console.log(`Processing ${adjustments.length} adjustments...`);
        const result = await bulkUpdateStock(adjustments);

        const successCount = result.results.filter((r) => r.success).length;
        const failCount = result.results.length - successCount;

        setResults({
          success: failCount === 0,
          processed: successCount,
          failed: failCount,
          total: adjustments.length,
          details: result.results,
        });

        if (failCount === 0) {
          toast.success(`✅ Đã cập nhật ${successCount} sản phẩm thành công!`);
          onSuccess();
        } else {
          toast.warning(`⚠️ Thành công: ${successCount}, Thất bại: ${failCount}`);
        }
      };

      reader.readAsText(file);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Lỗi khi xử lý file: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `product_slug,size,quantity_change,change_type,reason
ao-so-mi-trang,,50,import,Nhập hàng mới từ nhà cung cấp
quan-jeans-xanh,M,30,import,Nhập hàng đợt 2
vay-hoa-do,S,-5,damaged,Hàng bị lỗi sau kiểm tra
ao-khoac-den,L,10,adjustment,Điều chỉnh sau kiểm kê`;

    const blob = new Blob(["\ufeff" + template], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "inventory_import_template.csv";
    link.click();

    toast.success("Đã tải template thành công!");
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Nhập hàng loạt từ CSV
                  </h3>
                  <p className="text-sm text-blue-100">
                    Cập nhật tồn kho cho nhiều sản phẩm cùng lúc
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
          <div className="p-6 space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 space-y-2">
                  <div className="font-semibold">Hướng dẫn sử dụng:</div>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Tải file template mẫu bên dưới</li>
                    <li>Điền thông tin sản phẩm theo format:</li>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-0.5">
                      <li>
                        <strong>product_slug</strong>: Slug sản phẩm (bắt buộc)
                      </li>
                      <li>
                        <strong>size</strong>: Size cụ thể (tùy chọn, để trống
                        nếu cập nhật tổng)
                      </li>
                      <li>
                        <strong>quantity_change</strong>: Số lượng thay đổi
                        (+/-) (bắt buộc)
                      </li>
                      <li>
                        <strong>change_type</strong>: import, adjustment,
                        damaged, lost, found, return
                      </li>
                      <li>
                        <strong>reason</strong>: Lý do chi tiết (bắt buộc)
                      </li>
                    </ul>
                    <li>Upload file CSV và nhấn "Xử lý"</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Download Template */}
            <div className="flex gap-3">
              <button
                onClick={downloadTemplate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-50 border-2 border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition font-medium"
              >
                <Download className="w-5 h-5" />
                Tải Template Mẫu
              </button>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn file CSV
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-3" />
                  {file ? (
                    <>
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        {file.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setFile(null);
                          setPreview([]);
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Xóa file
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        Nhấn để chọn file CSV
                      </div>
                      <div className="text-sm text-gray-500">
                        hoặc kéo thả file vào đây
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Preview */}
            {preview.data && preview.data.length > 0 && (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <div className="text-sm font-semibold text-gray-900">
                    Xem trước ({preview.data.length} / {preview.totalRows} dòng)
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {preview.headers.map((header, idx) => (
                          <th
                            key={idx}
                            className="px-4 py-2 text-left font-semibold text-gray-700"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {preview.data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {preview.headers.map((header, colIdx) => (
                            <td
                              key={colIdx}
                              className="px-4 py-2 text-gray-900"
                            >
                              {row[header] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Results */}
            {results && (
              <div
                className={`border-2 rounded-lg p-4 ${
                  results.success
                    ? "border-green-200 bg-green-50"
                    : "border-yellow-200 bg-yellow-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {results.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div
                      className={`font-semibold mb-2 ${
                        results.success ? "text-green-900" : "text-yellow-900"
                      }`}
                    >
                      {results.success
                        ? "✅ Import thành công!"
                        : "⚠️ Import hoàn tất với một số lỗi"}
                    </div>
                    <div
                      className={`text-sm space-y-1 ${
                        results.success ? "text-green-800" : "text-yellow-800"
                      }`}
                    >
                      <div>Tổng số: {results.total}</div>
                      <div>Thành công: {results.processed}</div>
                      {results.failed > 0 && (
                        <div className="text-red-600 font-medium">
                          Thất bại: {results.failed}
                        </div>
                      )}
                    </div>

                    {/* Error details */}
                    {results.errors && results.errors.length > 0 && (
                      <div className="mt-3 p-3 bg-white rounded border border-red-200">
                        <div className="text-sm font-semibold text-red-900 mb-2">
                          Chi tiết lỗi:
                        </div>
                        <ul className="text-sm text-red-800 space-y-1 max-h-32 overflow-y-auto">
                          {results.errors.map((error, idx) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                disabled={uploading}
              >
                {results ? "Đóng" : "Hủy"}
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Xử lý File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;