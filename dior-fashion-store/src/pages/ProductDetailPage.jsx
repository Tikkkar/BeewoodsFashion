
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
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, selectedSize);
    }
    // Hiển thị thông báo thành công
    alert('✅ Đã thêm sản phẩm vào giỏ hàng!');
  };

  // HÀM MỚI: Xử lý mua ngay - chuyển đến trang thanh toán
  const handleBuyNow = () => {
    if (!selectedSize) {
      alert('⚠️ Vui lòng chọn size!');
      return;
    }

    // Tạo đối tượng sản phẩm để chuyển đến checkout
    const checkoutProduct = {
      ...product,
      selectedSize,
      quantity,
      totalPrice: product.price * quantity
    };

    // Lưu thông tin sản phẩm vào localStorage để CheckoutPage có thể đọc
    localStorage.setItem('direct_checkout_product', JSON.stringify(checkoutProduct));
    
    // Chuyển hướng đến trang thanh toán
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
                size={16} 
                className={`${i < Math.floor(parseFloat(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'}`} 
              />
            ))}
          </div>
          <div className="text-sm text-gray-600">{product.reviews?.length || 0} đánh giá</div>
        </div>
        
        <div className="flex-1 space-y-2 w-full">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = product.reviews?.filter(r => r.rating === rating).length || 0;
            const percentage = product.reviews?.length ? (count / product.reviews.length) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-6 md:w-8">{rating} ★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${percentage}%` }}></div>
                </div>
                <span className="text-sm text-gray-600 w-8 md:w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      {product.reviews && product.reviews.length > 0 ? (
        <div className="space-y-4 md:space-y-6">
          {product.reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 md:pb-6 last:border-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-600 text-sm md:text-base">
                  {review.user_id ? 'U' : '?'}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1">
                    <h4 className="font-semibold text-sm md:text-base">Khách hàng</h4>
                    {review.is_verified_purchase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full w-fit">
                        ✓ Đã mua hàng
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 md:py-12 text-gray-500">
          <p className="mb-2 md:mb-4">Chưa có đánh giá nào</p>
          <p className="text-sm">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
        </div>
      )}
      
      {/* Write Review Button */}
      <div className="border-t pt-4 md:pt-6">
        <button className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 border-2 border-black rounded-lg hover:bg-black hover:text-white transition font-medium text-sm md:text-base">
          Viết đánh giá của bạn
        </button>
      </div>
    </div>
  );

  // =============================================
  // RENDER STATES
  // =============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black" />
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h2>
          <p className="text-gray-600 mb-6">{error || 'Sản phẩm không tồn tại'}</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Quay lại trang sản phẩm
          </button>
        </div>
      </div>
    );
  }

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <div className="min-h-screen bg-white">
      
      {/* Free Shipping Banner */}
      <div className="sticky top-0 bg-red-50 border-b border-red-100 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <p className="text-center text-sm text-red-700">
            🎁 <strong>Miễn phí vận chuyển</strong> cho đơn hàng từ 2 sản phẩm - Áp dụng toàn quốc
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-black transition">Trang chủ</Link>
<ChevronRight size={14} className="text-gray-400" />
            <Link to="/products" className="text-gray-500 hover:text-black transition">Sản phẩm</Link>
            <ChevronRight size={14} className="text-gray-400" />
            <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
          
          {/* Left: Images */}
          <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4">
            {/* Thumbnail Gallery */}
            <div className="flex md:flex-col gap-2 md:gap-3 w-full md:w-20 lg:w-24">
              {productImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all w-1/4 md:w-full ${
                    selectedImage === index
                      ? 'border-black shadow-md'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden group">
              <img
                key={productImages[selectedImage]}
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              />
              
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="absolute top-3 md:top-4 left-3 md:left-4 bg-red-500 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </div>
              )}

              {productImages.length > 1 && (
                <div className="absolute inset-x-3 md:inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length)}
                    className="p-1 md:p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition"
                  >
                    <ChevronLeft size={16} className="md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev + 1) % productImages.length)}
                    className="p-1 md:p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition"
                  >
                    <ChevronRight size={16} className="md:w-5 md:h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-2 md:gap-3">
              <span className="text-2xl md:text-3xl font-bold text-black">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-base md:text-lg text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Reviews Summary - Hiển thị ở đầu trang thông tin sản phẩm */}
            <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={`${i < Math.floor(parseFloat(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold ml-1">{averageRating}</span>
              </div>
              <span className="text-gray-500 text-sm">•</span>
              <button 
                onClick={() => setActiveTab('reviews')}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition"
              >
                {product.reviews?.length || 0} đánh giá
              </button>
            </div>

            <div className="text-xs md:text-sm text-gray-600">
              Mã sản phẩm: <span className="font-medium">SP{product.id.toString().substring(0, 8).toUpperCase()}</span>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 text-green-700">
                <Package size={16} className="md:w-5 md:h-5" />
                <span className="font-semibold text-sm md:text-base">Được kiểm tra hàng trước</span>
              </div>
              <button 
                onClick={() => setShowShippingPolicy(true)}
                className="text-xs md:text-sm text-green-600 hover:text-green-800 underline mt-1"
              >
                Nhấp để xem chính sách
              </button>
            </div>

            <p className="text-gray-700 leading-relaxed text-xs md:text-sm border-l-3 md:border-l-4 border-gray-300 pl-3 md:pl-4 italic">
              {product.description || `${product.name} là một thiết kế hiện đại, tinh giản nhưng đầy điểm nhấn. Với thiết kế sang trọng, sản phẩm này không chỉ dễ phối đồ mà còn khéo léo tôn lên phong cách của người mặc.`}
            </p>

            <div className="border-t pt-4 md:pt-6 space-y-4 md:space-y-5">
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs md:text-sm font-semibold uppercase tracking-wide">Chọn Size</label>
                  <button 
                    onClick={() => setShowSizeGuide(true)}
                    className="text-xs md:text-sm text-gray-600 hover:text-black underline flex items-center gap-1"
                  >
                    <Ruler size={12} className="md:w-3 md:h-3" />
                    Hướng dẫn chọn size
                  </button>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 md:py-3 rounded-lg border-2 font-medium text-xs md:text-sm transition-all ${
                        selectedSize === size
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <label className="text-xs md:text-sm font-semibold uppercase tracking-wide">Số lượng</label>
                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 md:w-10 md:h-10 border-2 border-gray-300 rounded-lg hover:border-black transition flex items-center justify-center font-bold text-sm md:text-base"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 md:w-16 h-8 md:h-10 text-center border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm md:text-base"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 md:w-10 md:h-10 border-2 border-gray-300 rounded-lg hover:border-black transition flex items-center justify-center font-bold text-sm md:text-base"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3 pt-2 md:pt-4">
                {/* NÚT MUA NGAY - CHUYỂN ĐẾN CHECKOUT */}
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className={`w-full py-3 md:py-4 rounded-lg font-semibold uppercase tracking-wide transition flex items-center justify-center gap-2 text-sm md:text-base ${
                    product.stock === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  <ShoppingCart size={16} className="md:w-5 md:h-5" />
                  {product.stock === 0 ? 'Hết hàng' : 'Mua ngay'}
                </button>
                
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {/* NÚT THÊM VÀO GIỎ HÀNG */}
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`py-2 md:py-3 rounded-lg border-2 font-medium transition flex items-center justify-center gap-2 text-xs md:text-sm ${
                      product.stock === 0
                        ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                        : 'border-gray-300 hover:border-black hover:bg-gray-50'
                    }`}
                  >
                    <ShoppingCart size={14} className="md:w-4 md:h-4" />
                    <span>Thêm vào giỏ</span>
                  </button>
                  
                  <button 
                    onClick={handleShare}
                    className="py-2 md:py-3 rounded-lg border-2 border-gray-300 hover:border-black transition font-medium flex items-center justify-center gap-2 text-xs md:text-sm"
                  >
                    <Share2 size={14} className="md:w-4 md:h-4" />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 md:pt-6 space-y-2 md:space-y-3">
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                <Check size={12} className="md:w-4 md:h-4 text-green-600" />
                <span>Miễn phí vận chuyển từ 2 sản phẩm</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                <Check size={12} className="md:w-4 md:h-4 text-green-600" />
                <span>Đổi trả trong 7 ngày nếu không vừa ý</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                <Check size={12} className="md:w-4 md:h-4 text-green-600" />
                <span>Được kiểm tra hàng trước khi thanh toán</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                <Check size={12} className="md:w-4 md:h-4 text-green-600" />
                <span>Hỗ trợ thanh toán COD toàn quốc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - Với Reviews được đưa lên đầu */}
        <div className="mt-8 md:mt-12">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 md:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide">
              {[
                { id: 'reviews', label: `Đánh giá (${product.reviews?.length || 0})` },
                { id: 'description', label: 'Mô tả sản phẩm' },
                { id: 'details', label: 'Thông tin chi tiết' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 md:pb-4 text-sm md:text-base font-medium whitespace-nowrap transition-colors relative ${
                    activeTab === tab.id ? 'text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="py-6 md:py-8">
            {activeTab === 'reviews' && <ReviewsSection />}
            
           {activeTab === 'description' && (
  <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
    {/* Kiểm tra xem có custom content từ SEO Manager không */}
    {product.attributes?.content_blocks && 
     product.attributes.content_blocks.length > 0 ? (
      // ✅ RENDER CUSTOM CONTENT TỪ ADMIN
      <>
        {product.attributes.content_blocks.map((block) => (
          <div key={block.id}>
            {block.type === 'text' ? (
              <div>
                {block.title && (
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">
                    {block.title}
                  </h3>
                )}
                <p 
                  className="text-gray-700 leading-relaxed text-sm md:text-base"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              </div>
            ) : block.type === 'image' ? (
              <figure className="my-6 md:my-8">
                {block.url && (
                  <img 
                    src={block.url} 
                    alt={block.alt || product.name} 
                    className="w-full rounded-lg shadow-md"
                    loading="lazy"
                  />
                )}
                {block.caption && (
                  <figcaption className="text-center text-xs md:text-sm text-gray-500 mt-2 md:mt-3 italic">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            ) : null}
          </div>
        ))}
      </>
    ) : (
      // ❌ FALLBACK - NỘI DUNG MẶC ĐỊNH (GIỮ NGUYÊN CODE CŨ)
      <>
        <div className="text-center space-y-3 md:space-y-4">
          <p className="text-base md:text-lg leading-relaxed text-gray-800">
            <strong>{product.name}</strong> là một thiết kế hiện đại, tinh giản nhưng đầy điểm nhấn. 
            Sản phẩm không chỉ dễ phối cùng nhiều kiểu trang phục khác nhau mà còn khéo léo tôn lên 
            phong cách riêng của người mặc.
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
      </div>

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