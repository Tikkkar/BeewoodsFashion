import React, { useState } from 'react';
import { X, ShoppingCart, Heart, Star, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickViewModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!isOpen || !product) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('⚠️ Vui lòng chọn size!');
      return;
    }
    onAddToCart({
      ...product,
      size: selectedSize,
      quantity: quantity
    });
    onClose();
  };

  const handleViewFullDetails = () => {
    onClose();
    navigate(`/product/${product.id}`);
  };

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // Thêm logic lưu wishlist nếu cần
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[100] transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto my-8 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Product Image */}
            <div className="relative">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* View Full Details Button */}
              <button
                onClick={handleViewFullDetails}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-300 rounded-lg hover:border-black transition-colors text-sm tracking-wide"
              >
                <Eye size={18} />
                <span>Xem chi tiết đầy đủ</span>
              </button>
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div className="text-sm text-gray-500 tracking-widest uppercase">
                {product.category}
              </div>

              <h2 className="text-2xl md:text-3xl font-light tracking-wide">
                {product.name}
              </h2>

              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} className="fill-black text-black" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(248 đánh giá)</span>
              </div>

              <div className="text-2xl font-light tracking-wide">
                {formatPrice(product.price)}
              </div>

              <p className="text-gray-700 text-sm leading-relaxed">
                Sản phẩm cao cấp từ bộ sưu tập mới nhất. Thiết kế tinh tế, 
                chất liệu cao cấp, mang đến sự sang trọng và đẳng cấp.
              </p>

              {/* Size Selection */}
              <div className="space-y-2">
                <label className="text-sm tracking-widest uppercase font-medium">
                  Chọn Size
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`
                        py-2 rounded-lg border-2 tracking-wide text-sm font-medium
                        transition-all duration-200
                        ${selectedSize === size
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 hover:border-black'
                        }
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm tracking-widest uppercase font-medium">
                  Số lượng
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-black transition-colors"
                  >
                    -
                  </button>
                  <span className="text-lg font-light w-10 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-black transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-black text-white py-3 rounded-lg tracking-widest uppercase font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} />
                  Thêm vào giỏ hàng
                </button>
                
                <button
                  onClick={handleToggleWishlist}
                  className={`
                    w-full py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2
                    ${isWishlisted
                      ? 'border-red-500 text-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-black'
                    }
                  `}
                >
                  <Heart size={20} className={isWishlisted ? 'fill-red-500' : ''} />
                  <span className="tracking-wide">
                    {isWishlisted ? 'Đã thích' : 'Yêu thích'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickViewModal;