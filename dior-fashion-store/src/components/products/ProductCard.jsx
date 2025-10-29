import React, { useState, useEffect } from "react";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const ProductCard = ({ product, onAddToCart, onQuickView }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // State để quản lý ảnh đang hiển thị
  const [currentImage, setCurrentImage] = useState(product.imagePrimary);

  // Cập nhật lại state ảnh nếu sản phẩm thay đổi
  useEffect(() => {
    setCurrentImage(product.imagePrimary);
  }, [product.imagePrimary]);

  // Xử lý sự kiện di chuột để đổi ảnh và hiện actions
  const handleMouseEnter = () => {
    setShowActions(true);
    // Nếu có ảnh thứ 2, đổi sang ảnh đó
    if (
      product.imageSecondary &&
      product.imageSecondary !== product.imagePrimary
    ) {
      setCurrentImage(product.imageSecondary);
    }
  };

  const handleMouseLeave = () => {
    setShowActions(false);
    // Khi chuột rời đi, quay lại ảnh chính
    setCurrentImage(product.imagePrimary);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wishlist = JSON.parse(localStorage.getItem("bewo_wishlist") || "[]");
    const exists = wishlist.find((item) => item.id === product.id);
    // Logic thêm/xóa wishlist có thể được thêm vào đây
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const isSale = product.originalPrice && product.originalPrice > product.price;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="bg-white overflow-hidden">
        {/* Image Container */}
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          <img
            src={currentImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-700 ${
              imageLoaded ? "opacity-100 group-hover:scale-110" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />

          {/* Sale Badge */}
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

          {/* Quick Actions - Desktop */}
          <div
            className={`hidden md:flex absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4 transition-all duration-300 ${
              showActions
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-white text-black py-2.5 px-3 rounded-lg text-sm font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2 shadow-md"
              >
                <ShoppingCart size={16} />
                <span>Thêm vào giỏ</span>
              </button>
              {onQuickView && (
                <button
                  onClick={handleQuickView}
                  className="p-2.5 bg-white/90 text-gray-700 rounded-lg hover:bg-white transition shadow-md"
                  title="Xem nhanh"
                >
                  <Eye size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions - Mobile (FIXED) */}
          <div className="md:hidden absolute inset-x-3 bottom-3 flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-white text-black py-2 px-3 rounded-lg text-xs font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <ShoppingCart size={14} />
              <span className="whitespace-nowrap">Thêm vào giỏ</span>
            </button>
            {onQuickView && (
              <button
                onClick={handleQuickView}
                className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition shadow-md"
                title="Xem nhanh"
              >
                <Eye size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-black transition min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-black">
              {formatPrice(product.price)}
            </span>
            {isSale && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                  const avgRating =
                    product.reviews.reduce((sum, r) => sum + r.rating, 0) /
                    product.reviews.length;
                  return (
                    <span
                      key={i}
                      className={`text-xs ${
                        i < Math.round(avgRating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  );
                })}
              </div>
              <span className="text-xs text-gray-500">
                ({product.reviews.length})
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
