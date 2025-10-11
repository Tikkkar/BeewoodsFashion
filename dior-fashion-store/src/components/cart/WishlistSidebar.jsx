import React from 'react';
import { X, Trash2, Heart, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WishlistSidebar = ({ isOpen, onClose, wishlist, onRemoveItem, onAddToCart }) => {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleProductClick = (productId) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = (item) => {
    onAddToCart(item);
    alert(`✅ Đã thêm "${item.name}" vào giỏ hàng!`);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white z-50 shadow-2xl transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Heart size={24} className="text-red-500 fill-red-500" />
            <h2 className="text-xl font-light tracking-widest">YÊU THÍCH</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Wishlist Items */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {wishlist.length === 0 ? (
            <div className="text-center py-20">
              <Heart size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 tracking-wide mb-2">Danh sách yêu thích trống</p>
              <p className="text-sm text-gray-400">Thêm sản phẩm yêu thích để xem sau</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlist.map((item) => (
                <div key={item.id} className="group border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div 
                      onClick={() => handleProductClick(item.id)}
                      className="cursor-pointer"
                    >
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 
                        onClick={() => handleProductClick(item.id)}
                        className="font-light tracking-wide mb-1 cursor-pointer hover:text-gray-600"
                      >
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                      <p className="font-light tracking-wide mb-3">
                        {formatPrice(item.price)}
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="flex-1 px-3 py-2 bg-black text-white rounded text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                        >
                          <ShoppingCart size={16} />
                          <span>Thêm vào giỏ</span>
                        </button>
                        
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded transition-colors"
                          title="Xóa khỏi yêu thích"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WishlistSidebar;