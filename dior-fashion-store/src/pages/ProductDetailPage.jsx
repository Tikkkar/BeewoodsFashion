import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart,
  Heart,
  Share2,
  ChevronLeft,
  Star,
  Check,
  ChevronRight,
  Ruler,
  X,
  Package,
  Loader2,
} from "lucide-react";
import ProductCard from "../components/products/ProductCard";
import { useProductDetail, useProducts } from "../hooks/useProducts";
import sizeGuideImage from "../assets/size.jpg";
import SEOContentRenderer from "../components/products/SEOContentRenderer";

const ProductDetailPage = ({ onAddToCart, brand }) => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // =============================================
  // DATA FETCHING
  // =============================================
  const { product: rawProduct, loading, error } = useProductDetail(slug);

  // Map original_price (snake_case từ DB) sang originalPrice (camelCase)
  const product = rawProduct
    ? {
      ...rawProduct,
      originalPrice: rawProduct.original_price || rawProduct.originalPrice,
    }
    : null;

  const { products: allProducts } = useProducts({
    category: product?.categorySlug,
  });

  // Lấy sản phẩm liên quan (cùng danh mục, trừ sản phẩm hiện tại)
  const relatedProducts =
    product && allProducts
      ? allProducts.filter((p) => p.id !== product.id).slice(0, 4)
      : [];

  // =============================================
  // LOCAL STATES
  // =============================================
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShippingPolicy, setShowShippingPolicy] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // States cho lightbox
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(0);

  // State quản lý danh sách yêu thích
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("bewo_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isWishlisted, setIsWishlisted] = useState(false);

  // =============================================
  // DERIVED STATE
  // =============================================
  const productImages =
    product?.images && product.images.length > 0
      ? product.images
      : product?.image
        ? [product.image]
        : [];

  const sizes = product?.sizes
    ? product.sizes
      .map((s) => {
        if (typeof s === "object") return s.size || s.name || s.label;
        return s;
      })
      .filter(Boolean)
    : [];

  console.log("Product Data:", product);
  console.log("Sizes:", sizes);

  const averageRating =
    product?.reviews && product.reviews.length > 0
      ? (
        product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      ).toFixed(1)
      : "5.0";

  const isSale =
    product?.originalPrice && product.originalPrice > product.price;

  // =============================================
  // EFFECTS
  // =============================================
  useEffect(() => {
    if (product) {
      setIsWishlisted(wishlist.some((item) => item.id === product.id));
    }
  }, [product, wishlist]);

  useEffect(() => {
    if (productImages.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % productImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [productImages.length]);

  useEffect(() => {
    if (!showLightbox || productImages.length <= 1) return;

    const interval = setInterval(() => {
      setLightboxImage((prev) => (prev + 1) % productImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [showLightbox, productImages.length]);

  // =============================================
  // HANDLERS
  // =============================================
  const handleToggleWishlist = () => {
    let newWishlist;
    if (isWishlisted) {
      newWishlist = wishlist.filter((item) => item.id !== product.id);
    } else {
      newWishlist = [...wishlist, product];
    }
    setWishlist(newWishlist);
    setIsWishlisted(!isWishlisted);
    localStorage.setItem("bewo_wishlist", JSON.stringify(newWishlist));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("⚠️ Vui lòng chọn size!");
      return;
    }

    const productWithImage = {
      ...product,
      imagePrimary: product.imagePrimary || product.image || productImages[0],
      image: product.image || productImages[0],
    };

    for (let i = 0; i < quantity; i++) {
      onAddToCart(productWithImage, selectedSize);
    }
    alert("✅ Đã thêm sản phẩm vào giỏ hàng!");
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      alert("⚠️ Vui lòng chọn size!");
      return;
    }

    const productWithImage = {
      ...product,
      imagePrimary: product.imagePrimary || product.image || productImages[0],
      image: product.image || productImages[0],
    };

    for (let i = 0; i < quantity; i++) {
      onAddToCart(productWithImage, selectedSize);
    }

    navigate("/checkout");
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Xem sản phẩm ${product.name}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("📋 Đã copy link sản phẩm!");
      }
    } catch (err) {
      // Silent error
    }
  };

  const handleImageClick = () => {
    setLightboxImage(selectedImage);
    setShowLightbox(true);
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev + 1) % productImages.length);
  };

  const handlePrevImage = () => {
    setSelectedImage(
      (prev) => (prev - 1 + productImages.length) % productImages.length
    );
  };

  const handleLightboxNext = () => {
    setLightboxImage((prev) => (prev + 1) % productImages.length);
  };

  const handleLightboxPrev = () => {
    setLightboxImage(
      (prev) => (prev - 1 + productImages.length) % productImages.length
    );
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h2>
          <Link to="/" className="text-blue-600 hover:underline text-sm md:text-base">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // =============================================
  // RENDER
  // =============================================
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
      {/* Breadcrumb - Responsive */}
      <nav className="text-xs mb-3 md:mb-6 flex items-center flex-wrap gap-1">
        <Link to="/" className="text-gray-500 hover:text-gray-700">
          Trang chủ
        </Link>
        <span className="text-gray-400">›</span>
        <Link to="/products" className="text-gray-500 hover:text-gray-700">
          Sản phẩm
        </Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 truncate max-w-[150px] sm:max-w-none">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-4 md:gap-8 lg:gap-12">
        {/* ===== IMAGE GALLERY ===== */}
        <div className="flex gap-2 md:gap-4">
          {/* Thumbnail List - Hidden on mobile, show on md+ */}
          {productImages.length > 1 && (
            <div className="hidden md:flex flex-col gap-2 md:gap-3 w-20 md:w-24 flex-shrink-0">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                    ? "border-black"
                    : "border-transparent hover:border-gray-300"
                    }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} - ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="flex-1">
            <div
              className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
              onClick={handleImageClick}
            >
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Sale Badge */}
              {isSale && (
                <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full shadow-md z-10">
                  -
                  {Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                    100
                  )}
                  %
                </div>
              )}

              {/* Navigation Arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-1.5 md:p-3 rounded-full shadow-lg transition-all z-10"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-1.5 md:p-3 rounded-full shadow-lg transition-all z-10"
                  >
                    <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {productImages.length > 1 && (
                <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 bg-black/70 text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-sm">
                  {selectedImage + 1} / {productImages.length}
                </div>
              )}

              {/* Zoom hint - Only show on desktop */}
              <div className="hidden md:block absolute top-3 md:top-4 right-3 md:right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Click để phóng to
              </div>
            </div>

            {/* Progress Indicators */}
            {productImages.length > 1 && (
              <div className="flex justify-center gap-1.5 md:gap-2 mt-2 md:mt-4">
                {productImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-1 md:h-2 rounded-full transition-all ${selectedImage === idx
                      ? "w-6 md:w-10 bg-black"
                      : "w-1 md:w-2 bg-gray-300 hover:bg-gray-400"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== PRODUCT INFO ===== */}
        <div className="space-y-3 md:space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-bold mb-1.5 md:mb-2 leading-tight">
                  {product.name}
                </h1>
                <p className="text-[10px] md:text-xs text-gray-600 mb-1.5 md:mb-2">
                  Mã: {product.id?.slice(0, 8).toUpperCase() || 'N/A'}
                </p>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={`${i < Math.floor(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] md:text-xs text-gray-600">
                    {averageRating} ({product.reviews?.length || 0})
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                <button
                  onClick={handleToggleWishlist}
                  className={`p-1.5 md:p-2 rounded-full border transition-colors ${isWishlisted
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "hover:bg-gray-50 border-gray-200"
                    }`}
                >
                  <Heart
                    size={16}
                    className={`md:w-[18px] md:h-[18px] ${isWishlisted ? "fill-current" : ""}`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 md:p-2 rounded-full border border-gray-200 hover:bg-gray-50"
                >
                  <Share2 size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Price Display */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl md:text-3xl font-bold text-red-600">
                {formatPrice(product.price)}
              </span>

              {isSale && (
                <>
                  <span className="text-sm md:text-base text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="bg-red-100 text-red-600 px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold">
                    -
                    {Math.round(
                      ((product.originalPrice - product.price) /
                        product.originalPrice) *
                      100
                    )}
                    %
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs md:text-sm font-medium">
                Size <span className="font-normal text-gray-600">{selectedSize || sizes[0] || "S"}</span>
              </label>
              <button
                onClick={() => setShowSizeGuide(true)}
                className="text-[10px] md:text-xs text-black underline hover:no-underline italic"
              >
                Bảng size
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 md:gap-2">
              {sizes.map((size, index) => (
                <button
                  key={`${size}-${index}`}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2 md:py-2.5 px-2 md:px-3 border rounded-lg text-xs md:text-sm font-medium transition-all ${selectedSize === size
                    ? "border-black bg-black text-white"
                    : "border-gray-300 hover:border-gray-400"
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs md:text-sm font-medium text-gray-700">Số lượng:</span>
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 md:w-10 md:h-10 border rounded-lg hover:bg-gray-50 flex items-center justify-center text-base md:text-lg font-medium"
              >
                -
              </button>
              <span className="w-8 md:w-12 text-center text-sm md:text-base font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 md:w-10 md:h-10 border rounded-lg hover:bg-gray-50 flex items-center justify-center text-base md:text-lg font-medium"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 md:gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              className="py-2.5 md:py-3 px-3 md:px-4 border-2 border-black rounded-lg font-semibold hover:bg-gray-50 transition-colors text-xs md:text-sm flex items-center justify-center gap-1.5 md:gap-2 uppercase"
            >
              <ShoppingCart className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">THÊM VÀO GIỎ</span>
              <span className="md:hidden">THÊM</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="py-2.5 md:py-3 px-3 md:px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors text-xs md:text-sm uppercase"
            >
              MUA NGAY
            </button>
          </div>

          {/* Quick Info */}
          <div className="space-y-2 md:space-y-2.5 py-3 md:py-4 border-t">
            <div className="flex items-center gap-2 md:gap-3">
              <Package className="text-gray-700 flex-shrink-0 w-4 h-4 md:w-5 md:h-5" />
              <div>
                <div className="text-xs md:text-sm font-semibold">
                  Thanh toán khi nhận hàng
                </div>
                <div className="text-[10px] md:text-xs text-gray-600">
                  Được kiểm tra hàng trước
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <svg
                className="text-gray-700 flex-shrink-0 w-4 h-4 md:w-5 md:h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <div>
                <div className="text-xs md:text-sm font-semibold">
                  Đổi hàng 15 ngày
                </div>
                <div className="text-[10px] md:text-xs text-gray-600">
                  Nhập để xem chính sách
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <svg
                className="text-gray-700 flex-shrink-0 w-4 h-4 md:w-5 md:h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <div>
                <div className="text-xs md:text-sm font-semibold">
                  Miễn phí vận chuyển
                </div>
                <div className="text-[10px] md:text-xs text-gray-600">
                  Mua 2 sản phẩm được freeship
                </div>
              </div>
            </div>
          </div>

          {/* Đặc điểm sản phẩm */}
          <div className="py-3 md:py-4 border-t">
            <h3 className="text-sm md:text-lg font-bold mb-2">
              Đặc điểm sản phẩm
            </h3>

            <div className="mb-2 md:mb-3">
              <p className="text-xs md:text-sm leading-relaxed text-gray-700">
                {product.description}
              </p>
            </div>

            {product.attributes?.features && product.attributes.features.length > 0 && (
              <div>
                <ul className="space-y-1 md:space-y-1.5">
                  {product.attributes.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 md:gap-2 text-xs md:text-sm">
                      <span className="text-gray-700 mt-0.5">•</span>
                      <a
                        href="#chi-tiet-san-pham"
                        className="text-gray-700 underline hover:text-black transition-colors flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById('chi-tiet-san-pham');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                            if (!showFullDetails) {
                              setShowFullDetails(true);
                            }
                          }
                        }}
                      >
                        {feature}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chi tiết sản phẩm Section */}
      {product.attributes?.content_blocks && product.attributes.content_blocks.length > 0 && (
        <div id="chi-tiet-san-pham" className="mt-6 md:mt-8 border-t pt-6 md:pt-8">
          <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">
            CHI TIẾT SẢN PHẨM
          </h2>

          <div className="mb-3 md:mb-4">
            <h3 className="text-sm md:text-base font-semibold mb-2">
              {product.name} - Thanh lịch và hiện đại
            </h3>

            <div className="text-xs md:text-sm text-gray-700 leading-relaxed">
              <p className="font-semibold mb-2">1. Giới thiệu sản phẩm</p>

              {!showFullDetails ? (
                <div className="relative">
                  <div className="line-clamp-3">
                    <SEOContentRenderer
                      contentBlocks={product.attributes.content_blocks}
                      fallbackDescription={product.description}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                </div>
              ) : (
                <div>
                  <SEOContentRenderer
                    contentBlocks={product.attributes.content_blocks}
                    fallbackDescription={product.description}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center mt-3 md:mt-4">
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="px-4 md:px-6 py-2 border-2 border-black rounded-lg font-medium hover:bg-gray-50 transition-colors text-xs md:text-sm"
            >
              {showFullDetails ? "Thu gọn" : "Xem thêm"}
            </button>
          </div>
        </div>
      )}

      {/* Đánh giá Section */}
      <div className="mt-6 md:mt-8 border-t pt-6 md:pt-8">
        <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">Đánh giá</h2>

        <div className="text-center mb-3 md:mb-4 text-xs md:text-sm text-gray-600">
          Hãy chia sẻ suy nghĩ của bạn. Hãy là người đầu tiên để lại bài đánh giá.
        </div>

        <div className="flex justify-center mb-4 md:mb-6">
          <button className="px-4 md:px-6 py-2 border-2 border-black rounded-lg font-medium hover:bg-gray-50 transition-colors text-xs md:text-sm">
            Để lại đánh giá
          </button>
        </div>

        {product.reviews && product.reviews.length > 0 && (
          <div className="space-y-3 md:space-y-6 mt-4 md:mt-6">
            {product.reviews.map((review, idx) => (
              <div key={idx} className="border-b pb-3 md:pb-6 last:border-0">
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 flex items-center justify-center font-medium text-xs md:text-sm flex-shrink-0">
                    {review.userName?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                      <span className="font-medium text-xs md:text-sm truncate">
                        {review.userName}
                      </span>
                      <div className="flex items-center flex-shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            className={`md:w-3 md:h-3 ${i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-600 mb-1">
                      {review.date}
                    </p>
                    <p className="text-xs md:text-sm text-gray-700">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-8 md:mt-16 border-t pt-6 md:pt-12">
          <h2 className="text-lg md:text-3xl font-bold mb-4 md:mb-8 text-center">
            CÓ THỂ BẠN QUAN TÂM
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
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

      {/* Modal chi tiết đầy đủ */}
      {activeTab === "details" && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-4"
          onClick={() => setActiveTab("")}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-3 md:p-4 flex items-center justify-between z-10">
              <h3 className="text-sm md:text-lg font-bold truncate pr-2">Chi tiết - {product.name}</h3>
              <button
                onClick={() => setActiveTab("")}
                className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
              >
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6">
              {product.attributes?.content_blocks && product.attributes.content_blocks.length > 0 ? (
                <div className="prose max-w-none text-xs md:text-sm">
                  <SEOContentRenderer
                    contentBlocks={product.attributes.content_blocks}
                    fallbackDescription=""
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-xs md:text-sm">Chưa có nội dung chi tiết cho sản phẩm này.</p>
                </div>
              )}

              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t">
                <h4 className="text-sm md:text-lg font-bold mb-3 md:mb-4">Thông tin sản phẩm</h4>
                <div className="space-y-2 md:space-y-3">
                  {[
                    { label: "Xuất xứ", value: "Việt Nam" },
                    { label: "Size có sẵn", value: sizes.join(", ") },
                    {
                      label: "Hướng dẫn giặt",
                      value: "Giặt tay hoặc máy giặt ở chế độ nhẹ, không dùng nước nóng",
                    },
                    {
                      label: "Hướng dẫn bảo quản",
                      value: "Phơi ở nơi thoáng mát, tránh ánh nắng trực tiếp",
                    },
                    { label: "Thương hiệu", value: brand?.name || "BEWO" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex py-2 md:py-3 border-b last:border-0 text-xs md:text-sm gap-2"
                    >
                      <span className="w-28 md:w-48 text-gray-600 font-medium flex-shrink-0">
                        {item.label}:
                      </span>
                      <span className="flex-1 text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 md:p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-2 md:top-4 right-2 md:right-4 bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>

            {productImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLightboxPrev();
                  }}
                  className="absolute left-2 md:left-4 bg-white/10 hover:bg-white/20 p-2 md:p-4 rounded-full transition-colors z-10"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLightboxNext();
                  }}
                  className="absolute right-2 md:right-4 bg-white/10 hover:bg-white/20 p-2 md:p-4 rounded-full transition-colors z-10"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </button>
              </>
            )}

            <div className="max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <img
                src={productImages[lightboxImage]}
                alt={`${product.name} - ${lightboxImage + 1}`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {productImages.length > 1 && (
              <>
                <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-3 md:px-6 py-1.5 md:py-3 rounded-full backdrop-blur-sm text-xs md:text-sm">
                  {lightboxImage + 1} / {productImages.length}
                </div>

                <div className="absolute bottom-12 md:bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 max-w-xl overflow-x-auto px-2 md:px-4">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImage(idx);
                      }}
                      className={`flex-shrink-0 w-12 h-12 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${lightboxImage === idx
                        ? "border-white scale-110"
                        : "border-white/30 hover:border-white/60"
                        }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-3 md:p-4 flex items-center justify-between">
              <h3 className="text-sm md:text-lg font-bold">Hướng dẫn chọn size</h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
            <div className="p-4 md:p-6">
              <img
                src={sizeGuideImage}
                alt="Size Guide"
                className="w-full rounded-lg mb-3 md:mb-4"
              />
              <div className="space-y-2 md:space-y-3">
                <p className="text-xs md:text-sm text-gray-700">
                  Để chọn size phù hợp, hãy đo vòng eo và chiều cao của bạn, sau
                  đó so sánh với bảng size trên.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
                  <h4 className="font-semibold text-xs md:text-sm mb-2">
                    Lưu ý quan trọng:
                  </h4>
                  <ul className="text-[10px] md:text-xs space-y-1 text-yellow-800">
                    <li>• Nếu bạn ở giữa hai size, hãy chọn size lớn hơn</li>
                    <li>• Sản phẩm có thể giãn nhẹ sau vài lần mặc đầu tiên</li>
                    <li>
                      • Để được tư vấn size chính xác, hãy liên hệ với chúng tôi
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Policy Modal */}
      {showShippingPolicy && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-4"
          onClick={() => setShowShippingPolicy(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-3 md:p-4 flex items-center justify-between">
              <h3 className="text-sm md:text-lg font-bold">
                Chính sách vận chuyển & đổi trả
              </h3>
              <button
                onClick={() => setShowShippingPolicy(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div>
                <h4 className="font-semibold mb-1.5 md:mb-2 text-xs md:text-sm">🚚 Vận chuyển</h4>
                <ul className="text-xs md:text-sm text-gray-700 space-y-1">
                  <li>• Miễn phí vận chuyển cho đơn hàng từ 2 sản phẩm</li>
                  <li>• Giao hàng toàn quốc trong 2-5 ngày làm việc</li>
                  <li>• Được kiểm tra hàng trước khi thanh toán</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1.5 md:mb-2 text-xs md:text-sm">🔄 Đổi trả</h4>
                <ul className="text-xs md:text-sm text-gray-700 space-y-1">
                  <li>• Đổi trả miễn phí trong 7 ngày nếu không vừa ý</li>
                  <li>• Sản phẩm phải còn nguyên tag, chưa qua sử dụng</li>
                  <li>• Hỗ trợ đổi size nếu còn hàng</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1.5 md:mb-2 text-xs md:text-sm">💳 Thanh toán</h4>
                <ul className="text-xs md:text-sm text-gray-700 space-y-1">
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