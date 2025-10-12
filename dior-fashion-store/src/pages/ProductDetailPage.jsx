import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, ChevronLeft, Star, Truck, Shield, RefreshCw, Check, ChevronRight, Ruler, X } from 'lucide-react';
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
          
          {/* ========== START: MODIFIED IMAGE AREA ========== */}
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
                className={`w-full h-full object-cover transition-opacity duration-300 ${
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
          {/* ========== END: MODIFIED IMAGE AREA ========== */}


          {/* Right: Product Info */}
          <div className="space-y-6">
            
            {/* Category */}
            <div className="text-xs uppercase tracking-widest text-gray-500">
              {product.category}
            </div>

            {/* Product Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-gray-600">(248 đánh giá)</span>
              <span className="text-sm text-green-600 font-medium">• Còn hàng</span>
            </div>

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

            {/* Description */}
            <p className="text-gray-700 leading-relaxed text-sm">
              Sản phẩm cao cấp từ bộ sưu tập mới nhất. Thiết kế tinh tế, chất liệu cao cấp, 
              mang đến sự sang trọng và đẳng cấp cho người sử dụng. Phù hợp cho mọi dịp từ 
              công sở đến dự tiệc.
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
                  Thêm vào giỏ hàng
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

            {/* Features */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Truck size={20} className="text-gray-700" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Miễn phí vận chuyển</h3>
                  <p className="text-gray-600">Đơn hàng từ 2 sản phẩm - Giao toàn quốc</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-sm">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Shield size={20} className="text-gray-700" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Chính hãng 100%</h3>
                  <p className="text-gray-600">Cam kết sản phẩm chính hãng, chất lượng</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-sm">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <RefreshCw size={20} className="text-gray-700" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Đổi trả dễ dàng</h3>
                  <p className="text-gray-600">Đổi trả trong 30 ngày nếu không vừa ý</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
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
              <div className="max-w-3xl mx-auto prose prose-sm lg:prose-base text-gray-700 leading-relaxed">
                {/* 📝 Text 1 (Intro) */}
                <p className="text-lg text-center italic">
                  Chào mừng bạn đến với thế giới của sự thanh lịch và tinh tế. <strong>{product.name}</strong> không chỉ là một sản phẩm, mà là một tuyên ngôn về phong cách.
                </p>

                {/* 📷 Image 1 (Main lifestyle) */}
                <figure>
                  <img src={productImages[1]} alt={`Lifestyle image for ${product.name}`} className="rounded-lg shadow-md" />
                  <figcaption>Phong cách sống động cùng {product.name}</figcaption>
                </figure>

                {/* 📝 Text 2 (Feature 1) */}
                <h3>Chất liệu Vượt trội</h3>
                <p>
                  Chúng tôi tin rằng sự sang trọng đến từ những điều cơ bản nhất. Đó là lý do sản phẩm này được chế tác từ chất liệu Cotton cao cấp, pha thêm spandex để tạo nên sự co giãn và thoải mái tuyệt đối. Bề mặt vải mềm mại, thoáng khí, mang lại cảm giác dễ chịu suốt cả ngày.
                </p>

                {/* 📷 Image 2 (Detail close-up) */}
                <figure>
                  <img src={productImages[2]} alt={`Close-up detail of ${product.name}`} className="rounded-lg shadow-md" />
                  <figcaption>Từng đường kim mũi chỉ được chăm chút tỉ mỉ</figcaption>
                </figure>

                {/* 📝 Text 3 (Feature 2 + Bullet points) */}
                <h3>Thiết kế Tôn vinh Vóc dáng</h3>
                <p>
                  Mỗi đường cắt may trên <strong>{product.name}</strong> đều được tính toán kỹ lưỡng để tôn lên vóc dáng người mặc. Form dáng chuẩn, ôm vừa vặn nhưng không gây khó chịu, giúp bạn luôn tự tin và nổi bật.
                </p>
                <ul>
                    <li>Form dáng hiện đại, dễ dàng phối đồ.</li>
                    <li>Màu sắc bền đẹp, không phai sau nhiều lần giặt.</li>
                    <li>Phù hợp cho mọi hoạt động: đi làm, dạo phố, hay những buổi tiệc nhẹ.</li>
                </ul>
                
                {/* 📷 Image 3 (Styling inspiration) */}
                <figure>
                  <img src={productImages[3]} alt={`Styling inspiration for ${product.name}`} className="rounded-lg shadow-md" />
                  <figcaption>Dễ dàng tạo nên bộ trang phục hoàn hảo</figcaption>
                </figure>
                
                {/* 📝 Text 4 (Closing + Quote) */}
                <div className="text-center border-t border-b py-6 my-8 not-prose">
                  <p className="mb-4 text-gray-700">
                    Hãy để <strong>{product.name}</strong> trở thành người bạn đồng hành, giúp bạn kể nên câu chuyện phong cách của riêng mình.
                  </p>
                  <p className="font-semibold text-gray-900 text-base">
                    "Thời trang là cách bạn thể hiện mình mà không cần phải nói một lời."
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
    </div>
  );
};

export default ProductDetailPage;