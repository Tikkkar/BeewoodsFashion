import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Lock, Eye, Database, Users, FileText, Phone, Mail, AlertCircle, CheckCircle, Building } from 'lucide-react';

const PrivacyPolicyPage = ({ brand }) => {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
            <Shield size={20} />
            <span className="text-sm tracking-wide">BẢO MẬT</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Chính Sách Bảo Mật
          </h1>
          <p className="text-gray-200 text-lg">
            Cam kết bảo vệ thông tin cá nhân của bạn
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
            <span className="text-gray-900 font-medium">Chính sách bảo mật</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        
        {/* Important Notice */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg mb-10">
          <div className="flex items-start gap-3">
            <Lock size={24} className="text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-purple-900 mb-2">Cam kết bảo mật</h3>
              <p className="text-purple-800 text-sm leading-relaxed">
                Tại {brand?.name || 'BeeWo'}, việc bảo vệ thông tin cá nhân của bạn là ưu tiên hàng đầu. 
                Chúng tôi cam kết không chia sẻ, bán hoặc cho thuê thông tin cá nhân của bạn cho bất kỳ ai.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Mục đích thu thập */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Mục Đích Thu Thập Thông Tin</h2>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border-2 border-purple-200 mb-4">
            <p className="text-gray-700 leading-relaxed mb-4">
              Mục đích của việc thu thập thông tin khách hàng nhằm liên quan đến các vấn đề sau:
            </p>
          </div>

          <div className="grid gap-4">
            
            {/* Purpose 1 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-purple-600 transition-colors">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Hỗ trợ khách hàng</h3>
                  <p className="text-sm text-gray-700">
                    Hỗ trợ quá trình mua hàng, thanh toán và giao hàng
                  </p>
                </div>
              </div>
            </div>

            {/* Purpose 2 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-purple-600 transition-colors">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Cung cấp thông tin sản phẩm</h3>
                  <p className="text-sm text-gray-700">
                    Cung cấp các dịch vụ và hỗ trợ theo yêu cầu của khách hàng
                  </p>
                </div>
              </div>
            </div>

            {/* Purpose 3 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-purple-600 transition-colors">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Gửi thông báo</h3>
                  <p className="text-sm text-gray-700">
                    Thông báo các chương trình khuyến mãi, sản phẩm mới nhất
                  </p>
                </div>
              </div>
            </div>

            {/* Purpose 4 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-purple-600 transition-colors">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Giải quyết vấn đề</h3>
                  <p className="text-sm text-gray-700">
                    Giải quyết các vấn đề phát sinh trong quá trình mua hàng
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Phạm vi thu thập */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Phạm Vi Thu Thập Thông Tin</h2>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <Database size={24} className="text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-3">Thông tin chúng tôi thu thập</h3>
                <p className="text-gray-700 mb-4">
                  Khi tiến hành đặt hàng trên website, chúng tôi thu thập các thông tin sau:
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="font-semibold text-purple-900 mb-1">👤 Họ và tên</p>
                <p className="text-sm text-gray-600">Để xác định danh tính</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="font-semibold text-purple-900 mb-1">📧 Địa chỉ email</p>
                <p className="text-sm text-gray-600">Để gửi thông tin đơn hàng</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="font-semibold text-purple-900 mb-1">📱 Số điện thoại</p>
                <p className="text-sm text-gray-600">Để liên hệ về đơn hàng</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="font-semibold text-purple-900 mb-1">📍 Địa chỉ giao hàng</p>
                <p className="text-sm text-gray-600">Để giao hàng chính xác</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Thời gian lưu trữ */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Thời Gian Lưu Trữ Thông Tin</h2>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Eye size={24} className="text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Dữ liệu cá nhân của khách hàng sẽ được lưu trữ cho đến khi:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Có yêu cầu hủy bỏ từ khách hàng</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Khách hàng tự đăng nhập và thực hiện hủy bỏ</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-blue-600 text-white rounded-lg">
                  <p className="text-sm">
                    <strong>📌 Lưu ý:</strong> Trong mọi trường hợp khác, thông tin cá nhân của khách hàng 
                    sẽ được bảo mật an toàn trên máy chủ của {brand?.name || 'BeeWo'}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Người có quyền truy cập */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              4
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Người Có Quyền Truy Cập Thông Tin</h2>
          </div>

          <div className="space-y-4">
            
            {/* Access 1 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users size={20} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Đơn vị vận chuyển</h3>
                  <p className="text-sm text-gray-700">
                    Cung cấp thông tin <strong>Tên, Địa chỉ và Số điện thoại</strong> để phục vụ việc giao nhận hàng hóa.
                  </p>
                </div>
              </div>
            </div>

            {/* Access 2 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building size={20} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Nhân viên công ty</h3>
                  <p className="text-sm text-gray-700">
                    Các bộ phận chuyên trách phục vụ việc chăm sóc khách hàng trong quá trình sử dụng sản phẩm.
                  </p>
                </div>
              </div>
            </div>

            {/* Access 3 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Đối tác liên kết</h3>
                  <p className="text-sm text-gray-700">
                    Các chương trình có tính liên kết, đồng thực hiện, thuê ngoài - luôn áp dụng các yêu cầu bảo mật thông tin cá nhân.
                  </p>
                </div>
              </div>
            </div>

            {/* Access 4 */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-red-900">Yêu cầu pháp lý</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Chúng tôi có thể tiết lộ thông tin cá nhân nếu điều đó do luật pháp yêu cầu và việc tiết lộ như vậy 
                    là cần thiết một cách hợp lý để tuân thủ các quy trình pháp lý.
                  </p>
                  <div className="bg-red-100 p-3 rounded text-sm text-red-800">
                    <strong>Chuyển giao kinh doanh:</strong> Trong trường hợp sáp nhập, hợp nhất, người mua sẽ có quyền truy cập 
                    thông tin được chúng tôi lưu trữ, bao gồm cả thông tin cá nhân.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Địa chỉ đơn vị */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              5
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Địa Chỉ Đơn Vị Thu Thập & Quản Lý</h2>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">CÔNG TY CỔ PHẦN THỜI TRANG THIẾT KẾ HAGOO</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Giấy chứng nhận đăng ký thuế số <strong>8122998460-001</strong><br />
                  Do Chi cục thuế Quận Hoàng Mai cấp ngày 11/08/2023
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2 mb-2">
                    <Building size={18} className="text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Địa chỉ</p>
                      <p className="text-sm font-medium">
                        Ngõ 6 P. Bùi Huy Bích, Thịnh Liệt, Hoàng Mai, Hà Nội
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2 mb-2">
                    <Phone size={18} className="text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Hotline</p>
                      <a href="tel:0968877743" className="text-sm font-bold text-blue-600 hover:underline">
                        096.88.777.43
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Quyền truy cập & chỉnh sửa */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              6
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Quyền Truy Cập & Chỉnh Sửa Dữ Liệu</h2>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              Nếu quý khách có bất cứ yêu cầu nào về việc tiếp cận và chỉnh sửa thông tin cá nhân đã cung cấp, 
              quý khách có thể liên hệ qua các kênh sau:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Gọi điện trực tiếp</p>
                    <a href="tel:0968877743" className="text-lg font-bold text-green-700 hover:underline">
                      096.88.777.43
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Gửi email</p>
                    <a href="mailto:hagoomarketing@gmail.com" className="text-sm font-bold text-blue-700 hover:underline break-all">
                      hagoomarketing@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complaint Resolution */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-6">
            <h3 className="font-bold text-xl mb-4">
              🛡️ Cơ Chế Giải Quyết Khiếu Nại
            </h3>
            
            <div className="space-y-3 text-purple-50">
              <p className="leading-relaxed">
                Tại {brand?.name || 'BeeWo'}, việc bảo vệ thông tin cá nhân của bạn là rất quan trọng. 
                Chúng tôi cam kết:
              </p>
              
              <div className="space-y-2 ml-4">
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>Không chia sẻ, bán hoặc cho thuê thông tin của bạn</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>Chỉ sử dụng thông tin để nâng cao chất lượng dịch vụ</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>Giải quyết các tranh chấp, khiếu nại trong vòng <strong>3 ngày</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>Cung cấp thông tin cho cơ quan pháp luật khi có yêu cầu</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-purple-500">
              <p className="text-sm text-center">
                Liên hệ ngay: <a href="tel:0968877743" className="font-bold underline hover:text-purple-200">096.88.777.43</a> hoặc 
                <a href="mailto:hagoomarketing@gmail.com" className="font-bold underline hover:text-purple-200 ml-1">email</a> để được hỗ trợ
              </p>
            </div>
          </div>
        </section>

        {/* Summary Box */}
        <section className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-center mb-6">Cam Kết Bảo Mật Của Chúng Tôi</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            
            <div>
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock size={28} />
              </div>
              <h4 className="font-bold mb-2">100% Bảo Mật</h4>
              <p className="text-sm text-gray-600">Thông tin được mã hóa an toàn</p>
            </div>

            <div>
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield size={28} />
              </div>
              <h4 className="font-bold mb-2">Không Chia Sẻ</h4>
              <p className="text-sm text-gray-600">Không bán thông tin cho bên thứ 3</p>
            </div>

            <div>
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                <Users size={28} />
              </div>
              <h4 className="font-bold mb-2">Hỗ Trợ 24/7</h4>
              <p className="text-sm text-gray-600">Giải đáp mọi thắc mắc</p>
            </div>
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

export default PrivacyPolicyPage;