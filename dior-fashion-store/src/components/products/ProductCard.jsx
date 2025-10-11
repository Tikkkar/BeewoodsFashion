import React, { useState } from 'react';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product, onAddToCart, onQuickView }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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
  React.useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('dior_wishlist') || '[]');
    setIsWishlisted(wishlist.some(item => item.id === product.id));
  }, [product.id]);

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="bg-white rounded-lg overflow-hidden">
        
        {/* Image Container */}
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
          {/* Skeleton Loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />

          {/* Sale Badge */}
          {product.discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{product.discount}%
            </div>
          )}

          {/* Quick Actions - Show on Hover */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center justify-center gap-2">
              
              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-white text-black py-2 px-3 rounded text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Thêm vào giỏ</span>
              </button>

              {/* Wishlist */}
              <button
                onClick={handleWishlist}
                className={`p-2 rounded transition ${
                  isWishlisted
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>

              {/* Quick View */}
              {onQuickView && (
                <button
                  onClick={handleQuickView}
                  className="p-2 bg-white text-gray-700 rounded hover:bg-gray-100 transition"
                >
                  <Eye size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3">
          {/* Category */}
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
            {product.category}
          </p>

          {/* Product Name */}
          <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-black transition">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2">
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className="text-base font-bold text-black">
              {formatPrice(product.price)}
            </span>
          </div>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {product.colors.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-gray-500">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;