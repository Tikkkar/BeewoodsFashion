import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  ShoppingBag,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import HeroSlider from "../components/hero/HeroSlider";
import ProductCard from "../components/products/ProductCard";
import QuickViewModal from "../components/products/QuickViewModal";
import { useProducts, useBanners, useCategories } from "../hooks/useProducts";

const HomePage = ({ onAddToCart }) => {
  // ======= Hooks / state: MUST be at top-level (not after returns) =======
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Slider bán chạy
  const featuredScrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Customer carousel hover
  const customerScrollRef = useRef(null);
  const [isCustomerHovered, setIsCustomerHovered] = useState(false);

  // **activeCategory state - bây giờ sẽ lưu slug thực tế hoặc "all"**
  const [activeCategory, setActiveCategory] = useState("all");

  // Customer sample data
  const customers = [
    {
      id: 1,
      name: "Nguyễn Thu Hà",
      role: "Khách hàng thân thiết",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    },
    {
      id: 2,
      name: "Phạm Mai Anh",
      role: "Khách hàng mới",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    },
    {
      id: 3,
      name: "Trần Minh Châu",
      role: "Khách hàng VIP",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    },
    {
      id: 4,
      name: "Lê Hoàng Anh",
      role: "Khách hàng thân thiết",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    },
    {
      id: 5,
      name: "Võ Thị Lan",
      role: "Khách hàng VIP",
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
    },
    {
      id: 6,
      name: "Hoàng Minh Tuấn",
      role: "Khách hàng mới",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    },
    {
      id: 7,
      name: "Đặng Thu Trang",
      role: "Khách hàng thân thiết",
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
    },
    {
      id: 8,
      name: "Ngô Văn Hùng",
      role: "Khách hàng VIP",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    },
  ];

  // =============================================
  // LOGIC & EFFECTS
  // =============================================
  const handleScroll = (direction) => {
    const container = featuredScrollRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const newScrollLeft =
        direction === "right"
          ? container.scrollLeft + scrollAmount
          : container.scrollLeft - scrollAmount;
      container.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      const container = featuredScrollRef.current;
      if (container) {
        if (
          container.scrollLeft + container.clientWidth >=
          container.scrollWidth - 10
        ) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          handleScroll("right");
        }
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const handleCustomerScroll = (direction) => {
    const container = customerScrollRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const newScrollLeft =
        direction === "right"
          ? container.scrollLeft + scrollAmount
          : container.scrollLeft - scrollAmount;
      container.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (isCustomerHovered) return;
    const timer = setInterval(() => {
      const container = customerScrollRef.current;
      if (container) {
        if (
          container.scrollLeft + container.clientWidth >=
          container.scrollWidth - 10
        ) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          handleCustomerScroll("right");
        }
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [isCustomerHovered]);

  // =============================================
  // FETCH DATA TỪ HOOKS
  // =============================================
  
  // Fetch danh mục từ database
  const {
    categories: dbCategories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  // Fetch sản phẩm featured (không đổi)
  const {
    products: featuredProducts,
    loading: featuredLoading,
    error: featuredError,
  } = useProducts({
    featured: true,
    limit: 12,
  });

  // Fetch sản phẩm "Mua gì hôm nay" - thay đổi filter dựa trên activeCategory
  const todayFilters = {
    limit: 20, // Tăng limit để có nhiều sản phẩm hơn
    ...(activeCategory !== "all" && { category: activeCategory }), // Chỉ thêm category filter nếu không phải "all"
  };

  const {
    products: todayProducts,
    loading: todayLoading,
    error: todayError,
  } = useProducts(todayFilters);

  const {
    banners,
    loading: bannersLoading,
    error: bannersError,
  } = useBanners();

  const isLoading = featuredLoading || todayLoading || bannersLoading || categoriesLoading;
  const combinedError = featuredError || todayError || bannersError || categoriesError;

  // =============================================
  // XỬ LÝ CATEGORIES - Thêm "Tất cả" vào đầu danh sách
  // =============================================
  const displayCategories = [
    { id: "all", name: "Tất cả", slug: "all" },
    ...(dbCategories || []),
  ];

  // =============================================
  // ERROR & LOADING STATES
  // =============================================
  if (combinedError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">⌛ Lỗi khi tải dữ liệu</p>
          <p className="text-gray-600 text-sm">{combinedError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black" />
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  // =============================================
  // RENDER
  // =============================================
  return (
    <div className="min-h-screen bg-white">
      {/* 1. Hero Banner */}
      <HeroSlider banners={banners || []} />

      {/* 2. Sản Phẩm Bán Chạy */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <TrendingUp size={24} className="text-red-500" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase">
                Sản Phẩm Bán Chạy
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base">
              Những sản phẩm được yêu thích nhất
            </p>
          </div>

          <div
            className="relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button
              onClick={() => handleScroll("left")}
              className="absolute top-1/2 left-0 -translate-y-1/2 z-10 bg-white/70 hover:bg-white text-black rounded-full p-2 shadow-md transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Previous Product"
            >
              <ChevronLeft size={24} />
            </button>

            <div
              ref={featuredScrollRef}
              className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar -mx-2"
            >
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-1/2 md:w-1/3 lg:w-1/4 snap-start px-2"
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={onAddToCart}
                      onQuickView={setQuickViewProduct}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center w-full py-12 text-gray-500">
                  <p>Không có sản phẩm nổi bật nào</p>
                </div>
              )}
            </div>

            <button
              onClick={() => handleScroll("right")}
              className="absolute top-1/2 right-0 -translate-y-1/2 z-10 bg-white/70 hover:bg-white text-black rounded-full p-2 shadow-md transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Next Product"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Mua Gì Hôm Nay */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <ShoppingBag size={24} className="text-black" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase">
                Mua Gì Hôm Nay
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base">
              Gợi ý sản phẩm cho bạn
            </p>
          </div>

          {/* Thanh nút danh mục - Lấy từ database */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {displayCategories.map((cat) => {
              const active = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`px-5 py-3 border-2 rounded-md text-sm md:text-base transition-all duration-150 ${
                    active
                      ? "bg-black text-white border-black shadow"
                      : "bg-white text-gray-800 border-gray-800 hover:shadow-sm"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Loading state cho khi đổi category */}
          {todayLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-black" />
              <p className="text-gray-600">Đang tải sản phẩm...</p>
            </div>
          ) : todayProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
              {todayProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Không có sản phẩm nào trong danh mục này</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. View All Button */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Xem Tất Cả Sản Phẩm
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Customer Grid Carousel */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase mb-2">
              Khách Hàng Của Chúng Tôi
            </h2>
            <p className="text-gray-600">Những khách hàng tuyệt vời</p>
          </div>

          <div
            className="relative group"
            onMouseEnter={() => setIsCustomerHovered(true)}
            onMouseLeave={() => setIsCustomerHovered(false)}
          >
            <button
              onClick={() => handleCustomerScroll("left")}
              className="absolute top-1/2 left-0 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-black rounded-full p-2 shadow-lg transition-opacity opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={24} />
            </button>

            <div
              ref={customerScrollRef}
              className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar -mx-2"
            >
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex-shrink-0 w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 snap-start px-2"
                >
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group/card">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={customer.image}
                        alt={customer.name}
                        className="w-full h-full object-cover transform group-hover/card:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                        {customer.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500">
                        {customer.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleCustomerScroll("right")}
              className="absolute top-1/2 right-0 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-black rounded-full p-2 shadow-lg transition-opacity opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={onAddToCart}
      />
    </div>
  );
};

export default HomePage;