import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Eye } from 'lucide-react';

const ProductCard = ({ product, onAddToCart, onQuickView }) => {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    alert('Đã thêm vào danh sách yêu thích!');
  };

  const handleQuickView = (e) => {
    e.stopPropagation();
    onQuickView(product);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group cursor-pointer"
    >
      {/* Product Image */}
      <div className="relative aspect-square mb-4 overflow-hidden bg-gray-100 rounded-lg">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300">
          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-4 right-4 p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-100"
            aria-label="Add to wishlist"
          >
            <Heart size={20} />
          </button>
          
          {/* Action Buttons Container */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            {/* Quick View Button */}
            <button
              onClick={handleQuickView}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 tracking-wide text-sm"
            >
              <Eye size={18} />
              <span>Xem nhanh</span>
            </button>
            
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 tracking-wide text-sm"
            >
              <ShoppingCart size={18} />
              <span>Thêm giỏ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 tracking-widest uppercase">
          {product.category}
        </div>
        <h3 className="font-light tracking-wide text-lg group-hover:text-gray-600 transition-colors">
          {product.name}
        </h3>
        <div className="text-xl font-light tracking-wide">
          {formatPrice(product.price)}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;