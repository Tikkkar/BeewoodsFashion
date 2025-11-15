import React, { useState, useEffect, useMemo, useCallback } from "react";
import ImageOptimized from "../common/Imageoptimized";
import { ShoppingCart, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const ProductCard = ({ product, onAddToCart, onQuickView }) => {
  const [showActions, setShowActions] = useState(false);
  const [currentImage, setCurrentImage] = useState(product.imagePrimary);

  // Cập nhật lại state ảnh nếu sản phẩm thay đổi
  useEffect(() => {
    setCurrentImage(product.imagePrimary);
  }, [product.imagePrimary]);

  // Xử lý sự kiện di chuột để đổi ảnh và hiện actions
  const handleMouseEnter = useCallback(() => {
    setShowActions(true);
    // Nếu có ảnh thứ 2, đổi sang ảnh đó
    if (
      product.imageSecondary &&
      product.imageSecondary !== product.imagePrimary
    ) {
      setCurrentImage(product.imageSecondary);
    }
  }, [product.imageSecondary, product.imagePrimary]);

  const handleMouseLeave = useCallback(() => {
    setShowActions(false);
    // Khi chuột rời đi, quay lại ảnh chính
    setCurrentImage(product.imagePrimary);
  }, [product.imagePrimary]);

  // Memoize price formatter
  const formatPrice = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format,
    []
  );


  const handleAddToCart = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      onAddToCart(product);
    },
    [product, onAddToCart]
  );

  const handleQuickView = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      onQuickView?.(product);
    },
    [product, onQuickView]
  );

  // Memoize calculations
  const isSale = useMemo(
    () => product.originalPrice && product.originalPrice > product.price,
    [product.originalPrice, product.price]
  );

  const discount = useMemo(() => {
    if (!isSale) return 0;
    return Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100
    );
  }, [isSale, product.originalPrice, product.price]);

  const avgRating = useMemo(() => {
    if (!product.reviews || product.reviews.length === 0) return 0;
    return (
      product.reviews.reduce((sum, r) => sum + r.rating, 0) /
      product.reviews.length
    );
  }, [product.reviews]);

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="bg-white overflow-hidden">
        {/* Image Container - Optimized */}
        <div className="relative overflow-hidden">
          <ImageOptimized
            src={currentImage}
            alt={product.name}
            className="group-hover:scale-110 transition-transform duration-700"
            aspectRatio="3/4"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            objectFit="cover"
          />

          {/* Sale Badge */}
          {isSale && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md z-10">
              -{discount}%
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
                aria-label={`Thêm ${product.name} vào giỏ hàng`}
              >
                <ShoppingCart size={16} />
                <span>Thêm vào giỏ</span>
              </button>
              {onQuickView && (
                <button
                  onClick={handleQuickView}
                  className="p-2.5 bg-white/90 text-gray-700 rounded-lg hover:bg-white transition shadow-md"
                  title="Xem nhanh"
                  aria-label={`Xem nhanh ${product.name}`}
                >
                  <Eye size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions - Mobile */}
          <div className="md:hidden absolute inset-x-3 bottom-3 flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-white text-black py-2 px-3 rounded-lg text-xs font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-1.5 shadow-md"
              aria-label={`Thêm ${product.name} vào giỏ hàng`}
            >
              <ShoppingCart size={14} />
              <span className="whitespace-nowrap">Thêm vào giỏ</span>
            </button>
            {onQuickView && (
              <button
                onClick={handleQuickView}
                className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition shadow-md"
                title="Xem nhanh"
                aria-label={`Xem nhanh ${product.name}`}
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
              <div
                className="flex items-center"
                aria-label={`Đánh giá ${avgRating.toFixed(1)} sao`}
              >
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${
                      i < Math.round(avgRating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    aria-hidden="true"
                  >
                    ★
                  </span>
                ))}
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

// Memoize component to prevent unnecessary re-renders
export default React.memo(ProductCard, (prevProps, nextProps) => {
  // Custom comparison: only re-render if product data actually changed
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.imagePrimary === nextProps.product.imagePrimary &&
    prevProps.product.imageSecondary === nextProps.product.imageSecondary &&
    prevProps.onAddToCart === nextProps.onAddToCart &&
    prevProps.onQuickView === nextProps.onQuickView
  );
});