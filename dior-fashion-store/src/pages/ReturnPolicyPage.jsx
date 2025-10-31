import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Video,
  AlertCircle,
  Truck,
} from "lucide-react";

const ReturnPolicyPage = ({ brand }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
            <Package size={20} />
            <span className="text-sm tracking-wide">CHÍNH SÁCH</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Chính Sách Đổi Hàng
          </h1>
          <p className="text-gray-300 text-lg">
            Đảm bảo quyền lợi khách hàng - Mua sắm an tâm tại{" "}
            {brand?.name || "BeeWo"}
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-black transition">
              Trang chủ
            </Link>
            <ChevronRight size={14} className="text-gray-400" />
            <span className="text-gray-900 font-medium">
              Chính sách đổi hàng
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Important Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-10">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={24}
              className="text-blue-600 flex-shrink-0 mt-1"
            />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Lưu ý quan trọng</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Vui lòng đọc kỹ chính sách đổi hàng trước khi thực hiện. Mọi
                thắc mắc xin liên hệ hotline: <strong>0978.715.445</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Phạm vi áp dụng */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Phạm Vi Áp Dụng</h2>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-gray-700 leading-relaxed">
              Áp dụng đổi hàng trong vòng{" "}
              <strong className="text-black">15 ngày</strong> đối với các sản
              phẩm:
            </p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle
                  size={20}
                  className="text-green-600 flex-shrink-0 mt-0.5"
                />
                <span className="text-gray-700">
                  Bị hư hỏng do lỗi vận chuyển
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  size={20}
                  className="text-green-600 flex-shrink-0 mt-0.5"
                />
                <span className="text-gray-700">
                  Lỗi do nhà sản xuất (khâu chỉ, vải, màu sắc...)
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2: Điều kiện đổi hàng */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Điều Kiện Đổi Hàng
            </h2>
          </div>

          <div className="space-y-4">
            {/* Condition 1 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-black transition-colors">
              <div className="flex items-start gap-3">
                <Clock size={24} className="text-black flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Thời gian đổi trả</h3>
                  <p className="text-gray-700">
                    Trong vòng <strong>15 ngày</strong> kể từ ngày nhận hàng
                    hoặc mua tại cửa hàng {brand?.name || "BeeWo"}.
                  </p>
                </div>
              </div>
            </div>

            {/* Condition 2 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-black transition-colors">
              <div className="flex items-start gap-3">
                <CheckCircle
                  size={24}
                  className="text-black flex-shrink-0 mt-1"
                />
                <div>
                  <h3 className="font-bold text-lg mb-2">Hóa đơn và tem mác</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• Hóa đơn còn nguyên vẹn</li>
                    <li>
                      • Sản phẩm còn nguyên tem (tag giấy, mác dệt{" "}
                      {brand?.name || "BeeWo"})
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Condition 3 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-black transition-colors">
              <div className="flex items-start gap-3">
                <Package size={24} className="text-black flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    Tình trạng sản phẩm
                  </h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• Chưa qua sử dụng</li>
                    <li>• Chưa giặt tẩy</li>
                    <li>• Không có mùi lạ</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Condition 4 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-black transition-colors">
              <div className="flex items-start gap-3">
                <Video size={24} className="text-black flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    Video unboxing (Quan trọng)
                  </h3>
                  <p className="text-gray-700">
                    <strong className="text-red-600">Bắt buộc</strong> quay lại
                    video khi mở hàng để làm bằng chứng trong trường hợp cần đổi
                    trả.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-5 rounded-r-lg">
            <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
              <XCircle size={20} />
              Lưu ý quan trọng
            </h4>
            <ul className="space-y-2 text-red-800 text-sm">
              <li>
                • Chỉ áp dụng đổi hàng <strong>1 lần duy nhất</strong>
              </li>
              <li>
                • Giá trị sản phẩm đổi phải <strong>bằng hoặc cao hơn</strong>{" "}
                giá trị đã mua
              </li>
              <li>
                • <strong>Không áp dụng</strong> cho các chương trình sale/giảm
                giá
              </li>
              <li>
                • Hàng đã mua <strong>không chấp nhận trả</strong>, chỉ đổi
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3: Cách thức đổi hàng */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Cách Thức Đổi Hàng
            </h2>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-300">
            <h3 className="font-bold text-lg mb-4">Quy trình đổi hàng:</h3>

            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <div>
                  <p className="font-semibold mb-1">Liên hệ hotline hỗ trợ</p>
                  <p className="text-gray-700 text-sm">
                    Gọi <strong>036 2014571</strong> để được tư vấn và xác nhận
                    đổi hàng
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <div>
                  <p className="font-semibold mb-1">Chuẩn bị thông tin</p>
                  <p className="text-gray-700 text-sm">
                    Ghi rõ trên kiện hàng:
                  </p>
                  <ul className="text-gray-600 text-sm mt-2 space-y-1 ml-4">
                    <li>• Tên khách hàng</li>
                    <li>• Mã đặt hàng</li>
                    <li>• Số điện thoại</li>
                    <li>• Nội dung đổi hàng (đổi size/màu/lỗi sản phẩm)</li>
                  </ul>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </span>
                <div>
                  <p className="font-semibold mb-1">Gửi hàng về địa chỉ</p>
                  <div className="bg-white p-4 rounded-lg border border-gray-300 mt-2">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin
                        size={18}
                        className="text-red-600 flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="font-semibold text-sm">
                          Địa chỉ đổi hàng:
                        </p>
                        <p className="text-gray-700 text-sm">
                          Số 57 ngõ 232 Trần Điền, phường Phương Liệt, Thanh
                          Xuân, Hà Nội
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Phone size={18} className="text-green-600" />
                      <div>
                        <p className="font-semibold text-sm">Hotline:</p>
                        <a
                          href="tel:0865644468"
                          className="text-blue-600 font-bold hover:underline"
                        >
                          036 2014571
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </span>
                <div>
                  <p className="font-semibold mb-1">
                    Chờ xác nhận và nhận hàng mới
                  </p>
                  <p className="text-gray-700 text-sm">
                    Sau khi nhận và kiểm tra hàng, chúng tôi sẽ liên hệ và gửi
                    sản phẩm đổi trong vòng 3-5 ngày làm việc
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Section 4: Phí đổi hàng */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">
              4
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Phí Đổi Hàng</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Khách chịu phí */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck size={24} className="text-orange-600" />
                <h3 className="font-bold text-lg">Khách hàng chịu phí</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Khách hàng thanh toán phí vận chuyển <strong>2 chiều</strong>{" "}
                trong các trường hợp:
              </p>
              <ul className="mt-3 space-y-2 text-gray-700 text-sm">
                <li>• Đổi size khác</li>
                <li>• Đổi màu khác</li>
                <li>• Thay đổi ý muốn (không thích sản phẩm)</li>
              </ul>
            </div>

            {/* Shop chịu phí */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={24} className="text-green-600" />
                <h3 className="font-bold text-lg">
                  {brand?.name || "BeeWo"} chịu phí
                </h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Chúng tôi chịu <strong>toàn bộ phí vận chuyển</strong> trong các
                trường hợp:
              </p>
              <ul className="mt-3 space-y-2 text-gray-700 text-sm">
                <li>• Sản phẩm bị lỗi do nhà sản xuất</li>
                <li>• Giao nhầm size/màu/sản phẩm</li>
                <li>• Hư hỏng trong quá trình vận chuyển</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-gradient-to-r from-black to-gray-800 text-white rounded-lg p-8 md:p-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Cần Hỗ Trợ Thêm?
            </h2>
            <p className="text-gray-300">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ quý khách
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Hotline 1 */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
              <Phone size={32} className="mx-auto mb-3" />
              <p className="text-sm text-gray-300 mb-2">
                Hotline đặt hàng & hỗ trợ
              </p>
              <a
                href="tel:0865644468"
                className="text-2xl font-bold hover:text-gray-300 transition"
              >
                036 2014571
              </a>
            </div>

            {/* Hotline 2 */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
              <Phone size={32} className="mx-auto mb-3" />
              <p className="text-sm text-gray-300 mb-2">
                Hotline phản ánh dịch vụ
              </p>
              <a
                href="tel:0978715445"
                className="text-2xl font-bold hover:text-gray-300 transition"
              >
                036 2014571
              </a>
              <p className="text-xs text-gray-400 mt-2">(Giờ hành chính)</p>
            </div>
          </div>

          <p className="text-center text-gray-300 text-sm mt-6">
            Hoặc gửi email:{" "}
            <a
              href="mailto:chamsockhachhangbewo@gmail.com"
              className="underline hover:text-white"
            >
              chamsockhachhangbewo@gmail.com
            </a>
          </p>
        </section>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition font-medium"
          >
            <ChevronRight size={16} className="rotate-180" />
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicyPage;
