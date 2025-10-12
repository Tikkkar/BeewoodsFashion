import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, ChevronLeft, Star, Truck, Shield, RefreshCw, Check, ChevronRight, Ruler, X, Package, CreditCard } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';

const ProductDetailPage = ({ products, onAddToCart, brand }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedImage, setSelectedImage] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShippingPolicy, setShowShippingPolicy] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Wishlist state
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('dior_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isWishlisted, setIsWishlisted] = useState(false);

  // Find product and related products
  useEffect(() => {
    const foundProduct = products.find(p => p.id === parseInt(id));
    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedImage(0);
      setImageLoaded(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  }, [id, products, navigate]);

  // Check wishlist status
  useEffect(() => {
    if (product) {
      setIsWishlisted(wishlist.some(item => item.id === product.id));
    }
  }, [product, wishlist]);

  // Get related products (same category)
  const relatedProducts = product
    ? products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  // Product images (mock multiple images for story)
  const productImages = product ? [
    product.image,
    product.image, // Placeholder for lifestyle
    product.image, // Placeholder for detail close-up
    product.image  // Placeholder for styling
  ] : [];

  // Toggle wishlist
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
    onAddToCart({
      ...product,
      size: selectedSize,
      quantity: quantity
    });
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

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Free Shipping Banner - Sticky (Hagoo Style) */}
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
            <Link to="/" className="text-gray-500 hover:text-black transition">
              Trang chủ
            </Link>
            <ChevronRight size={14} className="text-gray-400" />
            <Link to="/products" className="text-gray-500 hover:text-black transition">
              Sản phẩm
            </Link>
            <ChevronRight size={14} className="text-gray-400" />
            <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left: Images */}
          <div className="flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnail Gallery (Vertical) */}
            <div className="flex md:flex-col gap-3 w-full md:w-24">
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
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              
              {/* Sale Badge */}
              {product.discount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{product.discount}%
                </div>
              )}

              {/* Image Navigation */}
              {productImages.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length)}
                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev + 1) % productImages.length)}
                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            
            {/* Product Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-black">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Product Code (Hagoo Style) */}
            <div className="text-sm text-gray-600">
              Mã sản phẩm: <span className="font-medium">SP{product.id.toString().padStart(3, '0')}</span>
            </div>

            {/* Policy Badge (Hagoo Style) - IMPORTANT */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <Package size={20} />
                <span className="font-semibold">Được kiểm tra hàng trước</span>
              </div>
              <button 
                onClick={() => setShowShippingPolicy(true)}
                className="text-sm text-green-600 hover:text-green-800 underline mt-1"
              >
                Nhấp để xem chính sách
              </button>
            </div>

            {/* Short Description (Hagoo Style) */}
            <p className="text-gray-700 leading-relaxed text-sm border-l-4 border-gray-300 pl-4 italic">
              {product.name} là một thiết kế hiện đại, tinh giản nhưng đầy điểm nhấn. 
              Với thiết kế sang trọng, sản phẩm này không chỉ dễ phối đồ mà còn khéo léo 
              tôn lên phong cách của người mặc.
            </p>

            <div className="border-t pt-6 space-y-5">
              
              {/* Size Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold uppercase tracking-wide">
                    Chọn Size
                  </label>
                  <button 
                    onClick={() => setShowSizeGuide(true)}
                    className="text-sm text-gray-600 hover:text-black underline flex items-center gap-1"
                  >
                    <Ruler size={14} />
                    Hướng dẫn chọn size
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 rounded-lg border-2 font-medium text-sm transition-all ${
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

              {/* Quantity */}
              <div className="space-y-3">
                <label className="text-sm font-semibold uppercase tracking-wide">
                  Số lượng
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-black transition flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-10 text-center border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-black transition flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-black text-white py-4 rounded-lg font-semibold uppercase tracking-wide hover:bg-gray-800 transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} />
                  Mua ngay
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleToggleWishlist}
                    className={`py-3 rounded-lg border-2 font-medium transition flex items-center justify-center gap-2 ${
                      isWishlisted
                        ? 'border-red-500 text-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                    <span className="text-sm">{isWishlisted ? 'Đã thích' : 'Yêu thích'}</span>
                  </button>
                  
                  <button 
                    onClick={handleShare}
                    className="py-3 rounded-lg border-2 border-gray-300 hover:border-black transition font-medium flex items-center justify-center gap-2"
                  >
                    <Share2 size={18} />
                    <span className="text-sm">Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Features (Hagoo Style - Simpler) */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-green-600" />
                <span>Miễn phí vận chuyển từ 2 sản phẩm</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-green-600" />
                <span>Đổi trả trong 7 ngày nếu không vừa ý</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-green-600" />
                <span>Được kiểm tra hàng trước khi thanh toán</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-green-600" />
                <span>Hỗ trợ thanh toán COD toàn quốc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - (Hagoo Style Content) */}
        <div className="mt-16 md:mt-20">
          <div className="border-b border-gray-200">
            <div className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide">
              {[
                { id: 'description', label: 'Mô tả sản phẩm' },
                { id: 'details', label: 'Thông tin chi tiết' },
                { id: 'reviews', label: 'Đánh giá (248)' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-sm md:text-base font-medium whitespace-nowrap transition-colors relative ${
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

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Intro paragraph (Hagoo style) */}
                <div className="text-center space-y-4">
                  <p className="text-lg leading-relaxed text-gray-800">
                    <strong>{product.name}</strong> là một thiết kế hiện đại, tinh giản nhưng đầy điểm nhấn. 
                    Sản phẩm không chỉ dễ phối cùng nhiều kiểu trang phục khác nhau mà còn khéo léo tôn lên 
                    phong cách riêng của người mặc.
                  </p>
                  
                  <p className="text-gray-700 leading-relaxed">
                    Có những món đồ mà chỉ qua ánh nhìn đầu tiên, bạn có thể cảm nhận ngay sự duyên dáng tinh tế. 
                    <strong> {product.name}</strong> chính là một trong số đó.
                  </p>
                </div>

                {/* Product image with caption */}
                <figure className="my-8">
                  <img 
                    src={productImages[0]} 
                    alt={product.name} 
                    className="w-full rounded-lg shadow-md"
                  />
                  <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                    {product.name} - Thiết kế sang trọng, tinh tế
                  </figcaption>
                </figure>

                {/* Feature sections (Hagoo style) */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-3">Kiểu dáng duyên dáng, tạo chiều sâu</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Đường cắt tinh tế và chi tiết phối hợp khéo léo, vừa tạo cảm giác thanh mảnh hơn 
                      cho vóc dáng, vừa giúp outfit trở nên cuốn hút mà không cần quá cầu kỳ. Thiết kế 
                      này không chỉ đẹp mà còn rất dễ ứng dụng trong nhiều hoàn cảnh.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-3">Dễ dàng phối đồ, linh hoạt trong nhiều phong cách</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Sản phẩm có thể kết hợp với nhiều kiểu áo khác nhau - từ áo sơ mi công sở đến áo thun 
                      basic, hay những chiếc áo crop top cá tính. Màu sắc trung tính giúp bạn dễ dàng mix-match 
                      với các items khác trong tủ đồ.
                    </p>
                    
                    {/* Mix & Match suggestions (Hagoo style) */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <span>💡</span>
                        Gợi ý phối đồ cùng {product.name}:
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>✓ Áo sơ mi trắng + giày cao gót → phong cách công sở thanh lịch</li>
                        <li>✓ Áo thun basic + sneakers → outfit dạo phố năng động</li>
                        <li>✓ Áo ôm cổ lọ + boots → look sang trọng cho buổi tối</li>
                        <li>✓ Áo kiểu phối lụa + sandals → vẻ ngoài nữ tính, dịu dàng</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-3">Đơn giản nhưng duyên dáng, thanh nhã nhưng không mờ nhạt</h3>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>{product.name}</strong> là minh chứng cho triết lý thời trang "ít mà chất": 
                      đơn giản nhưng duyên dáng, thanh nhã nhưng không mờ nhạt. Đây là item không thể thiếu 
                      trong tủ đồ của những người yêu phong cách tinh tế, dễ ứng dụng nhưng vẫn có chiều sâu riêng.
                    </p>
                  </div>
                </div>

                {/* Closing statement */}
                <div className="text-center py-6 my-8 border-t border-b border-gray-200">
                  <p className="text-gray-700 italic text-lg">
                    Nếu bạn đang tìm kiếm một sản phẩm để nhẹ nhàng làm mới bản thân và style của mình, 
                    đây chính là món đồ đáng để "đặt ngay".
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="max-w-3xl">
                <div className="space-y-3">
                  {[
                    { label: 'Chất liệu', value: 'Cotton cao cấp, pha spandex' },
                    { label: 'Xuất xứ', value: 'Việt Nam' },
                    { label: 'Màu sắc', value: 'Đen' },
                    { label: 'Size', value: 'XS, S, M, L, XL' },
                    { label: 'Hướng dẫn giặt', value: 'Giặt tay hoặc máy giặt ở chế độ nhẹ, không dùng nước nóng' },
                    { label: 'Hướng dẫn bảo quản', value: 'Phơi ở nơi thoáng mát, tránh ánh nắng trực tiếp' },
                    { label: 'Thương hiệu', value: brand?.name || 'DIOR STORE' }
                  ].map((item, index) => (
                    <div key={index} className="flex py-3 border-b last:border-0 text-sm">
                      <span className="w-40 text-gray-600 font-medium">{item.label}:</span>
                      <span className="flex-1 text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="max-w-3xl space-y-6">
                {/* Rating Summary */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">5.0</div>
                    <div className="flex justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">248 đánh giá</div>
                  </div>
                  
                  <div className="flex-1 space-y-2 w-full">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-8">{rating} ★</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-400" 
                            style={{ width: rating === 5 ? '90%' : rating === 4 ? '8%' : '2%' }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {rating === 5 ? '223' : rating === 4 ? '20' : '5'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Form */}
                <div className="border-t pt-6">
                  <button className="w-full md:w-auto px-6 py-3 border-2 border-black rounded-lg hover:bg-black hover:text-white transition font-medium">
                    Viết đánh giá của bạn
                  </button>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {[
                    { name: 'Nguyễn Thu Hà', date: '15/01/2025', comment: 'Sản phẩm rất đẹp, chất lượng tốt. Giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop tiếp!', verified: true },
                    { name: 'Phạm Mai Anh', date: '12/01/2025', comment: 'Thiết kế sang trọng, form dáng chuẩn. Mặc rất thoải mái và đẹp. Giá cả hợp lý!', verified: true },
                    { name: 'Trần Minh Châu', date: '10/01/2025', comment: 'Chất liệu mềm mại, thoáng mát. Size vừa vặn như mô tả. Rất hài lòng với sản phẩm này.', verified: false }
                  ].map((review, index) => (
                    <div key={index} className="border-b pb-6 last:border-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-600">
                          {review.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{review.name}</h4>
                            {review.verified && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                ✓ Đã mua hàng
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">{review.date}</span>
                          </div>
                          <p className="text-sm text-gray-700">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More */}
                <div className="text-center pt-4">
                  <button className="text-sm text-gray-600 hover:text-black underline">
                    Xem thêm đánh giá
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 md:mt-20 border-t pt-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Sản Phẩm Liên Quan
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
              <h3 className="text-lg font-bold">Hướng Dẫn Chọn Size</h3>
              <button onClick={() => setShowSizeGuide(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Size</th>
                    <th className="py-2 text-center">Vai (cm)</th>
                    <th className="py-2 text-center">Ngực (cm)</th>
                    <th className="py-2 text-center">Eo (cm)</th>
                    <th className="py-2 text-center">Dài (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { size: 'XS', shoulder: '36', chest: '80-84', waist: '60-64', length: '60' },
                    { size: 'S', shoulder: '38', chest: '84-88', waist: '64-68', length: '62' },
                    { size: 'M', shoulder: '40', chest: '88-92', waist: '68-72', length: '64' },
                    { size: 'L', shoulder: '42', chest: '92-96', waist: '72-76', length: '66' },
                    { size: 'XL', shoulder: '44', chest: '96-100', waist: '76-80', length: '68' }
                  ].map((row) => (
                    <tr key={row.size} className="border-b">
                      <td className="py-3 font-semibold">{row.size}</td>
                      <td className="py-3 text-center">{row.shoulder}</td>
                      <td className="py-3 text-center">{row.chest}</td>
                      <td className="py-3 text-center">{row.waist}</td>
                      <td className="py-3 text-center">{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">💡 Gợi ý chọn size:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Đo các số đo cơ thể trước khi chọn size</li>
                  <li>• Nếu bạn đang ở giữa 2 size, hãy chọn size lớn hơn</li>
                  <li>• Liên hệ hotline nếu cần tư vấn thêm: 0983.918.411</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Policy Modal (Hagoo Style - NEW) */}
      {showShippingPolicy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShippingPolicy(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Chính Sách Giao Hàng COD</h3>
              <button onClick={() => setShowShippingPolicy(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Bạn có thể thanh toán cho người giao hàng mà không cần chịu phí thu tiền hộ (COD).
              </p>
              
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-green-800 mb-2">Tóm tắt chính sách:</h4>
                
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <p className="text-sm text-gray-700 flex-1">
                    Chúng tôi hỗ trợ <strong>được kiểm tra hàng trước khi thanh toán</strong> nhưng không mặc thử đồ
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <p className="text-sm text-gray-700 flex-1">
                    Chúng tôi không gửi đơn hàng COD nếu bạn có đơn hàng khác sử dụng COD mà chưa nhận hàng
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <p className="text-sm text-gray-700 flex-1">
                    Người giao hàng (bưu tá) không phải là nhân viên của chúng tôi, vui lòng liên hệ theo số hotline trên bì hàng để được hỗ trợ
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <p className="text-sm text-gray-700 flex-1">
                    Sản phẩm đúng với hình ảnh và mô tả nhưng nếu không ưng ý hoặc vì lý do nào khác khiến bạn từ chối nhận hàng, 
                    vui lòng hỗ trợ 30.000đ cước phí vận chuyển chiều về qua nhân viên phát hàng
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 italic">
                  Rất mong nhận được sự thông cảm và hợp tác từ quý khách hàng! 🙏
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;