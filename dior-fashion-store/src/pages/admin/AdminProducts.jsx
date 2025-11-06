import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminProducts, deleteProduct } from "../../lib/api/admin";
import { Package, Plus, Edit, Trash2, Loader2, FileText, Sparkles } from "lucide-react";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price
  );

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await getAdminProducts();
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      await deleteProduct(id);
      loadProducts();
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sản phẩm</h1>
          <p className="text-gray-600">
            Quản lý tất cả sản phẩm trong cửa hàng.
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition"
        >
          <Plus size={18} />
          <span>Thêm Sản phẩm</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    {product.brand_name && (
                      <div className="text-xs text-gray-500 mt-1">
                        🏷️ {product.brand_name}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.categories && product.categories.length > 0
                      ? product.categories.map((cat) => cat.name).join(", ")
                      : "N/A"}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatPrice(product.price)}
                  </td>
                  
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.is_active ? "Hiển thị" : "Ẩn"}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Edit Product Button */}
                      <Link
                        to={`/admin/products/${product.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition group relative"
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Edit size={18} />
                        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Chỉnh sửa
                        </span>
                      </Link>

                      {/* SEO Editor Button */}
                      <Link
                        to={`/admin/seo-manager?productId=${product.id}`}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition group relative"
                        title="Quản lý SEO & Nội dung"
                      >
                        <FileText size={18} />
                        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Quản lý SEO
                        </span>
                      </Link>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition group relative"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={18} />
                        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Xóa
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
        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có sản phẩm nào
            </h3>
            <p className="text-gray-500 mb-4">
              Bắt đầu bằng cách thêm sản phẩm đầu tiên của bạn
            </p>
            <Link
              to="/admin/products/new"
              className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              <Plus size={18} />
              Thêm Sản phẩm
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Tổng sản phẩm</div>
            <div className="text-2xl font-bold">{products.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Đang hiển thị</div>
            <div className="text-2xl font-bold text-green-600">
              {products.filter((p) => p.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Đang ẩn</div>
            <div className="text-2xl font-bold text-red-600">
              {products.filter((p) => !p.is_active).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;