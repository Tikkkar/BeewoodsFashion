import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, ChevronLeft, Star, Check, ChevronRight, Ruler, X, Package, Loader2 } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import { useProductDetail, useProducts } from '../hooks/useProducts';
import sizeGuideImage from '../assets/size.jpg';

const ProductDetailPage = ({ onAddToCart, brand }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // =============================================
  // DATA FETCHING
  // =============================================
  const { product, loading, error } = useProductDetail(slug);
  const { products: allProducts } = useProducts({
    category: product?.categorySlug
  });
  
  // Lấy sản phẩm liên quan (cùng danh mục, trừ sản phẩm hiện tại)
  const relatedProducts = product && allProducts
    ? allProducts.filter(p => p.id !== product.id).slice(0, 4)
    : [];

  // =============================================
  // LOCAL STATES
  // =============================================
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('reviews'); // Mặc định hiển thị reviews
  const [selectedImage, setSelectedImage] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShippingPolicy, setShowShippingPolicy] = useState(false);
  
  // State quản lý danh sách yêu thích
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('dior_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isWishlisted, setIsWishlisted] = useState(false);

  // =============================================
  // EFFECTS
  // =============================================
  // Reset state khi sản phẩm thay đổi
  useEffect(() => {
    if (product) {
      console.group('🔍 PRODUCT DETAIL PAGE DEBUG');
      console.log('1. Product name:', product.name);
      console.log('2. Has attributes?', !!product.attributes);
      console.log('3. Attributes type:', typeof product.attributes);
      console.log('4. Attributes value:', product.attributes);
      console.log('5. Content blocks:', product.attributes?.content_blocks);
      console.log('6. Is array?', Array.isArray(product.attributes?.content_blocks));
      console.log('7. Length:', product.attributes?.content_blocks?.length);
      
      const hasContent = 
        product.attributes?.content_blocks && 
        Array.isArray(product.attributes.content_blocks) &&
        product.attributes.content_blocks.length > 0;
      
      console.log('8. ✅ Should render custom?', hasContent);
      console.groupEnd();
    }
  }, [product]);

  // Kiểm tra trạng thái yêu thích
  useEffect(() => {
    if (product) {
      setIsWishlisted(wishlist.some(item => item.id === product.id));
    }
  }, [product, wishlist]);

  // =============================================
  // DERIVED STATE (TRẠNG THÁI SUY RA)
  // =============================================
  // Logic lấy danh sách ảnh an toàn
  const productImages = (product?.images && product.images.length > 0)
    ? product.images
    : (product?.image ? [product.image] : []);
    
  // Lấy danh sách sizes
  const sizes = product?.sizes 
    ? product.sizes.map(s => typeof s === 'object' ? s.size : s)
    : [];

  // Tính toán rating trung bình
  const averageRating = product?.reviews && product.reviews.length > 0
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : '5.0';

  // =============================================
  // HANDLERS
  // =============================================
  const handleToggleWishlist = () => {
    let newWishlist;
    if (isWishlisted) {
      newWishlist = wishlist.filter(item => item.id !== product.id);
    } else {
      newWishlist = [...wishlist, product];
    }
    setWishlist(newWishlist);
    setIsWishlisted(!isWishlisted);
    localStorage.setItem('dior_wishlist', JSON.stringify(newWishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

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
    
    // ✅ Đảm bảo sản phẩm có đầy đủ thuộc tính ảnh
    const productWithImage = {
      ...product,
      imagePrimary: product.imagePrimary || product.image || productImages[0],
      image: product.image || productImages[0]
    };
    
    for (let i = 0; i < quantity; i++) {
      onAddToCart(productWithImage, selectedSize);
    }
    alert('✅ Đã thêm sản phẩm vào giỏ hàng!');
  };
  const handleBuyNow = () => {
    if (!selectedSize) {
      alert('⚠️ Vui lòng chọn size!');
      return;
    }

    // ✅ Đảm bảo sản phẩm có đầy đủ thuộc tính ảnh
    const productWithImage = {
      ...product,
      imagePrimary: product.imagePrimary || product.image || productImages[0],
      image: product.image || productImages[0]
    };
    
    for (let i = 0; i < quantity; i++) {
      onAddToCart(productWithImage, selectedSize);
    }
    
    navigate('/checkout');
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Xem sản phẩm ${product.name}`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('📋 Đã copy link sản phẩm!');
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  // =============================================
  // LOADING & ERROR STATES
  // =============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Không tìm thấy sản phẩm</p>
          <Link to="/products" className="text-blue-600 hover:underline">
            ← Quay lại trang sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  // =============================================
  // COMPONENTS
  // =============================================
  // Component hiển thị phần đánh giá
  const ReviewsSection = () => (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-4 md:p-6 bg-gray-50 rounded-lg">
        <div className="text-center w-full md:w-auto">
          <div className="text-4xl md:text-5xl font-bold mb-2">
            {averageRating}
          </div>
          <div className="flex justify-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={20} 
                className={i < Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <p className="text-gray-600 text-sm">
            {product.reviews?.length || 0} đánh giá
          </p>
        </div>
        
        <div className="flex-1 w-full">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = product.reviews?.filter(r => r.rating === star).length || 0;
            const percentage = product.reviews?.length ? (count / product.reviews.length * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 mb-2">
                <span className="text-xs md:text-sm w-12 text-gray-600">{star} sao</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs md:text-sm w-12 text-right text-gray-600">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4 md:space-y-6">
        {product.reviews && product.reviews.length > 0 ? (
          product.reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 md:pb-6 last:border-0">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm md:text-base font-semibold text-gray-600">
                    {review.user.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm md:text-base">{review.user}</span>
                    {review.verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        ✓ Đã mua hàng
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{review.date}</span>
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-2">
                    {review.comment}
                  </p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, idx) => (
                        <img 
                          key={idx}
                          src={img} 
                          alt={`Review ${idx + 1}`}
                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">Chưa có đánh giá nào</p>
        )}
      </div>
    </div>
  );

  // =============================================
  // RENDER
  // =============================================
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 overflow-x-auto whitespace-nowrap pb-2">
        <Link to="/" className="text-gray-600 hover:text-gray-900">Trang chủ</Link>
        <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
        <Link to="/products" className="text-gray-600 hover:text-gray-900">Sản phẩm</Link>
        <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
        <span className="text-gray-900 truncate">{product.name}</span>
      </nav>

      {/* Product Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12">
        {/* Left: Images */}
        <div className="space-y-3 md:space-y-4">
          {/* Main Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
            <img 
              src={productImages[selectedImage]} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Thumbnails */}
          {productImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2 md:gap-3">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-black' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img 
                    src={image} 
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="space-y-4 md:space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3">
              {product.name}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    className={i < Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-xs md:text-sm text-gray-600">
                {averageRating} ({product.reviews?.length || 0} đánh giá)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4 md:mb-6">
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-600">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-base md:text-lg text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Size Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm md:text-base font-semibold">Chọn size:</label>
              <button 
                onClick={() => setShowSizeGuide(true)}
                className="text-xs md:text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Ruler size={14} />
                Hướng dẫn chọn size
              </button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2 md:py-3 px-3 md:px-4 rounded-lg border-2 text-sm md:text-base font-medium transition-all ${
                    selectedSize === size
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm md:text-base font-semibold mb-3 block">Số lượng:</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center text-lg md:text-xl"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 md:w-20 h-10 md:h-12 text-center border-2 border-gray-200 rounded-lg text-base md:text-lg font-semibold"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center text-lg md:text-xl"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 py-3 md:py-4 px-4 md:px-6 bg-white border-2 border-black rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base font-semibold"
            >
              <ShoppingCart size={18} />
              Thêm vào giỏ
            </button>
            <button
              onClick={handleBuyNow}
              className="flex items-center justify-center gap-2 py-3 md:py-4 px-4 md:px-6 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm md:text-base font-semibold"
            >
              Mua ngay
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleToggleWishlist}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 md:py-3 px-4 rounded-lg border-2 transition-all text-sm md:text-base ${
                isWishlisted
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
              {isWishlisted ? 'Đã yêu thích' : 'Yêu thích'}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 md:py-3 px-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all text-sm md:text-base"
            >
              <Share2 size={18} />
              Chia sẻ
            </button>
          </div>

          {/* Policies */}
          <div className="space-y-3 pt-4 border-t">
            <button
              onClick={() => setShowShippingPolicy(true)}
              className="w-full flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <Package size={20} className="text-gray-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm md:text-base">Miễn phí vận chuyển</p>
                  <p className="text-xs md:text-sm text-gray-600">Cho đơn hàng từ 2 sản phẩm</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button
              onClick={() => setShowShippingPolicy(true)}
              className="w-full flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <Check size={20} className="text-gray-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm md:text-base">Đổi trả miễn phí</p>
                  <p className="text-xs md:text-sm text-gray-600">Trong vòng 7 ngày</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="border-t pt-8 md:pt-12">
        <div className="flex gap-4 md:gap-8 mb-6 md:mb-8 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 md:pb-4 px-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${
              activeTab === 'reviews'
                ? 'border-black font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Đánh giá ({product.reviews?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 md:pb-4 px-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${
              activeTab === 'description'
                ? 'border-black font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Mô tả chi tiết
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 md:pb-4 px-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${
              activeTab === 'details'
                ? 'border-black font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Thông số kỹ thuật
          </button>
        </div>

        <div>
          {activeTab === 'reviews' && <ReviewsSection />}

          {activeTab === 'description' && (
  <div className="prose prose-sm md:prose-base max-w-none">
    {product.attributes?.content_blocks && 
     Array.isArray(product.attributes.content_blocks) && 
     product.attributes.content_blocks.length > 0 ? (
      // Render custom content từ Strapi
      <>
        {product.attributes.content_blocks.map((block, index) => {
          if (block.__component === 'shared.rich-text') {
            return (
              <div 
                key={index}
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: block.body }}
              />
            );
          }
          return null;
        })}
      </>
    ) : (
      // Fallback: Render template mặc định
      <>
        <div className="space-y-4 md:space-y-6">
          <p className="text-gray-700 leading-relaxed text-sm md:text-base">
            Trong thế giới thời trang hiện đại, có những món đồ không chỉ đơn thuần là "trang phục" 
            mà còn là cách bạn thể hiện phong cách riêng của người mặc.
          </p>
          <p className="text-gray-700 leading-relaxed text-sm md:text-base">
            Có những món đồ mà chỉ qua ánh nhìn đầu tiên, bạn có thể cảm nhận ngay sự duyên dáng tinh tế. 
            <strong> {product.name}</strong> chính là một trong số đó.
          </p>
        </div>

        <figure className="my-6 md:my-8">
          <img 
            src={productImages[0]} 
            alt={product.name} 
            className="w-full rounded-lg shadow-md"
          />
          <figcaption className="text-center text-xs md:text-sm text-gray-500 mt-2 md:mt-3 italic">
            {product.name} - Thiết kế sang trọng, tinh tế
          </figcaption>
        </figure>

        <div className="space-y-4 md:space-y-6">
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Kiểu dáng duyên dáng, tạo chiều sâu</h3>
            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              Đường cắt tinh tế và chi tiết phối hợp khéo léo, vừa tạo cảm giác thanh mảnh hơn 
              cho vóc dáng, vừa giúp outfit trở nên cuốn hút mà không cần quá cầu kỳ. Thiết kế 
              này không chỉ đẹp mà còn rất dễ ứng dụng trong nhiều hoàn cảnh.
            </p>
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Dễ dàng phối đồ, linh hoạt trong nhiều phong cách</h3>
            <p className="text-gray-700 leading-relaxed text-sm md:text-base mb-3 md:mb-4">
              Sản phẩm có thể kết hợp với nhiều kiểu áo khác nhau - từ áo sơ mi công sở đến áo thun 
              basic, hay những chiếc áo crop top cá tính. Màu sắc trung tính giúp bạn dễ dàng mix-match 
              với các items khác trong tủ đồ.
            </p>
            <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                <span>💡</span>
                Gợi ý phối đồ cùng {product.name}:
              </h4>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-700">
                <li>✓ Áo sơ mi trắng + giày cao gót → phong cách công sở thanh lịch</li>
                <li>✓ Áo thun basic + sneakers → outfit dạo phố năng động</li>
                <li>✓ Áo ôm cổ lọ + boots → look sang trọng cho buổi tối</li>
                <li>✓ Áo kiểu phối lụa + sandals → vẻ ngoài nữ tính, dịu dàng</li>
              </ul>
            </div>
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Đơn giản nhưng duyên dáng, thanh nhã nhưng không mờ nhạt</h3>
            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              <strong>{product.name}</strong> là minh chứng cho triết lý thời trang "ít mà chất": 
              đơn giản nhưng duyên dáng, thanh nhã nhưng không mờ nhạt. Đây là item không thể thiếu 
              trong tủ đồ của những người yêu phong cách tinh tế, dễ ứng dụng nhưng vẫn có chiều sâu riêng.
            </p>
          </div>
        </div>

        <div className="text-center py-4 md:py-6 my-6 md:my-8 border-t border-b border-gray-200">
          <p className="text-gray-700 italic text-base md:text-lg">
            Nếu bạn đang tìm kiếm một sản phẩm để nhẹ nhàng làm mới bản thân và style của mình, 
            đây chính là món đồ đáng để "đặt ngay".
          </p>
        </div>
      </>
    )}
  </div>
)}

          {activeTab === 'details' && (
            <div className="max-w-3xl">
              <div className="space-y-2 md:space-y-3">
                {[
                  { label: 'Chất liệu', value: 'Cotton cao cấp, pha spandex' },
                  { label: 'Xuất xứ', value: 'Việt Nam' },
                  { label: 'Màu sắc', value: product.category || 'Đa dạng' },
                  { label: 'Size', value: sizes.join(', ') },
                  { label: 'Hướng dẫn giặt', value: 'Giặt tay hoặc máy giặt ở chế độ nhẹ, không dùng nước nóng' },
                  { label: 'Hướng dẫn bảo quản', value: 'Phơi ở nơi thoáng mát, tránh ánh nắng trực tiếp' },
                  { label: 'Thương hiệu', value: brand?.name || 'DIOR STORE' }
                ].map((item, index) => (
                  <div key={index} className="flex py-2 md:py-3 border-b last:border-0 text-xs md:text-sm">
                    <span className="w-28 md:w-40 text-gray-600 font-medium">{item.label}:</span>
                    <span className="flex-1 text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12 md:mt-16 border-t pt-8 md:pt-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 md:mb-8 text-center">
            Sản Phẩm Liên Quan
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSizeGuide(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Hướng dẫn chọn size</h3>
              <button onClick={() => setShowSizeGuide(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <img src={sizeGuideImage} alt="Size Guide" className="w-full rounded-lg mb-4" />
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Để chọn size phù hợp, hãy đo vòng eo và chiều cao của bạn, sau đó so sánh với bảng size trên.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">Lưu ý quan trọng:</h4>
                  <ul className="text-xs space-y-1 text-yellow-800">
                    <li>• Nếu bạn ở giữa hai size, hãy chọn size lớn hơn</li>
                    <li>• Sản phẩm có thể giãn nhẹ sau vài lần mặc đầu tiên</li>
                    <li>• Để được tư vấn size chính xác, hãy liên hệ với chúng tôi</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Policy Modal */}
      {showShippingPolicy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShippingPolicy(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Chính sách vận chuyển & đổi trả</h3>
              <button onClick={() => setShowShippingPolicy(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🚚 Vận chuyển</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Miễn phí vận chuyển cho đơn hàng từ 2 sản phẩm</li>
                  <li>• Giao hàng toàn quốc trong 2-5 ngày làm việc</li>
                  <li>• Được kiểm tra hàng trước khi thanh toán</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔄 Đổi trả</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Đổi trả miễn phí trong 7 ngày nếu không vừa ý</li>
                  <li>• Sản phẩm phải còn nguyên tag, chưa qua sử dụng</li>
                  <li>• Hỗ trợ đổi size nếu còn hàng</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">💳 Thanh toán</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Hỗ trợ thanh toán COD toàn quốc</li>
                  <li>• Chuyển khoản ngân hàng với nhiều ưu đãi</li>
                  <li>• Thanh toán qua ví điện tử Momo, ZaloPay</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;