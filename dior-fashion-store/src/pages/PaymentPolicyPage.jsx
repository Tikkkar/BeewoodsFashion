import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  CreditCard,
  Banknote,
  Wallet,
  CheckCircle,
  AlertCircle,
  Shield,
  Phone,
  ArrowRight,
} from "lucide-react";

const PaymentPolicyPage = ({ brand }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-green-900 to-green-700 text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
            <CreditCard size={20} />
            <span className="text-sm tracking-wide">THANH TOÁN</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Chính Sách Thanh Toán
          </h1>
          <p className="text-gray-200 text-lg">
            Đa dạng phương thức - An toàn và tiện lợi
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
              Chính sách thanh toán
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Important Notice */}
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg mb-10">
          <div className="flex items-start gap-3">
            <Shield size={24} className="text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-green-900 mb-2">
                Thanh toán an toàn
              </h3>
              <p className="text-green-800 text-sm leading-relaxed">
                {brand?.name || "BeeWo"} hỗ trợ đa dạng phương thức thanh toán
                để bạn lựa chọn. Mọi giao dịch đều được bảo mật và mã hóa tối
                đa.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Method 1 */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Banknote size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Tiền Mặt (COD)</h3>
            <p className="text-sm text-gray-600">Thanh toán khi nhận hàng</p>
          </div>

          {/* Method 2 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Chuyển Khoản</h3>
            <p className="text-sm text-gray-600">Chuyển khoản ngân hàng</p>
          </div>

          {/* Method 3 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Ví OnePay</h3>
            <p className="text-sm text-gray-600">Thanh toán trực tuyến</p>
          </div>
        </div>

        {/* Section 1: Thanh toán tiền mặt */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Thanh Toán Bằng Tiền Mặt (COD)
            </h2>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center">
                <Banknote size={32} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-3">
                  Thanh toán khi nhận hàng
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Quý khách thanh toán trực tiếp cho nhân viên giao hàng khi
                  nhận được sản phẩm. Đây là phương thức đơn giản, tiện lợi và
                  được nhiều khách hàng lựa chọn.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={18} className="text-green-600" />
                      <span className="font-semibold text-sm">Ưu điểm</span>
                    </div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Kiểm tra hàng trước khi thanh toán</li>
                      <li>• Không cần tài khoản ngân hàng</li>
                      <li>• Đơn giản, nhanh chóng</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={18} className="text-orange-600" />
                      <span className="font-semibold text-sm">Lưu ý</span>
                    </div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Chuẩn bị sẵn tiền lẻ</li>
                      <li>• Kiểm tra kỹ sản phẩm</li>
                      <li>• Giữ phiếu giao hàng</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Chuyển khoản */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Thanh Toán Bằng Chuyển Khoản
            </h2>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center">
                <CreditCard size={32} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-4">Thông tin tài khoản</h3>

                <div className="bg-white rounded-lg p-6 border-2 border-blue-300 shadow-md">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start pb-3 border-b">
                      <span className="text-sm text-gray-600">
                        Chủ tài khoản:
                      </span>
                      <span className="font-bold text-right">
                        NGUYỄN QUANG SẮC
                      </span>
                    </div>

                    <div className="flex justify-between items-start pb-3 border-b">
                      <span className="text-sm text-gray-600">Ngân hàng:</span>
                      <span className="font-semibold text-right">
                        Ngân hàng TMCP Quân đội
                        <br />
                        <span className="text-xs text-gray-500">(MB Bank)</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-600">
                        Số tài khoản:
                      </span>
                      <span className="font-mono font-bold text-lg text-blue-600">
                        9639591859583
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hướng dẫn chuyển khoản */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ArrowRight size={20} className="text-blue-600" />
              Hướng dẫn chuyển khoản
            </h4>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold mb-1">Nội dung chuyển khoản</h5>
                  <p className="text-sm text-gray-700 mb-2">
                    Vui lòng ghi rõ:{" "}
                    <strong>Số điện thoại + Mã đơn hàng</strong>
                  </p>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>Ví dụ:</strong> 0912345678 DH001
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold mb-1">Xác nhận thanh toán</h5>
                  <p className="text-sm text-gray-700">
                    Sau khi nhận được chuyển khoản, chậm nhất sau{" "}
                    <strong>12 tiếng</strong> chúng tôi sẽ gọi điện xác nhận với
                    khách hàng và tiến hành đóng gói, giao hàng.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold mb-1">Giao hàng</h5>
                  <p className="text-sm text-gray-700">
                    Đơn hàng sẽ được xử lý và giao đến quý khách theo thời gian
                    cam kết trong
                    <Link
                      to="/shipping-policy"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      chính sách giao nhận
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-2">
              <AlertCircle
                size={20}
                className="text-yellow-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Vui lòng chụp lại màn hình giao dịch và
                gửi cho chúng tôi qua Zalo/Messenger để được xác nhận nhanh hơn.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: OnePay */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Thanh Toán Qua Ví OnePay
            </h2>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center">
                <Wallet size={32} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-3">
                  Thanh toán trực tuyến an toàn
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Nhằm mục đích giúp khách hàng thanh toán nhanh chóng, tiện lợi
                  và an toàn khi mua hàng trực tuyến,
                  {brand?.name || "BeeWo"} chính thức áp dụng phương thức thanh
                  toán trực tuyến qua cổng <strong>OnePay</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Các bước thanh toán */}
          <div className="space-y-6">
            {/* General Steps */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <h4 className="font-bold text-lg mb-4">
                Các bước thanh toán qua OnePay
              </h4>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold mb-2">
                      Thêm sản phẩm vào giỏ hàng
                    </h5>
                    <p className="text-sm text-gray-700">
                      Chọn sản phẩm yêu thích, thêm vào giỏ hàng và nhấn{" "}
                      <strong>"ĐẶT HÀNG"</strong>
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold mb-2">Nhập thông tin</h5>
                    <p className="text-sm text-gray-700 mb-2">
                      Nhập thông tin cá nhân, địa chỉ nhận hàng, mã giảm giá
                      (nếu có)
                    </p>
                    <p className="text-sm text-gray-700">
                      Chọn một trong hai phương thức:
                    </p>
                    <ul className="text-sm text-gray-700 ml-4 mt-2 space-y-1">
                      <li>
                        • <strong>OnePay Card International</strong> (Thẻ quốc
                        tế)
                      </li>
                      <li>
                        • <strong>OnePay Card Domestic</strong> (Thẻ nội địa)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* OnePay International */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={24} className="text-blue-600" />
                <h4 className="font-bold text-lg">
                  Hình thức 1: OnePay Card International
                </h4>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-blue-600 font-bold">→</span>
                  <p className="text-sm text-gray-700">
                    Chọn loại thẻ sử dụng để thanh toán (Visa, Mastercard,
                    JCB...)
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="text-blue-600 font-bold">→</span>
                  <p className="text-sm text-gray-700">
                    Nhập các thông tin thẻ theo yêu cầu và chọn{" "}
                    <strong>"Xác nhận thanh toán"</strong>
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="text-blue-600 font-bold">→</span>
                  <p className="text-sm text-gray-700">
                    OTP đã được gửi về số điện thoại đăng ký. Nhập OTP để hoàn
                    tất giao dịch
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-blue-600 text-white p-4 rounded-lg">
                <p className="text-sm">
                  <strong>⚠️ Lưu ý:</strong> Khi thực hiện thanh toán, vui lòng
                  chờ 2-3 giây, không đóng/tắt sớm trình duyệt hoặc app cho đến
                  khi nhận được thông báo cuối cùng.
                </p>
              </div>
            </div>

            {/* OnePay Domestic */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={24} className="text-green-600" />
                <h4 className="font-bold text-lg">
                  Hình thức 2: OnePay Card Domestic
                </h4>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-green-600 font-bold">→</span>
                  <p className="text-sm text-gray-700">
                    Chọn loại thẻ sử dụng để thanh toán (Thẻ ATM nội địa)
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="text-green-600 font-bold">→</span>
                  <p className="text-sm text-gray-700">
                    Nhập các thông tin thẻ theo yêu cầu và chọn{" "}
                    <strong>"Xác nhận thanh toán"</strong>
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="text-green-600 font-bold">→</span>
                  <p className="text-sm text-gray-700">
                    OTP đã được gửi về số điện thoại đăng ký. Nhập OTP để hoàn
                    tất giao dịch
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-green-600 text-white p-4 rounded-lg">
                <p className="text-sm">
                  <strong>⚠️ Lưu ý:</strong> Khi thực hiện thanh toán, vui lòng
                  chờ 2-3 giây, không đóng/tắt sớm trình duyệt hoặc app cho đến
                  khi nhận được thông báo cuối cùng.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Support */}
        <section className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg p-8">
          <h3 className="text-2xl font-bold text-center mb-6">
            🔒 Bảo Mật & Hỗ Trợ
          </h3>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <Shield size={32} className="mb-3" />
              <h4 className="font-bold text-lg mb-2">An toàn tuyệt đối</h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                Mọi giao dịch thanh toán đều được mã hóa SSL 256-bit. Thông tin
                thẻ của bạn được bảo vệ bởi chuẩn bảo mật quốc tế PCI-DSS.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <Phone size={32} className="mb-3" />
              <h4 className="font-bold text-lg mb-2">Hỗ trợ 24/7</h4>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                Gặp khó khăn khi thanh toán? Liên hệ ngay:
              </p>
              <a
                href="tel:0968877743"
                className="text-lg font-bold hover:text-gray-300"
              >
                📞 036 2014571
              </a>
            </div>
          </div>

          <div className="text-center pt-6 border-t border-white/20">
            <p className="text-sm text-gray-300">
              Mọi thắc mắc về thanh toán, vui lòng liên hệ hotline hoặc gửi
              email:
              <a
                href="mailto:chamsockhachhangbewo@gmail.com"
                className="underline hover:text-gray-300 ml-1"
              >
                chamsockhachhangbewo@gmail.com
              </a>
            </p>
          </div>
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

export default PaymentPolicyPage;
