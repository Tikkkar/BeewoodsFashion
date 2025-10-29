import React from "react";
import ProductCard from "./ProductCard";
import { ShoppingCart, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const ProductGrid = ({
  products,
  onAddToCart,
  onQuickView,
  title,
  viewMode = "grid",
}) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // List View Component
  const ProductListItem = ({ product }) => {
    const [isWishlisted, setIsWishlisted] = React.useState(false);

    React.useEffect(() => {
      const wishlist = JSON.parse(
        localStorage.getItem("bewo_wishlist") || "[]"
      );
      setIsWishlisted(wishlist.some((item) => item.id === product.id));
    }, [product.id]);

    const handleWishlist = () => {
      const wishlist = JSON.parse(
        localStorage.getItem("bewo_wishlist") || "[]"
      );
      const exists = wishlist.find((item) => item.id === product.id);

      if (exists) {
        const newWishlist = wishlist.filter((item) => item.id !== product.id);
        localStorage.setItem("bewo_wishlist", JSON.stringify(newWishlist));
        setIsWishlisted(false);
      } else {
        wishlist.push(product);
        localStorage.setItem("bewo_wishlist", JSON.stringify(wishlist));
        setIsWishlisted(true);
      }

      window.dispatchEvent(new Event("wishlistUpdated"));
    };

    // ⚡ Tính discount
    const discount =
      product.originalPrice && product.originalPrice > product.price
        ? Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) *
              100
          )
        : null;

    // ⚡ Tính average rating
    const avgRating =
      product.reviews && product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length
        : 0;

    return (
      <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <Link
          to={`/product/${product.slug}`}
          className="flex flex-col sm:flex-row gap-4 p-4"
        >
          {" "}
          {/* ⚡ SLUG */}
          {/* Image */}
          <div className="relative w-full sm:w-48 h-64 sm:h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {discount && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                -{discount}%
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">
                {product.category}
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description ||
                  "Sản phẩm cao cấp từ bộ sưu tập mới nhất. Thiết kế tinh tế, chất liệu cao cấp."}
              </p>

              {/* Rating */}
              {product.reviews && product.reviews.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < Math.round(avgRating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    ({product.reviews.length} đánh giá)
                  </span>
                </div>
              )}
            </div>

            {/* Price & Actions */}
            <div className="flex items-center justify-between gap-4 pt-3 border-t">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-black">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice &&
                  product.originalPrice > product.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onAddToCart(product);
                  }}
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  <span className="hidden sm:inline">Thêm vào giỏ</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleWishlist();
                  }}
                  className={`p-2 rounded-lg transition ${
                    isWishlisted
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Heart
                    size={18}
                    fill={isWishlisted ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  // Empty State
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-24 h-24 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Không tìm thấy sản phẩm
        </h3>
        <p className="text-gray-500">
          Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
        </p>
      </div>
    );
  }

  return (
    <section className="w-full">
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
          {title}
        </h2>
      )}

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {products.map((product) => (
            <ProductListItem key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
