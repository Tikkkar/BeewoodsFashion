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
      <footer className="bg-gray-900 text-gray-300">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Company Info */}
            <div>
              <h3 className="text-white text-xl font-bold tracking-widest uppercase mb-4">
                {brand?.name || "BEEWO STORE"}
              </h3>
              <p className="text-sm leading-relaxed mb-4">
                {brand?.tagline ||
                  "Thời trang thiết kế hiện đại, thanh lịch. Chất lượng - Dịch vụ tận tâm."}
              </p>

              {/* Social Media */}
              <div className="flex items-center gap-3 mt-6">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 hover:bg-blue-600 rounded-full transition"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 hover:bg-pink-600 rounded-full transition"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 hover:bg-red-600 rounded-full transition"
                  aria-label="YouTube"
                >
                  <Youtube size={18} />
                </a>
              </div>
            </div>

            {/* Customer Support */}
            <div>
              <h4 className="text-white font-semibold text-base uppercase mb-4 tracking-wide">
                Hỗ Trợ Khách Hàng
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="hover:text-white transition text-left"
                  >
                    Hướng dẫn chọn size
                  </button>
                </li>
                <li>
                  <Link
                    to="/return-policy"
                    className="hover:text-white transition"
                  >
                    Chính sách đổi/trả hàng
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shipping-policy"
                    className="hover:text-white transition"
                  >
                    Chính sách giao nhận
                  </Link>
                </li>
                <li>
                  <Link
                    to="/payment-policy"
                    className="hover:text-white transition"
                  >
                    Chính sách thanh toán
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy-policy"
                    className="hover:text-white transition"
                  >
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition">
                    Điều khoản WebSite
                  </Link>
                </li>
              </ul>
            </div>

            {/* About Us */}
            <div>
              <h4 className="text-white font-semibold text-base uppercase mb-4 tracking-wide">
                Về Chúng Tôi
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="hover:text-white transition">
                    Giới thiệu
                  </Link>
                </li>
                <li>
                  <Link to="/news" className="hover:text-white transition">
                    Tin tức
                  </Link>
                </li>
                <li>
                  <Link
                    to="/promotions"
                    className="hover:text-white transition"
                  >
                    Khuyến mãi
                  </Link>
                </li>
                <li>
                  <Link to="/stores" className="hover:text-white transition">
                    Hệ thống cửa hàng
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="hover:text-white transition">
                    Tuyển dụng
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition">
                    Liên hệ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-semibold text-base uppercase mb-4 tracking-wide">
                Liên Hệ
              </h4>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-white font-medium mb-2">Flagship Store</p>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-1 flex-shrink-0" />
                    <p>131 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội</p>
                  </div>
                </div>

                <div>
                  <p className="text-white font-medium mb-2">Hotline</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <a
                        href="tel:09622094195"
                        className="hover:text-white transition"
                      >
                        0962.209.4195
                      </a>
                    </div>
                    <p className="text-xs text-gray-400 ml-6">
                      Đặt hàng & Hỗ trợ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <a
                    href="mailto:support@beewostore.vn"
                    className="hover:text-white transition"
                  >
                    chamsockhachhangbewo@gmail.com
                  </a>
                </div>

                <div>
                  <p className="text-white font-medium mb-2">Cơ sở HCM</p>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-1 flex-shrink-0" />
                    <p>221 Võ Văn Tần, Phường 5, Quận 3, TP.HCM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-3">
                Phương thức thanh toán
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="px-4 py-2 bg-gray-800 rounded text-xs">
                  VISA
                </div>
                <div className="px-4 py-2 bg-gray-800 rounded text-xs">
                  MASTERCARD
                </div>
                <div className="px-4 py-2 bg-gray-800 rounded text-xs">
                  MOMO
                </div>
                <div className="px-4 py-2 bg-gray-800 rounded text-xs">
                  VNPAY
                </div>
                <div className="px-4 py-2 bg-gray-800 rounded text-xs">COD</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <p>
                © {currentYear} {brand?.name || "BEWO STORE"}. All rights
                reserved.
              </p>
              <p className="text-center md:text-right">
                "Sản phẩm chất lượng - Dịch vụ tận tâm"
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSizeGuide(false)}
              className="absolute top-2 right-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-10"
              aria-label="Đóng"
            >
              <X size={20} className="text-gray-700" />
            </button>
            <img
              src={sizeGuideImage}
              alt="Bảng hướng dẫn chọn size"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
