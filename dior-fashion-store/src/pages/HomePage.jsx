import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingBag, ArrowRight, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import HeroSlider from '../components/hero/HeroSlider';
import ProductCard from '../components/products/ProductCard';
import QuickViewModal from '../components/products/QuickViewModal';
import { useProducts, useBanners } from '../hooks/useProducts';

const HomePage = ({ onAddToCart }) => {
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // =============================================
  // LOGIC CHO SLIDER SẢN PHẨM BÁN CHẠY
  // =============================================
  const featuredScrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleScroll = (direction) => {
    const container = featuredScrollRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const newScrollLeft = direction === 'right'
        ? container.scrollLeft + scrollAmount
        : container.scrollLeft - scrollAmount;
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      const container = featuredScrollRef.current;
      if (container) {
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          handleScroll('right');
        }
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [isHovered]);

  // =============================================
  // FETCH DATA TỪ SUPABASE
  // =============================================
  const { products: featuredProducts, loading: featuredLoading, error: featuredError } = useProducts({ 
    featured: true, 
    limit: 12 
  });

  const { products: todayProducts, loading: todayLoading, error: todayError } = useProducts({ 
    limit: 4 
  });

  const { banners, loading: bannersLoading, error: bannersError } = useBanners();

  // =============================================
  // KẾT HỢP CÁC TRẠNG THÁI LOADING VÀ ERROR
  // =============================================
  const isLoading = featuredLoading || todayLoading || bannersLoading;
  const combinedError = featuredError || todayError || bannersError;

  if (combinedError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ Lỗi khi tải dữ liệu</p>
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

      {/* 2. Sản Phẩm Bán Chạy - DẠNG SLIDER */}
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
            className="relative group" // Thêm class 'group' để điều khiển hiển thị nút bấm
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button
              onClick={() => handleScroll('left')}
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
                  <div key={product.id} className="flex-shrink-0 w-1/2 md:w-1/3 lg:w-1/4 snap-start px-2">
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
              onClick={() => handleScroll('right')}
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
          <div className="text-center mb-8 md:mb-12">
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
          {todayProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
              <p>Không có sản phẩm nào</p>
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

      {/* 5. Customer Feedback */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase mb-2">
              Khách Hàng Nói Gì Về Chúng Tôi
            </h2>
            <p className="text-gray-600">Những phản hồi tích cực từ khách hàng</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Sản phẩm rất đẹp, chất lượng tốt. Giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop tiếp!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-medium">Nguyễn Thu Hà</p>
                  <p className="text-sm text-gray-500">Khách hàng thân thiết</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Thiết kế sang trọng, form dáng chuẩn. Mặc rất thoải mái và đẹp. Giá cả hợp lý!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-medium">Phạm Mai Anh</p>
                  <p className="text-sm text-gray-500">Khách hàng mới</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Dịch vụ chăm sóc khách hàng tốt, nhiệt tình. Sản phẩm đúng như mô tả. Rất hài lòng!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-medium">Trần Minh Châu</p>
                  <p className="text-sm text-gray-500">Khách hàng VIP</p>
                </div>
              </div>
            </div>
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