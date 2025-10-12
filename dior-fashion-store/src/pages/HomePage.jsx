import React, { useState } from 'react';
import HeroSlider from '../components/hero/HeroSlider';
import ProductCard from '../components/products/ProductCard';
import QuickViewModal from '../components/products/QuickViewModal';
import { Sparkles, TrendingUp, Gift, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = ({ data, onAddToCart }) => {
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Get featured/best seller products
  const featuredProducts = data?.products?.filter(p => p.isFeatured) || data?.products?.slice(0, 8) || [];
  const newArrivals = data?.products?.slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Slider */}
      <HeroSlider banners={data?.banners || []} />

      {/* Free Shipping Banner */}
      <div className="bg-red-50 border-y border-red-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-sm text-red-700">
            <Gift size={18} />
            <p className="font-medium">
              MIỄN PHÍ VẬN CHUYỂN cho đơn hàng từ 2 sản phẩm - 
              <span className="ml-1 font-bold">Áp dụng toàn quốc</span>
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {data?.categories && data.categories.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase mb-2">
                Danh Mục Sản Phẩm
              </h2>
              <p className="text-gray-600">Khám phá bộ sưu tập của chúng tôi</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {data.categories.map((category, index) => (
                <Link
                  key={index}
                  to={`/category/${category.name.toLowerCase()}`}
                  className="group relative aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={category.img}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-lg md:text-xl font-bold tracking-wide uppercase">
                        {category.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Xem ngay</span>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Section Header */}
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

          {/* Products Grid */}
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
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

          {/* View All Button */}
          <div className="text-center mt-8 md:mt-12">
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

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            
            {/* Section Header */}
            <div className="text-center mb-8 md:mb-12">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles size={24} className="text-yellow-500" />
                <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase">
                  Hàng Mới Về
                </h2>
              </div>
              <p className="text-gray-600 text-sm md:text-base">
                Cập nhật xu hướng thời trang mới nhất
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Customer Feedback Section (Hagoo Style) */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase mb-2">
              Khách Hàng Nói Gì Về Chúng Tôi
            </h2>
            <p className="text-gray-600">Những phản hồi tích cực từ khách hàng</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 p-6 rounded-lg">
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

            {/* Testimonial 2 */}
            <div className="bg-gray-50 p-6 rounded-lg">
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

            {/* Testimonial 3 */}
            <div className="bg-gray-50 p-6 rounded-lg">
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

      {/* Newsletter Section */}
      <section className="py-12 md:py-16 bg-black text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Đăng Ký Nhận Thông Tin
          </h2>
          <p className="text-gray-300 mb-8">
            Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Email của bạn"
              className="flex-1 px-4 py-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition whitespace-nowrap"
            >
              Đăng Ký
            </button>
          </form>
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