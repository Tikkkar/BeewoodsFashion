import React, { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import sizeGuideImage from "../../assets/size.jpg";

const Footer = ({ brand }) => {
  const currentYear = new Date().getFullYear();
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  return (
    <>
      <footer className="bg-white border-t-2 border-gray-200">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Company Info */}
            <div>
              <h3 className="text-black text-2xl font-black tracking-wider uppercase mb-4">
                {brand?.name || "BEEWO STORE"}
              </h3>
              <p className="text-sm leading-relaxed mb-4 text-gray-800 font-medium">
                {brand?.tagline ||
                  "Thời trang thiết kế hiện đại, thanh lịch. Chất lượng - Dịch vụ tận tâm."}
              </p>

              {/* Social Media */}
              <div className="flex items-center gap-3 mt-6">
                <a
                  href="https://facebook.com/beewoodcostume"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-full transition-all"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 hover:bg-pink-600 hover:text-white rounded-full transition-all"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 hover:bg-red-600 hover:text-white rounded-full transition-all"
                  aria-label="YouTube"
                >
                  <Youtube size={18} />
                </a>
              </div>
            </div>

            {/* Customer Support */}
            <div>
              <h4 className="text-black font-black text-base uppercase mb-4 tracking-wider">
                Hỗ Trợ Khách Hàng
              </h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-gray-800 hover:text-black hover:underline transition text-left font-semibold"
                  >
                    Hướng dẫn chọn size
                  </button>
                </li>
                <li>
                  <Link
                    to="/return-policy"
                    className="text-gray-800 hover:text-black hover:underline transition font-semibold"
                  >
                    Chính sách đổi/trả hàng
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shipping-policy"
                    className="text-gray-800 hover:text-black hover:underline transition font-semibold"
                  >
                    Chính sách giao nhận
                  </Link>
                </li>
                <li>
                  <Link
                    to="/payment-policy"
                    className="text-gray-800 hover:text-black hover:underline transition font-semibold"
                  >
                    Chính sách thanh toán
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-gray-800 hover:text-black hover:underline transition font-semibold"
                  >
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/terms" 
                    className="text-gray-800 hover:text-black hover:underline transition font-semibold"
                  >
                    Điều khoản WebSite
                  </Link>
                </li>
              </ul>
            </div>

            {/* About Us */}
            <div>
              <h4 className="text-black font-black text-base uppercase mb-4 tracking-wider">
                Về Chúng Tôi
              </h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link 
                    to="/about" 
                    className="text-gray-800 hover:text-black hover:underline transition font-semibold"
                  >
                    Giới thiệu
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-black font-black text-base uppercase mb-4 tracking-wider">
                Liên Hệ
              </h4>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-black font-bold mb-2">Flagship Store</p>
                  <div className="flex items-start gap-2 text-gray-800 font-medium">
                    <MapPin size={16} className="mt-1 flex-shrink-0 text-black" />
                    <p>Số 8 Tôn Đức Thắng, Phường Văn Miếu, TP Hà Nội</p>
                  </div>
                </div>

                <div>
                  <p className="text-black font-bold mb-2">Hotline Bewo</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-black" />
                      <a
                        href="tel:0362014571"
                        className="text-gray-800 hover:text-black hover:underline transition font-bold"
                      >
                        036 2014571
                      </a>
                    </div>
                    <p className="text-xs text-gray-600 ml-6 font-semibold">
                      Đặt hàng & Hỗ trợ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-black" />
                  <a
                    href="mailto:chamsockhachhangbewo@gmail.com"
                    className="text-gray-800 hover:text-black hover:underline transition text-xs font-semibold"
                  >
                    chamsockhachhangbewo@gmail.com
                  </a>
                </div>

                <div>
                  <p className="text-black font-bold mb-2">Cơ sở Hà Nội</p>
                  <div className="flex items-start gap-2 text-gray-800 font-medium">
                    <MapPin size={16} className="mt-1 flex-shrink-0 text-black" />
                    <p>Số 8 Tôn Đức Thắng, Phường Văn Miếu, TP Hà Nội</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center">
              <p className="text-sm text-gray-800 font-bold mb-3 uppercase tracking-wider">
                Phương thức thanh toán
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs font-black text-gray-900 shadow-sm">
                  VISA
                </div>
                <div className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs font-black text-gray-900 shadow-sm">
                  MASTERCARD
                </div>
                <div className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs font-black text-gray-900 shadow-sm">
                  MOMO
                </div>
                <div className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs font-black text-gray-900 shadow-sm">
                  VNPAY
                </div>
                <div className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs font-black text-gray-900 shadow-sm">
                  COD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
              <p className="text-gray-200 font-semibold">
                © {currentYear} {brand?.name || "BEWO STORE"}. All rights reserved.
              </p>
              <p className="text-center md:text-right text-gray-200 font-bold">
                "Sản phẩm chất lượng - Dịch vụ tận tâm"
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSizeGuide(false)}
              className="absolute top-3 right-3 p-2 bg-black/80 hover:bg-black text-white rounded-full z-10 transition-all"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
            <img
              src={sizeGuideImage}
              alt="Bảng hướng dẫn chọn size"
              className="w-full h-auto rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;