import React, { useState } from 'react';
import HeroSlider from '../components/hero/HeroSlider';
import ProductCard from '../components/products/ProductCard';
import QuickViewModal from '../components/products/QuickViewModal';
import { TrendingUp, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = ({ data, onAddToCart }) => {
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Get featured/best seller products
  const featuredProducts = data?.products?.filter(p => p.isFeatured) || data?.products?.slice(0, 8) || [];
  const todayProducts = data?.products?.slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-white">
      
      {/* 1. Hero Banner */}
      <HeroSlider banners={data?.banners || []} />

      {/* 2. Sản Phẩm Bán Chạy */}
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
        </div>
      </section>

      {/* 3. Mua Gì Hôm Nay */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Section Header */}
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

          {/* Products Grid */}
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
            {/* Testimonial 1 */}
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

            {/* Testimonial 2 */}
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

            {/* Testimonial 3 */}
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