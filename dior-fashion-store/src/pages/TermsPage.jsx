import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Shield, Users, AlertCircle, CheckCircle, Ban, Scale, Phone, Mail } from 'lucide-react';

const TermsPage = ({ brand }) => {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
            <FileText size={20} />
            <span className="text-sm tracking-wide">ĐIỀU KHOẢN</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Điều Khoản Sử Dụng Website
          </h1>
          <p className="text-gray-300 text-lg">
            Quy định và thỏa thuận sử dụng dịch vụ tại {brand?.name || 'BeeWo'}
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
            <span className="text-gray-900 font-medium">Điều khoản sử dụng</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        
        {/* Welcome Message */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-8 mb-10">
          <h2 className="text-2xl font-bold text-center mb-4">
            Chào Mừng Bạn Đến Với {brand?.name || 'BeeWo'}.com.vn
          </h2>
          <p className="text-gray-700 leading-relaxed text-center">
            Đây là website bán lẻ thời trang trực tuyến của <strong>{brand?.name || 'BeeWo'}</strong>. 
            Sau khi truy cập vào website để tham khảo hoặc mua sắm, bạn đã đồng ý tuân thủ và ràng buộc 
            với những quy định của chúng tôi.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-10">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">Lưu ý quan trọng</h3>
              <p className="text-yellow-800 text-sm leading-relaxed mb-3">
                Vui lòng xem kỹ các quy định và hợp tác với chúng tôi để xây dựng {brand?.name || 'BeeWo'} 
                ngày càng thân thiện và phục vụ tốt hơn.
              </p>
              <p className="text-yellow-800 text-sm">
                <strong>Quý khách vui lòng kiểm tra thường xuyên để cập nhật những thay đổi của chúng tôi.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Hướng dẫn sử dụng */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Hướng Dẫn Sử Dụng Website</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                Chúng tôi cấp giấy phép sử dụng để bạn có thể mua sắm trên web trong khuôn khổ Điều khoản 
                và Điều kiện sử dụng đã đề ra.
              </p>
              
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r mb-4">
                <div className="flex items-start gap-2">
                  <Ban size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">
                    <strong>Nghiêm cấm:</strong> Sử dụng bất kỳ phần nào của trang web này với mục đích thương mại 
                    hoặc nhân danh bất kỳ đối tác thứ ba nào nếu không được chúng tôi cho phép bằng văn bản.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p>Trang web chỉ dùng để cung cấp thông tin sản phẩm</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p>Nhận xét hiển thị là ý kiến cá nhân của khách hàng</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p>Quý khách phải đăng ký tài khoản với thông tin xác thực</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p>Chịu trách nhiệm về mật khẩu, tài khoản và hoạt động của mình</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
              <p className="text-sm text-gray-700">
                <strong>📧 Email & SMS Marketing:</strong> Trong suốt quá trình đăng ký, quý khách đồng ý nhận email 
                hoặc SMS quảng cáo. Nếu không muốn tiếp tục nhận, quý khách có thể từ chối bằng cách nhấp vào đường 
                link ở cuối mỗi email hoặc soạn tin theo cú pháp từ chối.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Ý kiến khách hàng */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Ý Kiến Khách Hàng</h2>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Users size={24} className="text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Tất cả nội dung trang web và ý kiến phê bình của quý khách đều là <strong>tài sản của chúng tôi</strong>.
                </p>
                <div className="bg-red-100 p-4 rounded">
                  <p className="text-sm text-red-900">
                    <strong>⚠️ Cảnh báo:</strong> Nếu chúng tôi phát hiện bất kỳ thông tin giả mạo nào, chúng tôi sẽ 
                    <strong> khóa tài khoản ngay lập tức</strong> hoặc áp dụng các biện pháp khác theo quy định pháp luật Việt Nam.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Chấp nhận đơn hàng */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Chấp Nhận Đơn Hàng & Giá Cả</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Shield size={20} className="text-gray-600" />
                Quyền từ chối/hủy đơn hàng
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Chúng tôi có quyền từ chối hoặc hủy đơn hàng của quý khách vì bất kỳ lý do gì vào bất kỳ lúc nào. 
                Chúng tôi có thể hỏi thêm về số điện thoại và địa chỉ trước khi nhận đơn hàng.
              </p>

              <h3 className="font-bold mb-3 flex items-center gap-2">
                <AlertCircle size={20} className="text-orange-600" />
                Cam kết về giá
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                Chúng tôi cam kết cung cấp thông tin giá cả chính xác nhất. Tuy nhiên, đôi lúc vẫn có sai sót xảy ra:
              </p>
              <ul className="text-sm text-gray-700 space-y-2 ml-4">
                <li>• Giá sản phẩm không hiển thị chính xác trên trang web</li>
                <li>• Sai giá do lỗi hệ thống</li>
              </ul>
              <p className="text-sm text-gray-700 mt-3">
                Tùy theo từng trường hợp, chúng tôi sẽ liên hệ hướng dẫn hoặc thông báo hủy đơn hàng cho quý khách.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Thương hiệu */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
              4
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Thương Hiệu & Bản Quyền</h2>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              Mọi quyền sở hữu trí tuệ (đã đăng ký hoặc chưa đăng ký), nội dung thông tin và tất cả các thành phần sau 
              đều là <strong>tài sản của chúng tôi</strong>:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Thiết kế, văn bản, đồ họa',
                'Phần mềm, mã nguồn',
                'Hình ảnh, video, âm nhạc',
                'Biên dịch phần mềm',
                'Âm thanh, âm nhạc',
                'Phần mềm cơ bản'
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 bg-white p-3 rounded">
                  <CheckCircle size={16} className="text-blue-600" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-blue-600 text-white p-4 rounded">
              <p className="text-sm">
                <strong>🔒 Bảo vệ bản quyền:</strong> Toàn bộ nội dung được bảo vệ bởi luật bản quyền Việt Nam 
                và các công ước quốc tế. <strong>Bản quyền đã được bảo lưu.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Quyền pháp lý */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
              5
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Quyền Pháp Lý</h2>
          </div>

          <div className="bg-white border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Scale size={24} className="text-red-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700 leading-relaxed">
                  Các điều kiện, điều khoản và nội dung của trang web này được <strong>điều chỉnh bởi luật pháp Việt Nam</strong>. 
                  Tòa án có thẩm quyền tại Việt Nam sẽ giải quyết bất kỳ tranh chấp nào phát sinh từ việc sử dụng trái phép trang web này.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Bảo mật */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
              6
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Quy Định Về Bảo Mật</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Shield size={24} className="text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Cam kết bảo mật</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Chúng tôi coi trọng việc bảo mật thông tin và sử dụng các biện pháp tốt nhất bảo vệ thông tin 
                    và việc thanh toán của quý khách. Thông tin trong quá trình giao dịch sẽ được <strong>mã hóa</strong> để đảm bảo an toàn.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="font-bold mb-3 text-red-900 flex items-center gap-2">
                <Ban size={20} />
                Nghiêm cấm các hành vi sau
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Sử dụng chương trình, công cụ để can thiệp vào hệ thống</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Làm thay đổi cấu trúc dữ liệu</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Phát tán, truyền bá hoạt động phá hoại hệ thống</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Xâm nhập vào dữ liệu của hệ thống</span>
                </li>
              </ul>
              <div className="mt-4 bg-red-100 p-3 rounded">
                <p className="text-sm text-red-900">
                  <strong>⚖️ Hậu quả:</strong> Cá nhân hay tổ chức vi phạm sẽ bị tước bỏ mọi quyền lợi và 
                  sẽ bị truy tố trước pháp luật nếu cần thiết.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7-8: Thanh toán */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
              7
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Thanh Toán An Toàn & Giao Kết Giao Dịch</h2>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
            <p className="text-gray-700 leading-relaxed mb-4">
              Mọi khách hàng tham gia giao dịch tại {brand?.name || 'BeeWo'} đều được <strong>bảo mật an toàn, 
              nhanh chóng và tiện lợi</strong>.
            </p>
            
            <h3 className="font-bold mb-3">Chúng tôi hỗ trợ các phương thức thanh toán:</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="font-semibold mb-1">💵 COD</p>
                <p className="text-xs text-gray-600">Thanh toán khi nhận hàng</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="font-semibold mb-1">🏦 Chuyển khoản</p>
                <p className="text-xs text-gray-600">Qua ngân hàng</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="font-semibold mb-1">💳 Trực tuyến</p>
                <p className="text-xs text-gray-600">OnePay, VNPay...</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-700">
              Chi tiết về các phương thức thanh toán, vui lòng xem tại: 
              <Link to="/payment-policy" className="text-blue-600 hover:underline ml-1 font-semibold">
                Chính sách thanh toán
              </Link>
            </p>
          </div>
        </section>

        {/* Section 9-10: Thay đổi & Hủy */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
              9
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Thay Đổi & Hủy Bỏ Giao Dịch</h2>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Trong mọi trường hợp, khách hàng đều có quyền chấm dứt giao dịch nếu đã thực hiện:
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <p className="text-sm text-gray-700 flex-1">
                  Thông báo cho {brand?.name || 'BeeWo'} về việc hủy giao dịch qua hotline hoặc lời ghi nhắn tại mục Liên hệ
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <p className="text-sm text-gray-700 flex-1">
                  Trả lại hàng hóa đã nhận nhưng chưa sử dụng hoặc hưởng bất kỳ lợi ích nào theo 
                  <Link to="/return-policy" className="text-blue-600 hover:underline mx-1">chính sách đổi trả hàng</Link>
                </p>
              </div>
            </div>

            <div className="mt-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r">
              <p className="text-sm text-gray-700">
                <strong>Lỗi nhập sai thông tin:</strong> Khách hàng có trách nhiệm cung cấp thông tin đầy đủ và chính xác. 
                Trong trường hợp nhập sai thông tin, {brand?.name || 'BeeWo'} có quyền từ chối thực hiện giao dịch.
              </p>
            </div>
          </div>
        </section>

        {/* Section 11: Giải quyết tranh chấp */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
              11
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Giải Quyết Tranh Chấp</h2>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Scale size={24} className="text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700 leading-relaxed">
                  Bất kỳ tranh cãi, khiếu nại hoặc tranh chấp phát sinh từ hoặc liên quan đến giao dịch tại 
                  {brand?.name || 'BeeWo'} đều sẽ được giải quyết bằng hình thức:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-purple-600" />
                    <span><strong>Thương lượng</strong> - Ưu tiên giải quyết hòa bình</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-purple-600" />
                    <span><strong>Hòa giải</strong> - Tìm điểm chung</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-purple-600" />
                    <span><strong>Trọng tài và/hoặc Tòa án</strong> - Theo Luật bảo vệ Người tiêu dùng Chương 4</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 12: Luật pháp */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
              12
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Luật Pháp & Thẩm Quyền Tại Việt Nam</h2>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Scale size={24} className="text-red-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Tất cả các Điều Khoản và Điều Kiện này và Hợp Đồng (và tất cả nghĩa vụ phát sinh ngoài hợp đồng hoặc có liên quan) 
                  sẽ bị chi phối và được hiểu theo <strong>luật pháp của Việt Nam</strong>.
                </p>
                <div className="bg-red-100 p-4 rounded">
                  <p className="text-sm text-red-900">
                    <strong>⚖️ Giải quyết tranh chấp:</strong> Nếu có tranh chấp phát sinh, quý khách gửi khiếu nại 
                    lên <strong>Tòa án Việt Nam</strong> để giải quyết.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg p-8">
          <h3 className="text-2xl font-bold text-center mb-6">
            📞 Liên Hệ Hỗ Trợ
          </h3>
          
          <p className="text-center text-gray-300 mb-6"></p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        
        {/* Hotline 1 */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
          <Phone size={32} className="mx-auto mb-3" />
          <p className="text-sm text-gray-300 mb-2">Hotline đặt hàng & hỗ trợ</p>
          <a href="tel:0865644468" className="text-2xl font-bold hover:text-gray-300 transition">
            036 2014571
          </a>
        </div>

        {/* Hotline 2 */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
          <Phone size={32} className="mx-auto mb-3" />
          <p className="text-sm text-gray-300 mb-2">Hotline phản ánh chất lượng</p>
          <a href="tel:0968877743" className="text-2xl font-bold hover:text-gray-300 transition">
            036 2014571
          </a>
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-300">
          Email: 
          <a href="chamsockhachhangbewo@gmail.com" className="underline hover:text-white ml-1">
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
export default TermsPage;