import React from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Heart,
  Shield,
  Sparkles,
  Users,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const AboutPage = ({ brand }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200"
          alt="BEWo Store"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-wide mb-4">
              VỀ {brand?.name || "BEWO"}
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto font-light tracking-wide">
              Nơi hội tụ phong cách, chất lượng và sự tinh tế
            </p>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-black transition">
              Trang chủ
            </Link>
            <ChevronRight size={14} className="text-gray-400" />
            <span className="text-gray-900 font-medium">
              Về {brand?.name || "BEWO"}
            </span>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Image */}
            <div className="order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800"
                alt="BeeWo Brand Story"
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            {/* Right: Content */}
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-block px-4 py-1 bg-black text-white text-sm tracking-widest rounded-full">
                CÂU CHUYỆN THƯƠNG HIỆU
              </div>

              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                Hành Trình Tạo Nên Phong Cách Riêng
              </h2>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  <strong>{brand?.name || "BEWO"}</strong> ra đời từ niềm đam mê
                  mang đến những sản phẩm thời trang chất lượng cao với giá cả
                  hợp lý cho người Việt. Chúng tôi tin rằng phong cách không
                  phải là đặc quyền của số ít, mà là quyền được thể hiện bản
                  thân của mọi người.
                </p>

                <p>
                  Khởi đầu từ một cửa hàng nhỏ tại Hà Nội vào năm 2020,{" "}
                  {brand?.name || "BEWO"} đã không ngừng lớn mạnh và phát triển.
                  Với đội ngũ thiết kế trẻ trung, sáng tạo cùng quy trình sản
                  xuất nghiêm ngặt, chúng tôi tự hào mang đến những sản phẩm
                  được khách hàng tin tưởng và yêu thích.
                </p>

                <p>
                  Hơn cả thời trang, {brand?.name || "BEWO"} muốn truyền cảm
                  hứng để mỗi người tự tin thể hiện cá tính riêng, tạo nên phong
                  cách sống đầy màu sắc và ý nghĩa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Giá Trị Cốt Lõi
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những nguyên tắc định hình mọi quyết định của chúng tôi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Value 1 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Chất Lượng</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Cam kết 100% sản phẩm chính hãng, chất liệu cao cấp, kiểm định
                kỹ lưỡng trước khi đến tay khách hàng.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Tận Tâm</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Đặt khách hàng làm trung tâm, lắng nghe và thấu hiểu nhu cầu để
                mang đến trải nghiệm tốt nhất.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Sáng Tạo</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Không ngừng đổi mới, bắt kịp xu hướng thế giới, tạo ra những
                thiết kế độc đáo và khác biệt.
              </p>
            </div>

            {/* Value 4 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Uy Tín</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Minh bạch trong mọi giao dịch, đảm bảo quyền lợi khách hàng với
                chính sách đổi trả rõ ràng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Con Số Ấn Tượng
            </h2>
            <p className="text-gray-600">
              Những thành tựu đáng tự hào của {brand?.name || "BeeWo"}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-black mb-2">
                50K+
              </div>
              <p className="text-gray-600 font-medium">Khách Hàng Hài Lòng</p>
            </div>

            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-black mb-2">
                500+
              </div>
              <p className="text-gray-600 font-medium">Sản Phẩm Đa Dạng</p>
            </div>

            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-black mb-2">
                15+
              </div>
              <p className="text-gray-600 font-medium">Cửa Hàng Toàn Quốc</p>
            </div>

            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-black mb-2">
                5 năm
              </div>
              <p className="text-gray-600 font-medium">
                Kinh Nghiệm Thị Trường
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            {/* Mission */}
            <div className="text-center md:text-left">
              <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Sứ Mệnh</h3>
              <p className="text-gray-300 leading-relaxed">
                Mang đến những sản phẩm thời trang chất lượng cao, giá cả hợp
                lý, giúp mọi người tự tin thể hiện phong cách riêng và nâng tầm
                vẻ đẹp bản thân. {brand?.name || "BeeWo"} cam kết xây dựng một cộng đồng yêu thời trang, sống tích cực và
                lan tỏa năng lượng tích cực.
              </p>
            </div>

            {/* Vision */}
            <div className="text-center md:text-left">
              <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Tầm Nhìn</h3>
              <p className="text-gray-300 leading-relaxed">
                Trở thành thương hiệu thời trang hàng đầu Việt Nam, được khách
                hàng tin tưởng và yêu thích. Chúng tôi hướng tới việc mở rộng
                quy mô, phát triển bền vững và không ngừng nâng cao trải nghiệm
                mua sắm để {brand?.name || "BeeWo"} trở thành lựa chọn hàng đầu
                của mọi gia đình Việt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Sẵn Sàng Khám Phá Bộ Sưu Tập?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Tham gia cùng hàng nghìn khách hàng đã tin tưởng{" "}
            {brand?.name || "BEWO"}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors font-semibold text-lg"
          >
            Khám Phá Ngay
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
