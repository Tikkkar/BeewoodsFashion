import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Heart, Star, ExternalLink, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';

const QuickViewModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const navigate = useNavigate();
  const { error: showError, success: showSuccess } = useToast();
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setImageLoaded(false);
      
      if (product.sizes && product.sizes.length > 0) {
        const firstSize = typeof product.sizes[0] === 'object' 
          ? product.sizes[0].size 
          : product.sizes[0];
        setSelectedSize(firstSize);
      } else {
        setSelectedSize('');
      }
      
      const wishlist = JSON.parse(localStorage.getItem('dior_wishlist') || '[]');
      setIsWishlisted(wishlist.some(item => item.id === product.id));
      
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!selectedSize && sizes.length > 0) {
      showError('Vui lòng chọn size!');
      return;
    }
    
    onAddToCart(product, selectedSize, quantity);
    showSuccess(`${product.name} đã được thêm vào giỏ hàng.`);
    onClose();
  };

  const handleViewFullDetails = () => {
    onClose();
    navigate(`/product/${product.slug}`);
  };

  const handleToggleWishlist = () => {
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

  const sizes = product.sizes 
    ? product.sizes.map(s => typeof s === 'object' ? s.size : s)
    : [];

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const avgRating = product.reviews && product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 5;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] animate-in fade-in zoom-in duration-300 flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white rounded-full transition-all shadow-md hover:shadow-lg"
          >
            <X size={20} />
          </button>
        
          {/* ✨ SỬA LỖI: Cấu trúc layout mới cho mobile và desktop */}
          <div className="flex flex-col md:grid md:grid-cols-2 flex-1 overflow-hidden">
            {/* Left: Product Image */}
            <div className="relative bg-gray-100 flex items-center justify-center h-[45vh] md:h-full flex-shrink-0">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              <img
                src={product.imagePrimary}
                alt={product.name}
                className="w-full h-full object-contain"
                onLoad={() => setImageLoaded(true)}
              />
              {discount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                  -{discount}%
                </div>
              )}
            </div>

            {/* Right: Product Info (cho phép cuộn) */}
            <div className="flex flex-col p-6 md:p-8 overflow-y-auto flex-1">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                {product.category}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {product.name}
              </h2>

              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      className={i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'} 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  ({product.reviews?.length || 0} đánh giá)
                </span>
                <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  • {product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-4 pb-4 border-b">
                <span className="text-3xl font-bold text-black">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mb-6">
                {product.description || 'Sản phẩm cao cấp từ bộ sưu tập mới nhất. Thiết kế tinh tế, chất liệu cao cấp, mang đến sự sang trọng và đẳng cấp cho người sử dụng.'}
              </p>
              
              <div className="mt-auto space-y-6">
                {sizes.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold uppercase tracking-wide flex items-center justify-between">
                      <span>Chọn Size</span>
                      {selectedSize && (
                        <span className="text-xs font-normal text-gray-600 normal-case">
                          Đã chọn: <span className="font-semibold text-black">{selectedSize}</span>
                        </span>
                      )}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                            selectedSize === size
                              ? 'border-black bg-black text-white scale-105 shadow-md'
                              : 'border-gray-300 hover:border-black hover:scale-105'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-sm font-semibold uppercase tracking-wide">
                    Số lượng
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-11 h-11 border-2 border-gray-300 rounded-lg hover:border-black transition flex items-center justify-center"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 h-11 text-center border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none font-medium"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-11 h-11 border-2 border-gray-300 rounded-lg hover:border-black transition flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`w-full py-4 rounded-lg font-semibold uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
                      product.stock === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    <ShoppingCart size={20} />
                    {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                  </button>
                  
                  <button
                    onClick={handleToggleWishlist}
                    className={`w-full py-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                      isWishlisted
                        ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-100'
                        : 'border-gray-300 hover:border-black hover:bg-gray-50'
                    }`}
                  >
                    <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                    <span className="text-sm">
                      {isWishlisted ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
                    </span>
                  </button>
                  <button
                    onClick={handleViewFullDetails}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-all text-sm font-medium"
                  >
                    <ExternalLink size={18} />
                    <span>Xem chi tiết đầy đủ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickViewModal;