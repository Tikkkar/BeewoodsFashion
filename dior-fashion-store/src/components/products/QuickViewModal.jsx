import React, { useState, useEffect } from "react";
import {
  X,
  ShoppingCart,
  Heart,
  Star,
  ExternalLink,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { useProductById } from "../../hooks/useProducts";

const QuickViewModal = ({ product: initialProduct, isOpen, onClose, onAddToCart }) => {
  const navigate = useNavigate();
  const { error: showError, success: showSuccess } = useToast();
  
  // ✨ SỬA LỖI: Fetch dữ liệu đầy đủ từ database khi mở modal
  const { product: detailedProduct, loading: productLoading } = useProductById(
    isOpen && initialProduct ? initialProduct.id : null
  );
  
  // Sử dụng detailedProduct nếu có, fallback về initialProduct
  const product = detailedProduct || initialProduct;
  
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setImageLoaded(false);
      setShowFullDescription(false); // Reset khi mở modal mới

      // ✨ CẢI TIẾN: Xử lý sizes từ database (array of strings hoặc array of objects)
      if (product.sizes && product.sizes.length > 0) {
        const firstSize =
          typeof product.sizes[0] === "object"
            ? product.sizes[0].size
            : product.sizes[0];
        setSelectedSize(firstSize);
      } else {
        setSelectedSize("");
      }

      const wishlist = JSON.parse(
        localStorage.getItem("bewo_wishlist") || "[]"
      );
      setIsWishlisted(wishlist.some((item) => item.id === product.id));

      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, product]);

  if (!isOpen || !initialProduct) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (!selectedSize && sizes.length > 0) {
      showError("Vui lòng chọn size!");
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
    if (!product) return;
    
    const wishlist = JSON.parse(localStorage.getItem("bewo_wishlist") || "[]");
    const exists = wishlist.find((item) => item.id === product.id);

    if (exists) {
      const newWishlist = wishlist.filter((item) => item.id !== product.id);
      localStorage.setItem("bewo_wishlist", JSON.stringify(newWishlist));
      setIsWishlisted(false);
      showSuccess("Đã xóa khỏi danh sách yêu thích");
    } else {
      wishlist.push(product);
      localStorage.setItem("bewo_wishlist", JSON.stringify(wishlist));
      setIsWishlisted(true);
      showSuccess("Đã thêm vào danh sách yêu thích");
    }

    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  // ✨ CẢI TIẾN: Xử lý sizes từ database
  const sizes = product?.sizes
    ? product.sizes.map((s) => (typeof s === "object" ? s.size : s))
    : [];

  const discount =
    product?.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : null;

  // ✨ CẢI TIẾN: Tính rating từ reviews trong database
  const avgRating =
    product?.reviews && product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
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

          {/* ✨ LOADING STATE khi fetch data */}
          {productLoading ? (
            <div className="flex items-center justify-center min-h-[500px]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-black mx-auto mb-4" />
                <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
              </div>
            </div>
          ) : !product ? (
            <div className="flex items-center justify-center min-h-[500px]">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Không thể tải sản phẩm</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:grid md:grid-cols-2 flex-1 overflow-hidden">
              {/* Left: Product Image */}
              <div className="relative bg-gray-100 flex items-center justify-center h-[45vh] md:h-full flex-shrink-0">
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
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
                        className={
                          i < Math.round(avgRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-300 text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({product.reviews?.length || 0} đánh giá)
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      product.stock > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    • {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-4 pb-4 border-b">
                  <span className="text-3xl font-bold text-black">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice &&
                    product.originalPrice > product.price && (
                      <span className="text-lg text-gray-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                </div>

                {/* ✨ MÔ TẢ SẢN PHẨM TỪ DATABASE với Xem thêm/Thu gọn */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-2">
                    Mô tả sản phẩm
                  </h3>
                  {(() => {
                    const description = product.description || 
                      "Thông tin chi tiết về sản phẩm đang được cập nhật. Vui lòng xem thêm chi tiết hoặc liên hệ với chúng tôi để biết thêm thông tin.";
                    const maxLength = 200;
                    const isLongDescription = description.length > maxLength;
                    
                    return (
                      <div>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {showFullDescription || !isLongDescription
                            ? description
                            : `${description.substring(0, maxLength)}...`}
                        </p>
                        {isLongDescription && (
                          <button
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="text-black text-sm font-medium mt-2 hover:underline flex items-center gap-1"
                          >
                            {showFullDescription ? "Thu gọn" : "Xem thêm"}
                            <span className="text-xs">{showFullDescription ? "▲" : "▼"}</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-auto space-y-6">
                  {sizes.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold uppercase tracking-wide flex items-center justify-between">
                        <span>Chọn Size</span>
                        {selectedSize && (
                          <span className="text-xs font-normal text-gray-600 normal-case">
                            Đã chọn:{" "}
                            <span className="font-semibold text-black">
                              {selectedSize}
                            </span>
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
                                ? "border-black bg-black text-white scale-105 shadow-md"
                                : "border-gray-300 hover:border-black hover:scale-105"
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
                        onChange={(e) =>
                          setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                        }
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
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-black text-white hover:bg-gray-800"
                      }`}
                    >
                      <ShoppingCart size={20} />
                      {product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
                    </button>

                    <button
                      onClick={handleToggleWishlist}
                      className={`w-full py-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                        isWishlisted
                          ? "border-red-500 text-red-500 bg-red-50 hover:bg-red-100"
                          : "border-gray-300 hover:border-black hover:bg-gray-50"
                      }`}
                    >
                      <Heart
                        size={18}
                        fill={isWishlisted ? "currentColor" : "none"}
                      />
                      <span className="text-sm">
                        {isWishlisted
                          ? "Đã thêm vào yêu thích"
                          : "Thêm vào yêu thích"}
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
          )}
        </div>
      </div>
    </>
  );
};

export default QuickViewModal;