import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package, Truck, Clock, MapPin, CheckCircle, AlertCircle, FileText, Shield, Phone, Mail } from 'lucide-react';

const ShippingPolicyPage = ({ brand }) => {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
            <Truck size={20} />
            <span className="text-sm tracking-wide">CHÍNH SÁCH</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Chính Sách Giao, Nhận Hàng
          </h1>
          <p className="text-gray-200 text-lg">
            Giao hàng toàn quốc - Nhanh chóng và an toàn
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
            <span className="text-gray-900 font-medium">Chính sách giao nhận hàng</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        
        {/* Important Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-10">
          <div className="flex items-start gap-3">
            <Package size={24} className="text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Cam kết của chúng tôi</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Giao hàng toàn quốc, nhanh chóng và an toàn. Hỗ trợ kiểm hàng trước khi thanh toán.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Phạm vi áp dụng */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Phạm Vi Áp Dụng</h2>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <MapPin size={24} className="text-blue-600" />
              <h3 className="font-bold text-lg">Giao hàng toàn quốc</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Chúng tôi giao hàng đến <strong>tất cả các tỉnh thành trên cả nước</strong>. 
              Từ Hà Nội đến TP.HCM, từ miền núi đến hải đảo - chúng tôi cam kết mang sản phẩm đến tận tay bạn.
            </p>
          </div>
        </section>

        {/* Section 2: Thời gian giao nhận */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Thời Gian Giao Nhận Hàng</h2>
          </div>

          <div className="space-y-4">
            
            {/* Timeline 1 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-600 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Đơn hàng nội thành</h3>
                  <p className="text-gray-700 mb-2">
                    Đơn hàng sau khi được tiếp nhận và xử lý xong sẽ được giao ngay trong vòng <strong className="text-blue-600">24 giờ</strong> hoặc theo tiến độ hợp đồng.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>Áp dụng cho khu vực nội thành Hà Nội & TP.HCM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline 2 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-600 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Truck size={24} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Đơn hàng tỉnh xa</h3>
                  <p className="text-gray-700 mb-2">
                    Thời gian nhận hàng dự kiến từ <strong className="text-orange-600">3-5 ngày làm việc</strong> sau khi tiếp nhận đơn hàng.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <AlertCircle size={16} className="text-orange-600" />
                    <span>Tùy vào tình trạng hàng hóa, điều kiện thời tiết mà thời gian có thể thay đổi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Note */}
            <div className="bg-gray-50 border-l-4 border-gray-400 p-5 rounded-r-lg">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Lưu ý:</strong> Thời gian giao hàng được tính từ lúc hoàn tất thủ tục đặt hàng với nhân viên tư vấn đến khi nhận được hàng.
              </p>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-900 mb-2">Quyền hủy đơn hàng</h4>
                  <p className="text-red-800 text-sm leading-relaxed">
                    Trường hợp phát sinh chậm trễ trong việc giao hàng hoặc sản phẩm không được giao quá <strong>10 ngày</strong>, 
                    khách hàng có quyền hủy đơn hàng mà <strong>không chịu bất kỳ chi phí nào</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Hình thức giao hàng */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Hình Thức Giao Hàng</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            
            {/* Khách tỉnh xa */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package size={24} className="text-orange-600" />
                <h3 className="font-bold text-lg">Khách hàng tỉnh xa</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Sử dụng dịch vụ giao hàng chuyên nghiệp (GHN, GHTK, Viettel Post...) 
                để đảm bảo hàng hóa được giao nhanh chóng và an toàn.
              </p>
            </div>

            {/* Khách nội thành */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck size={24} className="text-green-600" />
                <h3 className="font-bold text-lg">Khách nội/ngoại thành</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Sử dụng dịch vụ giao hàng nhanh hoặc đội giao hàng riêng của {brand?.name || 'BeeWo'} 
                để đảm bảo tốc độ và chất lượng dịch vụ tốt nhất.
              </p>
            </div>
          </div>

          {/* Responsibilities */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" />
              Phân định trách nhiệm
            </h3>
            
            <div className="space-y-4">
              
              {/* Đơn vị vận chuyển */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Đơn vị vận chuyển</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Cung cấp chứng từ hàng hóa trong quá trình giao nhận</li>
                    <li>• Vận chuyển hàng hóa theo nguyên tắc "Nguyên đai, nguyên kiện"</li>
                    <li>• Cung cấp phiếu giao hàng với đầy đủ thông tin</li>
                    <li>• Cung cấp hóa đơn cho cơ quan quản lý nhà nước khi có yêu cầu</li>
                  </ul>
                </div>
              </div>

              {/* BeeWo */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{brand?.name || 'BeeWo'}</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Cung cấp đầy đủ và chính xác các chứng từ liên quan đến hàng hóa</li>
                    <li>• Đóng gói và niêm phong tất cả đơn hàng trước khi vận chuyển</li>
                    <li>• Gửi kèm Phiếu bán hàng hợp lệ trong bưu kiện</li>
                    <li>• Xuất hóa đơn điện tử và gửi qua mail sau khi khách xác nhận</li>
                  </ul>
                </div>
              </div>

              {/* Thông tin bao bì */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText size={18} className="text-gray-600" />
                  Thông tin trên bao bì
                </h4>
                <p className="text-sm text-gray-700">
                  Tất cả đơn hàng đều có thông tin: <strong>Tên người nhận, Số điện thoại và Địa chỉ người nhận</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Chính sách kiểm hàng */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              4
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Chính Sách Kiểm Hàng</h2>
          </div>

          <div className="space-y-6">
            
            {/* Right to inspect */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Quyền kiểm hàng</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Khi nhận hàng, quý khách có <strong>quyền yêu cầu nhân viên giao hàng mở kiện</strong> 
                    để kiểm tra sản phẩm trước khi thanh toán và nhận hàng.
                  </p>
                </div>
              </div>
            </div>

            {/* Cases */}
            <div className="grid gap-4">
              
              {/* Case 1 */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">!</span>
                  Trường hợp 1: Giao sai sản phẩm
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  Đơn hàng đặt mà bên bán giao không đúng loại sản phẩm
                </p>
                <div className="bg-red-50 p-3 rounded text-sm">
                  <strong className="text-red-900">→ Giải pháp:</strong>
                  <span className="text-red-800"> Quý khách có quyền trả hàng và không phải thanh toán tiền</span>
                </div>
              </div>

              {/* Case 2 */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">!</span>
                  Trường hợp 2: Đã thanh toán nhưng hàng sai
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  Quý khách đã thanh toán trước nhưng đơn hàng không đúng
                </p>
                <div className="bg-orange-50 p-3 rounded text-sm">
                  <strong className="text-orange-900">→ Giải pháp:</strong>
                  <span className="text-orange-800"> Yêu cầu hoàn tiền HOẶC giao lại đơn mới như đã đặt</span>
                </div>
              </div>
            </div>

            {/* Contact for issues */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
              <h3 className="font-bold text-xl mb-4 text-center">
                Cần Hỗ Trợ Hoặc Khiếu Nại?
              </h3>
              <p className="text-center text-blue-100 mb-6 text-sm">
                Trong trường hợp yêu cầu hoàn tiền hoặc đổi đơn, vui lòng liên hệ:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Email */}
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <Mail size={24} className="mx-auto mb-2" />
                  <p className="text-xs text-blue-200 mb-1">Email hỗ trợ</p>
                  <a 
                    href="mailto:hagoomarketing@gmail.com"
                    className="font-semibold hover:text-blue-200 transition"
                  >
                    hagoomarketing@gmail.com
                  </a>
                </div>

                {/* Phone */}
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <Phone size={24} className="mx-auto mb-2" />
                  <p className="text-xs text-blue-200 mb-1">Hotline phản ánh</p>
                  <a 
                    href="tel:0968877743"
                    className="font-semibold hover:text-blue-200 transition text-lg"
                  >
                    096.88.777.43
                  </a>
                </div>
              </div>

              <p className="text-center text-blue-100 text-sm mt-4">
                ✓ Chúng tôi cam kết giải quyết mọi yêu cầu của quý khách một cách nhanh chóng và thỏa đáng
              </p>
            </div>
          </div>
        </section>

        {/* Summary Box */}
        <section className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-center mb-6">Cam Kết Của Chúng Tôi</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            
            <div>
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                <Truck size={28} />
              </div>
              <h4 className="font-bold mb-2">Giao Hàng Toàn Quốc</h4>
              <p className="text-sm text-gray-600">Phủ sóng 63 tỉnh thành</p>
            </div>

            <div>
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} />
              </div>
              <h4 className="font-bold mb-2">Kiểm Hàng Trước</h4>
              <p className="text-sm text-gray-600">Đảm bảo sản phẩm đúng yêu cầu</p>
            </div>

            <div>
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield size={28} />
              </div>
              <h4 className="font-bold mb-2">Đổi Trả Dễ Dàng</h4>
              <p className="text-sm text-gray-600">Hỗ trợ 100% nếu hàng lỗi</p>
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

export default ShippingPolicyPage;