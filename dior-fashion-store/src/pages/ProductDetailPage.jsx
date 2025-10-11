import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, ChevronLeft, Star, Truck, Shield, RefreshCw } from 'lucide-react';

const ProductDetailPage = ({ products, onAddToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // Wishlist state với localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('dior_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isWishlisted, setIsWishlisted] = useState(false);

  // Find product
  useEffect(() => {
    const foundProduct = products.find(p => p.id === parseInt(id));
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      navigate('/');
    }
  }, [id, products, navigate]);

  // Check if product is in wishlist
  useEffect(() => {
    if (product) {
      setIsWishlisted(wishlist.some(item => item.id === product.id));
    }
  }, [product, wishlist]);

  // Toggle wishlist
  const handleToggleWishlist = () => {
    let newWishlist;
    
    if (isWishlisted) {
      // Remove from wishlist
      newWishlist = wishlist.filter(item => item.id !== product.id);
      alert('💔 Đã xóa khỏi danh sách yêu thích');
    } else {
      // Add to wishlist
      newWishlist = [...wishlist, product];
      alert('❤️ Đã thêm vào danh sách yêu thích!');
    }
    
    setWishlist(newWishlist);
    setIsWishlisted(!isWishlisted);
    localStorage.setItem('dior_wishlist', JSON.stringify(newWishlist));
    
    // Dispatch custom event to update header
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 tracking-wide">Đang tải...</p>
        </div>
      </div>
    );
  }

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
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Xem sản phẩm ${product.name}`,
        url: window.location.href
      }).catch(() => {
        // Fallback: Copy URL
        navigator.clipboard.writeText(window.location.href);
        alert('📋 Đã copy link sản phẩm!');
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('📋 Đã copy link sản phẩm!');
    }
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];

  return (
    <div className="min-h-screen bg-white pt-20 pb-16">
      {/* Back Button */}
      <div className="container mx-auto px-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="tracking-wide">Quay lại</span>
        </button>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-black transition-colors"
                >
                  <img
                    src={product.image}
                    alt={`${product.name} - ${index}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="text-sm text-gray-500 tracking-widest uppercase">
              {product.category}
            </div>

            <h1 className="text-3xl md:text-4xl font-light tracking-wide">
              {product.name}
            </h1>

            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={18} className="fill-black text-black" />
                ))}
              </div>
              <span className="text-sm text-gray-600">(248 đánh giá)</span>
            </div>

            <div className="text-3xl font-light tracking-wide">
              {formatPrice(product.price)}
            </div>

            <p className="text-gray-700 leading-relaxed">
              Sản phẩm cao cấp từ bộ sưu tập mới nhất của DIOR. 
              Thiết kế tinh tế, chất liệu cao cấp, mang đến sự sang trọng 
              và đẳng cấp cho người sử dụng.
            </p>

            {/* Size Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm tracking-widest uppercase font-medium">
                  Chọn Size
                </label>
                <button className="text-sm text-gray-600 hover:text-black underline">
                  Hướng dẫn chọn size
                </button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`
                      py-3 rounded-lg border-2 tracking-wide font-medium
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
            <div className="space-y-3">
              <label className="text-sm tracking-widest uppercase font-medium">
                Số lượng
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 border-2 border-gray-300 rounded-lg hover:border-black transition-colors"
                >
                  -
                </button>
                <span className="text-xl font-light w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 border-2 border-gray-300 rounded-lg hover:border-black transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                className="w-full bg-black text-white py-4 rounded-lg tracking-widest uppercase font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Thêm vào giỏ hàng
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleToggleWishlist}
                  className={`
                    py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2
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
                
                <button 
                  onClick={handleShare}
                  className="py-3 rounded-lg border-2 border-gray-300 hover:border-black transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  <span className="tracking-wide">Chia sẻ</span>
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Truck size={24} className="text-gray-600 flex-shrink-0" />
                <div>
                  <h3 className="font-medium tracking-wide">Miễn phí vận chuyển</h3>
                  <p className="text-sm text-gray-600">Giao hàng toàn quốc trong 2-3 ngày</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield size={24} className="text-gray-600 flex-shrink-0" />
                <div>
                  <h3 className="font-medium tracking-wide">Chính hãng 100%</h3>
                  <p className="text-sm text-gray-600">Cam kết sản phẩm chính hãng</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <RefreshCw size={24} className="text-gray-600 flex-shrink-0" />
                <div>
                  <h3 className="font-medium tracking-wide">Đổi trả trong 30 ngày</h3>
                  <p className="text-sm text-gray-600">Miễn phí đổi trả nếu không vừa ý</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-20">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              {['description', 'details', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    pb-4 tracking-widest uppercase text-sm font-medium
                    transition-colors relative
                    ${activeTab === tab ? 'text-black' : 'text-gray-500 hover:text-black'}
                  `}
                >
                  {tab === 'description' && 'Mô tả'}
                  {tab === 'details' && 'Chi tiết'}
                  {tab === 'reviews' && 'Đánh giá'}
                  
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Sản phẩm thuộc bộ sưu tập mới nhất của DIOR, được thiết kế với sự tỉ mỉ 
                  và chú ý đến từng chi tiết nhỏ nhất. Chất liệu cao cấp được tuyển chọn kỹ lưỡng 
                  đảm bảo độ bền và sự thoải mái tuyệt đối.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Thiết kế sang trọng, thanh lịch phù hợp cho mọi dịp từ công sở đến dự tiệc. 
                  Đây là sự lựa chọn hoàn hảo cho những ai yêu thích phong cách thời trang 
                  đẳng cấp và tinh tế.
                </p>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-3">
                <div className="flex py-3 border-b">
                  <span className="w-40 text-gray-600">Chất liệu:</span>
                  <span className="font-medium">Cotton cao cấp</span>
                </div>
                <div className="flex py-3 border-b">
                  <span className="w-40 text-gray-600">Xuất xứ:</span>
                  <span className="font-medium">Pháp</span>
                </div>
                <div className="flex py-3 border-b">
                  <span className="w-40 text-gray-600">Hướng dẫn giặt:</span>
                  <span className="font-medium">Giặt tay, không dùng máy sấy</span>
                </div>
                <div className="flex py-3 border-b">
                  <span className="w-40 text-gray-600">Màu sắc:</span>
                  <span className="font-medium">Đen</span>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b">
                  <div className="text-center">
                    <div className="text-5xl font-light">5.0</div>
                    <div className="flex justify-center mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={16} className="fill-black text-black" />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">248 đánh giá</div>
                  </div>
                  <button className="ml-auto px-6 py-3 border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors tracking-wide">
                    Viết đánh giá
                  </button>
                </div>

                {[1, 2, 3].map((review) => (
                  <div key={review} className="border-b pb-6">
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} className="fill-black text-black" />
                      ))}
                    </div>
                    <h4 className="font-medium mb-1">Sản phẩm tuyệt vời</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Chất lượng tốt, đúng như mô tả. Rất hài lòng với sản phẩm này.
                    </p>
                    <div className="text-sm text-gray-500">
                      Nguyễn Văn A • 15/01/2025
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;