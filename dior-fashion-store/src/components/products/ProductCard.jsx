import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product, onAddToCart, onQuickView }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wishlist = JSON.parse(localStorage.getItem('dior_wishlist') || '[]');
    const exists = wishlist.find(item => item.id === product.id);
    
    if (exists) {
      const newWishlist = wishlist.filter(item => item.id !== product.id);
      localStorage.setItem('dior_wishlist', JSON.stringify(newWishlist));
      setIsWishlisted(false);
    } else {
      wishlist.push(product);
      localStorage.setItem('dior_wishlist', JSON.stringify(wishlist));
      setIsWishlisted(true);
    }
    
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  // Check if product is in wishlist on mount
  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('dior_wishlist') || '[]');
    setIsWishlisted(wishlist.some(item => item.id === product.id));
  }, [product.id]);

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="group block"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="bg-white overflow-hidden">
        
        {/* Image Container */}
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
          {/* Skeleton Loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-700 ${
              imageLoaded ? 'opacity-100 group-hover:scale-110' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />

          {/* Sale Badge */}
          {product.discount && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md z-10">
              -{product.discount}%
            </div>
          )}

          {/* Wishlist Button - Always visible on mobile, hover on desktop */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all z-10 md:opacity-0 md:group-hover:opacity-100 ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-white/90 text-gray-700 hover:bg-white'
            }`}
          >
            <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Quick Actions - Show on Hover (Desktop only) */}
          <div className={`hidden md:flex absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4 transition-all duration-300 ${
            showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            <div className="flex items-center gap-2 w-full">
              
              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-white text-black py-2.5 px-3 rounded-lg text-sm font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2 shadow-md"
              >
                <ShoppingCart size={16} />
                <span>Thêm vào giỏ</span>
              </button>

              {/* Quick View */}
              {onQuickView && (
                <button
                  onClick={handleQuickView}
                  className="p-2.5 bg-white/90 text-gray-700 rounded-lg hover:bg-white transition shadow-md"
                  title="Xem nhanh"
                >
                  <Eye size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="md:hidden absolute inset-x-3 bottom-3 flex gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-white text-black py-2 px-3 rounded-lg text-xs font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <ShoppingCart size={14} />
              <span>Thêm</span>
            </button>
            {onQuickView && (
              <button
                onClick={handleQuickView}
                className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition shadow-md"
              >
                <Eye size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3">
          {/* Category */}
          <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
            {product.category}
          </p>

          {/* Product Name */}
          <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-black transition min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-black">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Rating (Optional) */}
          {product.rating && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xs ${i < product.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.reviews || 0})</span>
            </div>
          )}

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {product.colors.slice(0, 5).map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              {product.colors.length > 5 && (
                <span className="text-xs text-gray-500 ml-1">+{product.colors.length - 5}</span>
              )}
            </div>
          )}

          {/* Stock Status */}
          {product.stock !== undefined && (
            <div className="mt-2">
              {product.stock > 0 ? (
                <span className="text-xs text-green-600 font-medium">• Còn hàng</span>
              ) : (
                <span className="text-xs text-red-600 font-medium">• Hết hàng</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;