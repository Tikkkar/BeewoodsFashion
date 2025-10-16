import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Truck, ShieldCheck, Tag, XCircle } from 'lucide-react';
import { createOrder } from '../lib/api/orders';
import { useToast } from '../hooks/useToast';
import { verifyDiscountCode } from '../lib/api/discounts';

const CheckoutPage = ({ cart, onClearCart }) => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    note: '',
    paymentMethod: 'cod',
  });

  const [errors, setErrors] = useState({});

  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const shippingFee = 30000;

  useEffect(() => {
    let newDiscountAmount = 0;
    if (appliedDiscount) {
      if (appliedDiscount.discount_type === 'percentage') {
        newDiscountAmount = (subtotal * appliedDiscount.value) / 100;
      } else if (appliedDiscount.discount_type === 'fixed_amount') {
        newDiscountAmount = appliedDiscount.value;
      }
      newDiscountAmount = Math.min(newDiscountAmount, subtotal);
    }
    
    setDiscountAmount(newDiscountAmount);
    setFinalTotal(subtotal - newDiscountAmount + shippingFee);
  }, [subtotal, appliedDiscount, shippingFee]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ';
    if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyDiscount = async () => {
    if (!discountCodeInput) {
      showError('Vui lòng nhập mã giảm giá.');
      return;
    }
    const result = await verifyDiscountCode(discountCodeInput);
    if (result) {
      if (result.min_purchase_amount > subtotal) {
        showError(`Mã này yêu cầu đơn hàng tối thiểu ${formatPrice(result.min_purchase_amount)}.`);
        return;
      }
      setAppliedDiscount(result);
      success('Áp dụng mã giảm giá thành công!');
    } else {
      showError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };
  
  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCodeInput('');
    success('Đã gỡ bỏ mã giảm giá.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const discountInfo = {
        code: appliedDiscount?.code,
        discountAmount: discountAmount,
      };
      const orderData = {
        cartItems: cart,
        customerInfo: { name: formData.fullName, phone: formData.phone, notes: formData.note },
        shippingInfo: { address: formData.address, city: '', district: '', ward: '' },
        discountInfo: discountInfo,
      };
      
      const { data: order, error } = await createOrder(orderData);
      if (error) throw new Error(error.message || 'Lỗi không xác định');

      onClearCart();
      navigate('/checkout/success', { state: { orderNumber: order.order_number, orderId: order.id } });
    } catch (err) {
      console.error('Order creation failed:', err);
      showError(`Đặt hàng thất bại: ${err.message}`);
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
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      placeholder="Số nhà, tên đường, phường/xã, tỉnh/thành phố"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
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

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-light tracking-widest mb-6">
                ĐƠN HÀNG CỦA BẠN
              </h2>
              
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.cartId || item.id} className="flex gap-3">
                    <img
                      src={item.imagePrimary}
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

              <div className="border-t pt-4">
                <label htmlFor="discount-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Mã giảm giá
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="discount-code"
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                    placeholder="NHẬP MÃ"
                    className="flex-1 w-full px-3 py-2 border-2 border-gray-300 rounded-l-lg focus:border-black focus:outline-none transition-colors"
                    disabled={!!appliedDiscount}
                  />
                  <button
                    onClick={handleApplyDiscount}
                    className="px-4 py-2 bg-black text-white rounded-r-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                    disabled={!!appliedDiscount}
                  >
                    Áp dụng
                  </button>
                </div>

                {appliedDiscount && (
                  <div className="mt-3 flex justify-between items-center bg-green-50 text-green-700 p-2 rounded-lg">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Tag size={16} /> Đã áp dụng: {appliedDiscount.code}
                    </span>
                    <button onClick={handleRemoveDiscount}>
                      <XCircle size={18} className="hover:text-red-500" />
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t mt-4 pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-gray-600">Giảm giá:</span>
                    <span className="font-medium">- {formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium">{formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-xl font-medium pt-3 border-t">
                  <span>Tổng cộng:</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

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