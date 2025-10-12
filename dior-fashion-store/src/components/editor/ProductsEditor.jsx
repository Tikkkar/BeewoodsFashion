import React, { useState } from 'react';
import { Edit, Trash2, Plus, Star } from 'lucide-react';

const ProductsEditor = ({ data, setData }) => {
  const [editingId, setEditingId] = useState(null);
  
  // Lấy danh sách categories có sẵn
  const availableCategories = [
    'Ready-to-Wear',
    'Handbags',
    'Haute Couture',
    'Accessories'
  ];
  
  const updateProduct = (id, updates) => {
    const newProducts = data.products.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    setData({ ...data, products: newProducts });
  };
  
  const deleteProduct = (id) => {
    if (window.confirm('Xóa sản phẩm này?')) {
      setData({ ...data, products: data.products.filter(p => p.id !== id) });
    }
  };
  
  const addProduct = () => {
    const newId = Math.max(...data.products.map(p => p.id), 0) + 1;
    setData({
      ...data,
      products: [...data.products, {
        id: newId,
        name: 'New Product',
        price: 50000000,
        category: 'Ready-to-Wear',
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
        rating: 5,
        reviews: 0,
        stock: 10,
        isFeatured: false
      }]
    });
  };
  
  const toggleFeatured = (id) => {
    updateProduct(id, { isFeatured: !data.products.find(p => p.id === id)?.isFeatured });
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };
  
  return (
    <div className="space-y-4">
      {/* Product Count & Add Button */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm">
          <span className="font-semibold">{data.products.length}</span> sản phẩm
        </div>
        <button
          onClick={addProduct}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-2 font-medium"
        >
          <Plus size={16} />
          Thêm mới
        </button>
      </div>

      {/* Products List */}
      {data.products.map(product => (
        <div key={product.id} className="border border-gray-200 rounded-lg p-3 hover:border-gray-400 transition">
          <div className="flex items-start gap-3 mb-3">
            {/* Product Image */}
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-20 h-20 object-cover rounded border border-gray-200" 
            />
            
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                  <p className="text-sm font-bold text-black">{formatPrice(product.price)}</p>
                  {product.originalPrice && (
                    <p className="text-xs text-gray-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </p>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleFeatured(product.id)}
                    className={`p-2 rounded transition ${
                      product.isFeatured 
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={product.isFeatured ? 'Featured' : 'Not Featured'}
                  >
                    <Star size={16} fill={product.isFeatured ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => setEditingId(editingId === product.id ? null : product.id)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded transition"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {/* Stock & Reviews */}
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span>Stock: {product.stock || 0}</span>
                <span>Reviews: {product.reviews || 0}</span>
                {product.discount && (
                  <span className="text-red-500 font-semibold">-{product.discount}%</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Edit Form */}
          {editingId === product.id && (
            <div className="space-y-3 pt-3 border-t border-gray-200">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Tên sản phẩm"
                />
              </div>

              {/* Price & Original Price */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Giá bán</label>
                  <input
                    type="number"
                    value={product.price}
                    onChange={(e) => updateProduct(product.id, { price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Giá"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Giá gốc</label>
                  <input
                    type="number"
                    value={product.originalPrice || ''}
                    onChange={(e) => updateProduct(product.id, { originalPrice: parseInt(e.target.value) || null })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Giá gốc (optional)"
                  />
                </div>
              </div>

              {/* Category - DROPDOWN SELECT */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Danh mục</label>
                <select
                  value={product.category}
                  onChange={(e) => updateProduct(product.id, { category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Stock, Reviews, Discount */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tồn kho</label>
                  <input
                    type="number"
                    value={product.stock || 0}
                    onChange={(e) => updateProduct(product.id, { stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Stock"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Đánh giá</label>
                  <input
                    type="number"
                    value={product.reviews || 0}
                    onChange={(e) => updateProduct(product.id, { reviews: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Reviews"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Giảm giá %</label>
                  <input
                    type="number"
                    value={product.discount || ''}
                    onChange={(e) => updateProduct(product.id, { discount: parseInt(e.target.value) || null })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={product.image}
                  onChange={(e) => updateProduct(product.id, { image: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="https://..."
                />
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`featured-${product.id}`}
                  checked={product.isFeatured || false}
                  onChange={() => toggleFeatured(product.id)}
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <label htmlFor={`featured-${product.id}`} className="text-sm text-gray-700">
                  Hiển thị trên trang chủ (Featured)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    alert('✅ Đã lưu! Nhớ nhấn "Save Changes" ở trên để lưu vĩnh viễn.');
                  }}
                  className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 rounded-lg text-sm font-medium transition"
                >
                  Xong
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Empty State */}
      {data.products.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-4">Chưa có sản phẩm nào</p>
          <button
            onClick={addProduct}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
          >
            Thêm sản phẩm đầu tiên
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsEditor;