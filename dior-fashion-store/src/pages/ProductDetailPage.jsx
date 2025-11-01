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
  const [activeTab, setActiveTab] = useState("reviews");
  const [selectedImage, setSelectedImage] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShippingPolicy, setShowShippingPolicy] = useState(false);

  // NEW: States cho lightbox
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
  // DERIVED STATE (TRẠNG THÁI SUY RA) - Phải khai báo trước useEffect
  // =============================================
  // Logic lấy danh sách ảnh an toàn
  const productImages =
    product?.images && product.images.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : [];

  // Lấy danh sách sizes
  const sizes = product?.sizes
    ? product.sizes.map((s) => (typeof s === "object" ? s.size : s))
    : [];

  // Tính toán rating trung bình
  const averageRating =
    product?.reviews && product.reviews.length > 0
      ? (
          product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length
        ).toFixed(1)
      : "5.0";

  // Kiểm tra xem có giảm giá không (giống ProductCard)
  const isSale =
    product?.originalPrice && product.originalPrice > product.price;

  // =============================================
  // EFFECTS
  // =============================================
  // **Đã loại bỏ useEffect có console.log**

  // Kiểm tra trạng thái yêu thích
  useEffect(() => {
    if (product) {
      setIsWishlisted(wishlist.some((item) => item.id === product.id));
    }
  }, [product, wishlist]);

  // NEW: Auto-slide cho gallery chính (mỗi 3 giây)
  useEffect(() => {
    if (productImages.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % productImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [productImages.length]);

  // NEW: Auto-slide cho lightbox (mỗi 3 giây)
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
    localStorage.setItem("dior_wishlist", JSON.stringify(newWishlist));
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
      // **Đã loại bỏ console.log**
    }
  };

  // NEW: Handlers cho lightbox
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h2>
          <Link to="/" className="text-blue-600 hover:underline">
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
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="text-xs md:text-sm mb-4 md:mb-6 flex items-center flex-wrap">
        <Link to="/" className="text-gray-500 hover:text-gray-700">
          Trang chủ
        </Link>
        <span className="mx-2 text-gray-400">›</span>
        <Link to="/products" className="text-gray-500 hover:text-gray-700">
          Sản phẩm
        </Link>
        <span className="mx-2 text-gray-400">›</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
        {/* ENHANCED: Image Gallery với Auto-slide & Lightbox */}
        <div className="space-y-3 md:space-y-4">
          {/* Main Image với click để mở lightbox */}
          <div
            className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
            onClick={handleImageClick}
          >
            <img
              src={productImages[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Sale Badge - giống ProductCard */}
            {isSale && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md z-10">
                -
                {Math.round(
                  ((product.originalPrice - product.price) /
                    product.originalPrice) *
                    100
                )}
                %
              </div>
            )}

            {/* Navigation Arrows - hiện khi hover */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {productImages.length > 1 && (
              <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs md:text-sm">
                {selectedImage + 1} / {productImages.length}
              </div>
            )}

            {/* Click để zoom hint */}
            <div className="absolute top-3 md:top-4 right-3 md:right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              Click để phóng to
            </div>
          </div>

          {/* Thumbnail Grid */}
          {productImages.length > 1 && (
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? "border-black scale-95"
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

          {/* Progress Indicators */}
          {productImages.length > 1 && (
            <div className="flex justify-center gap-2">
              {productImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`h-1.5 md:h-2 rounded-full transition-all ${
                    selectedImage === idx
                      ? "w-8 md:w-10 bg-black"
                      : "w-1.5 md:w-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4 md:space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={`${
                          i < Math.floor(averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs md:text-sm text-gray-600">
                    {averageRating} ({product.reviews?.length || 0} đánh giá)
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleToggleWishlist}
                  className={`p-2 md:p-3 rounded-full border transition-colors ${
                    isWishlisted
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  <Heart
                    size={20}
                    className={isWishlisted ? "fill-current" : ""}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 md:p-3 rounded-full border border-gray-200 hover:bg-gray-50"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* IMPROVED: Price Display - GIỐNG ProductCard */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 md:gap-4 flex-wrap">
              {/* Giá hiện tại - Luôn hiển thị */}
              <span className="text-3xl md:text-4xl font-bold text-red-600">
                {formatPrice(product.price)}
              </span>

              {/* Giá gốc và % giảm - Chỉ hiển thị khi có sale */}
              {isSale && (
                <>
                  <span className="text-lg md:text-xl text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
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

            {/* Tiết kiệm được - Chỉ hiển thị khi có sale */}
            {isSale && (
              <p className="text-sm text-green-600 font-medium">
                🎉 Bạn tiết kiệm được{" "}
                {formatPrice(product.originalPrice - product.price)}
              </p>
            )}
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 py-4 md:py-6 border-y">
            <div className="flex items-center gap-2 md:gap-3">
              <Package className="text-gray-400" size={20} />
              <div>
                <div className="text-xs text-gray-500">Miễn phí vận chuyển</div>
                <div className="text-xs md:text-sm font-medium">
                  Từ 2 sản phẩm
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Check className="text-gray-400" size={20} />
              <div>
                <div className="text-xs text-gray-500">Đổi trả dễ dàng</div>
                <div className="text-xs md:text-sm font-medium">Trong 7 ngày</div>
              </div>
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <label className="text-sm md:text-base font-medium">
                Chọn size:
              </label>
              <button
                onClick={() => setShowSizeGuide(true)}
                className="text-xs md:text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Ruler size={14} />
                Hướng dẫn chọn size
              </button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2 md:py-3 px-3 md:px-4 border rounded-lg text-sm md:text-base font-medium transition-all ${
                    selectedSize === size
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
          <div>
            <label className="block text-sm md:text-base font-medium mb-3 md:mb-4">
              Số lượng:
            </label>
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 md:w-12 md:h-12 border rounded-lg hover:bg-gray-50 flex items-center justify-center text-lg md:text-xl font-medium"
              >
                -
              </button>
              <span className="w-12 md:w-16 text-center text-base md:text-lg font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 md:w-12 md:h-12 border rounded-lg hover:bg-gray-50 flex items-center justify-center text-lg md:text-xl font-medium"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 pt-4 md:pt-6">
            <button
              onClick={handleAddToCart}
              className="py-3 md:py-4 px-4 md:px-6 border-2 border-black rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm md:text-base flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} />
              Thêm vào giỏ
            </button>
            <button
              onClick={handleBuyNow}
              className="py-3 md:py-4 px-4 md:px-6 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm md:text-base"
            >
              Mua ngay
            </button>
          </div>

          {/* Additional Info */}
          <div className="space-y-2 pt-4 md:pt-6 border-t">
            <button
              onClick={() => setShowShippingPolicy(true)}
              className="w-full text-left py-3 md:py-4 px-4 md:px-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base font-medium">
                  📦 Chính sách vận chuyển & đổi trả
                </span>
                <ChevronRight size={20} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-12 md:mt-16 border-t pt-8 md:pt-12">
        <div className="flex gap-6 md:gap-8 mb-6 md:mb-8 border-b overflow-x-auto">
          {["reviews", "description", "details"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 md:pb-4 px-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${
                activeTab === tab
                  ? "border-black font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "reviews" && "Đánh giá"}
              {tab === "description" && "Mô tả"}
              {tab === "details" && "Chi tiết"}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "reviews" && (
            <div className="space-y-6 md:space-y-8">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="border-b pb-6 md:pb-8 last:border-0"
                  >
                    <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 flex items-center justify-center font-medium text-sm md:text-base">
                        {review.userName?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                          <span className="font-medium text-sm md:text-base">
                            {review.userName}
                          </span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={`${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                          {review.date}
                        </p>
                        <p className="text-sm md:text-base text-gray-700">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8 text-sm md:text-base">
                  Chưa có đánh giá nào cho sản phẩm này
                </p>
              )}
            </div>
          )}
          {/* Description Tab */}
          {activeTab === "description" && (
            <div>
              <div>
                <SEOContentRenderer
                  contentBlocks={product.attributes?.content_blocks}
                  fallbackDescription={product.description}
                />
              </div>
            </div>
          )}
          {activeTab === "details" && (
            <div className="max-w-3xl">
              <div className="space-y-2 md:space-y-3">
                {[
                  { label: "Chất liệu", value: "Cotton cao cấp, pha spandex" },
                  { label: "Xuất xứ", value: "Việt Nam" },
                  { label: "Màu sắc", value: product.category || "Đa dạng" },
                  { label: "Size", value: sizes.join(", ") },
                  {
                    label: "Hướng dẫn giặt",
                    value:
                      "Giặt tay hoặc máy giặt ở chế độ nhẹ, không dùng nước nóng",
                  },
                  {
                    label: "Hướng dẫn bảo quản",
                    value: "Phơi ở nơi thoáng mát, tránh ánh nắng trực tiếp",
                  },
                  { label: "Thương hiệu", value: brand?.name || "DIOR STORE" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex py-2 md:py-3 border-b last:border-0 text-xs md:text-sm"
                  >
                    <span className="w-28 md:w-40 text-gray-600 font-medium">
                      {item.label}:
                    </span>
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

      {/* NEW: Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Previous Button */}
            {productImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLightboxPrev();
                }}
                className="absolute left-4 bg-white/10 hover:bg-white/20 p-4 rounded-full transition-colors z-10"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
            )}

            {/* Image */}
            <div className="max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <img
                src={productImages[lightboxImage]}
                alt={`${product.name} - ${lightboxImage + 1}`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Next Button */}
            {productImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLightboxNext();
                }}
                className="absolute right-4 bg-white/10 hover:bg-white/20 p-4 rounded-full transition-colors z-10"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            )}

            {/* Image Counter */}
            {productImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-6 py-3 rounded-full backdrop-blur-sm">
                {lightboxImage + 1} / {productImages.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {productImages.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 max-w-xl overflow-x-auto px-4">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImage(idx);
                    }}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      lightboxImage === idx
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
            )}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Hướng dẫn chọn size</h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <img
                src={sizeGuideImage}
                alt="Size Guide"
                className="w-full rounded-lg mb-4"
              />
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Để chọn size phù hợp, hãy đo vòng eo và chiều cao của bạn, sau
                  đó so sánh với bảng size trên.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">
                    Lưu ý quan trọng:
                  </h4>
                  <ul className="text-xs space-y-1 text-yellow-800">
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
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowShippingPolicy(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                Chính sách vận chuyển & đổi trả
              </h3>
              <button
                onClick={() => setShowShippingPolicy(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
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