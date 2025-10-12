import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Truck, ShieldCheck } from 'lucide-react';
import { createOrder } from '../lib/api/orders';

const CheckoutPage = ({ cart, onClearCart }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // ⚡ THÊM DÒNG NÀY
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '', // ⚡ THÊM DÒNG NÀY
    note: '',
    paymentMethod: 'cod',
  });

  const [errors, setErrors] = useState({});

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const shippingFee = 30000;
  const total = calculateSubtotal() + shippingFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có 10 chữ số';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Vui lòng chọn tỉnh/thành phố';
    }
    if (!formData.district.trim()) {
      newErrors.district = 'Vui lòng chọn quận/huyện';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        cartItems: cart,
        customerInfo: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          notes: formData.note // ⚡ SỬA: notes → note
        },
        shippingInfo: {
          address: formData.address,
          city: formData.city,
          district: formData.district,
          ward: formData.ward || ''
        },
        total: calculateSubtotal() // ⚡ SỬA: dùng calculateSubtotal() thay vì total
      };

      // Create order in Supabase
      const { data: order, error } = await createOrder(orderData);

      if (error) {
        throw new Error(error);
      }

      // Clear cart
      onClearCart();

      // Navigate to success page with order info
      navigate('/checkout/success', { 
        state: { 
          orderNumber: order.order_number,
          orderId: order.id 
        } 
      });

    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Đặt hàng thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-16">
        <div className="text-center">
          <h2 className="text-2xl font-light tracking-widest mb-4">
            Giỏ hàng trống
          </h2>
          <p className="text-gray-600 mb-6">
            Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-black text-white tracking-wide hover:bg-gray-800 transition-colors rounded-lg"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-8"
        >
          <ChevronLeft size={20} />
          <span className="tracking-wide">Quay lại</span>
        </button>

        <h1 className="text-3xl md:text-4xl font-light tracking-widest text-center mb-12">
          THANH TOÁN
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Thông tin khách hàng */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-light tracking-widest mb-6">
                  THÔNG TIN KHÁCH HÀNG
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.fullName ? 'border-red-500' : 'border-gray-300 focus:border-black'
                      }`}
                      placeholder="Nguyễn Văn A"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                          errors.email ? 'border-red-500' : 'border-gray-300 focus:border-black'
                        }`}
                        placeholder="email@example.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                          errors.phone ? 'border-red-500' : 'border-gray-300 focus:border-black'
                        }`}
                        placeholder="0123456789"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Địa chỉ giao hàng */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-light tracking-widest mb-6">
                  ĐỊA CHỈ GIAO HÀNG
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.address ? 'border-red-500' : 'border-gray-300 focus:border-black'
                      }`}
                      placeholder="Số nhà, tên đường"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tỉnh/Thành phố <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                          errors.city ? 'border-red-500' : 'border-gray-300 focus:border-black'
                        }`}
                      >
                        <option value="">Chọn tỉnh/thành phố</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Hải Phòng">Hải Phòng</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                      </select>
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Quận/Huyện <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                          errors.district ? 'border-red-500' : 'border-gray-300 focus:border-black'
                        }`}
                      >
                        <option value="">Chọn quận/huyện</option>
                        <option value="Quận 1">Quận 1</option>
                        <option value="Quận 2">Quận 2</option>
                        <option value="Quận 3">Quận 3</option>
                        <option value="Quận 4">Quận 4</option>
                        <option value="Quận 5">Quận 5</option>
                      </select>
                      {errors.district && (
                        <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ghi chú (không bắt buộc)
                    </label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
                      placeholder="Ghi chú cho đơn hàng..."
                    />
                  </div>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-light tracking-widest mb-6">
                  PHƯƠNG THỨC THANH TOÁN
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-black transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                      className="w-5 h-5 mr-3"
                    />
                    <Truck size={24} className="mr-3 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-black transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={formData.paymentMethod === 'bank'}
                      onChange={handleInputChange}
                      className="w-5 h-5 mr-3"
                    />
                    <CreditCard size={24} className="mr-3 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">Chuyển khoản ngân hàng</p>
                      <p className="text-sm text-gray-600">Chuyển khoản qua ATM/Internet Banking</p>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-light tracking-widest mb-6">
                ĐƠN HÀNG CỦA BẠN
              </h2>

              {/* Products List */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.cartId || item.id} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-gray-600">x{item.quantity}</p>
                      <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium">{formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-xl font-medium pt-3 border-t">
                  <span>Tổng cộng:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full mt-6 py-4 rounded-lg tracking-widest uppercase font-medium transition-colors flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                <ShieldCheck size={20} />
                {loading ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Thanh toán an toàn & bảo mật
                </p>
                <p className="flex items-center gap-2">
                  <Truck size={16} />
                  Miễn phí vận chuyển toàn quốc
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;