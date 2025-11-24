import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminProducts, deleteProduct } from "../../lib/api/admin";
import { Package, Plus, Edit, Trash2, Loader2, FileText, Image as ImageIcon } from "lucide-react";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price
  );

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    productCode: '',
    minPrice: '',
    maxPrice: ''
  });

  const loadProducts = async (appliedFilters = {}) => {
    setLoading(true);
    const { data } = await getAdminProducts(appliedFilters);
    if (data) {
      console.log("📦 Products loaded successfully:", data.length);
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      await deleteProduct(id);
      loadProducts(filters);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadProducts(filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      productCode: '',
      minPrice: '',
      maxPrice: ''
    };
    setFilters(resetFilters);
    loadProducts(resetFilters);
  };

  // Hàm lấy ảnh đại diện với fallback chain
  const getPrimaryImage = (product) => {
    // Kiểm tra product_images có tồn tại không
    if (!product.product_images || product.product_images.length === 0) {
      return null;
    }

    // Tìm ảnh primary
    const primaryImage = product.product_images.find(img => img.is_primary === true);
    if (primaryImage && primaryImage.image_url) {
      return primaryImage.image_url;
    }

    // Sắp xếp theo display_order và lấy ảnh đầu tiên
    const sortedImages = [...product.product_images].sort((a, b) =>
      (a.display_order || 999) - (b.display_order || 999)
    );

    return sortedImages[0]?.image_url || null;
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

      {/* Filter Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-4">Bộ lọc</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã sản phẩm
            </label>
            <input
              type="text"
              value={filters.productCode}
              onChange={(e) => handleFilterChange('productCode', e.target.value)}
              placeholder="Nhập mã sản phẩm..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá tối thiểu (VND)
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá tối đa (VND)
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              placeholder="999999999"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Áp dụng lọc
            </button>
            <button
              onClick={handleResetFilters}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hình ảnh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tồn kho
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
              {products.map((product) => {
                const primaryImage = getPrimaryImage(product);

                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    {/* Cột hình ảnh */}
                    <td className="px-6 py-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                            }}
                          />
                        ) : (
                          <ImageIcon size={24} className="text-gray-400" />
                        )}
                      </div>
                    </td>

                    {/* Cột thông tin sản phẩm */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.brand_name && (
                        <div className="text-xs text-gray-500 mt-1">
                          🏷️ {product.brand_name}
                        </div>
                      )}
                    </td>

                    {/* Cột mã sản phẩm */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-700">
                        {product.product_code || <span className="text-gray-400 italic">Chưa có</span>}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.categories && product.categories.length > 0
                        ? product.categories.map((cat) => cat.name).join(", ")
                        : "N/A"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {formatPrice(product.price)}
                      </div>
                      {product.original_price && product.original_price > product.price && (
                        <div className="text-xs text-gray-500 line-through">
                          {formatPrice(product.original_price)}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className={`font-medium ${product.stock > 0 ? 'text-gray-900' : 'text-red-600'}`}>
                          Tổng: {product.stock}
                        </div>
                        {product.product_sizes && product.product_sizes.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            {product.product_sizes.slice(0, 3).map(s => (
                              <div key={s.id || s.size}>
                                {s.size}: {s.stock}
                              </div>
                            ))}
                            {product.product_sizes.length > 3 && (
                              <div className="text-blue-600">
                                +{product.product_sizes.length - 3} sizes
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${product.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                            }`}
                        >
                          {product.is_active ? "Hiển thị" : "Ẩn"}
                        </span>
                        {product.is_featured && (
                          <div>
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⭐ Nổi bật
                            </span>
                          </div>
                        )}
                      </div>
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
                          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
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
                          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
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
                          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            Xóa
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Tổng tồn kho</div>
            <div className="text-2xl font-bold text-blue-600">
              {products.reduce((sum, p) => sum + (p.stock || 0), 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;