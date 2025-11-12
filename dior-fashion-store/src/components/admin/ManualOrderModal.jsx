import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { 
  createManualOrder, 
  createOrderItems, 
  updateProductStock,
  getAdminProducts 
} from "../../lib/api/admin";
import { Package } from "lucide-react";
const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const ManualOrderModal = ({ isOpen, onClose, onSuccess, preselectedProduct = null }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    shipping_address: "",
    shipping_city: "",
    shipping_district: "",
    shipping_ward: "",
    notes: ""
  });
  const [orderItems, setOrderItems] = useState([]);
  const [shippingFee, setShippingFee] = useState(30000);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentStatus, setPaymentStatus] = useState("pending");

  // Load products khi modal mở
  useEffect(() => {
    if (isOpen) {
      loadProducts();
      
      // Nếu có preselected product, thêm vào orderItems
      if (preselectedProduct) {
        setOrderItems([{
          product_id: preselectedProduct.id,
          product_name: preselectedProduct.name,
          price: preselectedProduct.price,
          quantity: 1,
          size: "",
          available_sizes: preselectedProduct.product_sizes || []
        }]);
      }
    }
  }, [isOpen, preselectedProduct]);

  const loadProducts = async () => {
    try {
      const { data } = await getAdminProducts();
      if (data) {
        console.log("✅ Loaded products:", data.length);
        setProducts(data);
      }
    } catch (error) {
      console.error("❌ Error loading products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !orderItems.some(item => item.product_id === p.id)
  );

  const addProduct = (product) => {
    console.log("➕ Adding product:", product);
    setOrderItems([...orderItems, {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: 1,
      size: "",
      available_sizes: product.product_sizes || []
    }]);
    setSearchTerm("");
  };

  const updateItem = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + shippingFee;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerInfo.customer_name || !customerInfo.customer_phone) {
      toast.error("Vui lòng nhập tên và số điện thoại khách hàng");
      return;
    }

    if (!customerInfo.shipping_address) {
      toast.error("Vui lòng nhập địa chỉ giao hàng");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    // Kiểm tra stock trước khi tạo đơn
    for (const item of orderItems) {
      if (item.available_sizes && item.available_sizes.length > 0) {
        if (!item.size) {
          toast.error(`Vui lòng chọn size cho sản phẩm "${item.product_name}"`);
          return;
        }
        const sizeStock = item.available_sizes.find(s => s.size === item.size);
        if (!sizeStock || sizeStock.stock < item.quantity) {
          toast.error(`Size ${item.size} của "${item.product_name}" không đủ hàng (còn ${sizeStock?.stock || 0})`);
          return;
        }
      }
    }

    setLoading(true);
    const toastId = toast.loading("Đang tạo đơn hàng...");

    try {
      // 1. Tạo order number
      const orderNumber = 'ORD' + Date.now();

      // 2. Tạo đơn hàng
      const orderData = {
        order_number: orderNumber,
        customer_name: customerInfo.customer_name,
        customer_phone: customerInfo.customer_phone,
        customer_email: customerInfo.customer_email || null,
        shipping_address: customerInfo.shipping_address,
        shipping_city: customerInfo.shipping_city || null,
        shipping_district: customerInfo.shipping_district || null,
        shipping_ward: customerInfo.shipping_ward || null,
        subtotal: calculateSubtotal(),
        shipping_fee: shippingFee,
        total_amount: calculateTotal(),
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        status: "pending",
        notes: customerInfo.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log("📦 Creating order:", orderData);
      const { data: order } = await createManualOrder(orderData);
      console.log("✅ Order created:", order);

      // 3. Tạo order items
      const itemsToCreate = orderItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: null, // Có thể lấy từ product nếu cần
        size: item.size || null,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      }));

      console.log("📝 Creating order items:", itemsToCreate);
      await createOrderItems(order.id, itemsToCreate);
      console.log("✅ Order items created");

      // 4. Cập nhật stock
      for (const item of orderItems) {
        console.log(`📉 Updating stock for product ${item.product_id}, size: ${item.size || 'none'}, qty: ${item.quantity}`);
        await updateProductStock(
          item.product_id, 
          item.quantity, 
          item.size || null
        );
      }
      console.log("✅ Stock updated");

      toast.success(`Đơn hàng ${orderNumber} đã được tạo thành công!`, { id: toastId });
      
      // Reset form
      setCustomerInfo({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        shipping_address: "",
        shipping_city: "",
        shipping_district: "",
        shipping_ward: "",
        notes: ""
      });
      setOrderItems([]);
      setShippingFee(30000);
      setPaymentMethod("cod");
      setPaymentStatus("pending");
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("❌ Create order error:", error);
      toast.error(error.message || "Tạo đơn hàng thất bại", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Tạo đơn hàng thủ công</h2>
            {preselectedProduct && (
              <p className="text-sm text-gray-600 mt-1">
                Sản phẩm đã chọn: {preselectedProduct.name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thông tin khách hàng */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">Thông tin khách hàng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Tên khách hàng *"
                  value={customerInfo.customer_name}
                  onChange={(e) => setCustomerInfo({...customerInfo, customer_name: e.target.value})}
                  className="p-3 border rounded-lg w-full"
                  required
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại *"
                  value={customerInfo.customer_phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, customer_phone: e.target.value})}
                  className="p-3 border rounded-lg w-full"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (tùy chọn)"
                  value={customerInfo.customer_email}
                  onChange={(e) => setCustomerInfo({...customerInfo, customer_email: e.target.value})}
                  className="p-3 border rounded-lg w-full md:col-span-2"
                />
              </div>
              
              {/* Địa chỉ giao hàng */}
              <div className="space-y-3 pt-2">
                <h4 className="font-medium text-gray-700">Địa chỉ giao hàng</h4>
                <textarea
                  placeholder="Địa chỉ cụ thể (Số nhà, tên đường) *"
                  value={customerInfo.shipping_address}
                  onChange={(e) => setCustomerInfo({...customerInfo, shipping_address: e.target.value})}
                  className="p-3 border rounded-lg w-full h-20"
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Phường/Xã"
                    value={customerInfo.shipping_ward}
                    onChange={(e) => setCustomerInfo({...customerInfo, shipping_ward: e.target.value})}
                    className="p-3 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Quận/Huyện"
                    value={customerInfo.shipping_district}
                    onChange={(e) => setCustomerInfo({...customerInfo, shipping_district: e.target.value})}
                    className="p-3 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Tỉnh/Thành phố"
                    value={customerInfo.shipping_city}
                    onChange={(e) => setCustomerInfo({...customerInfo, shipping_city: e.target.value})}
                    className="p-3 border rounded-lg"
                  />
                </div>
                <textarea
                  placeholder="Ghi chú đơn hàng (tùy chọn)"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                  className="p-3 border rounded-lg w-full h-16"
                />
              </div>
            </div>

            {/* Sản phẩm */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Sản phẩm</h3>
              
              {/* Tìm kiếm sản phẩm - LUÔN HIỂN THỊ */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm thêm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="p-3 pl-10 border rounded-lg w-full"
                />
                {searchTerm && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-lg mt-1 max-h-64 overflow-y-auto shadow-lg z-10">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addProduct(product)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-600">{formatPrice(product.price)}</div>
                            {product.stock !== undefined && (
                              <div className="text-xs text-gray-500">
                                Tồn kho: {product.stock}
                              </div>
                            )}
                          </div>
                          <Plus size={18} className="text-green-600" />
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Không tìm thấy sản phẩm phù hợp
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Danh sách sản phẩm đã chọn */}
              {orderItems.length > 0 ? (
                orderItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-600">{formatPrice(item.price)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {item.available_sizes && item.available_sizes.length > 0 ? (
                        <select
                          value={item.size}
                          onChange={(e) => updateItem(index, 'size', e.target.value)}
                          className="p-2 border rounded-lg"
                          required
                        >
                          <option value="">Chọn size *</option>
                          {item.available_sizes.map(s => (
                            <option key={s.size} value={s.size}>
                              {s.size} (Còn {s.stock})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-2 text-sm text-gray-500 italic">
                          Không có size
                        </div>
                      )}
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="p-2 border rounded-lg"
                        placeholder="Số lượng"
                        required
                      />
                    </div>
                    
                    <div className="text-right font-semibold text-green-600">
                      Thành tiền: {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    Chưa có sản phẩm nào. Vui lòng tìm kiếm và thêm sản phẩm.
                  </p>
                </div>
              )}
            </div>

            {/* Thanh toán */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">Thanh toán</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phương thức thanh toán</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="p-3 border rounded-lg w-full"
                  >
                    <option value="cod">COD (Thanh toán khi nhận hàng)</option>
                    <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                    <option value="vnpay">VNPay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Trạng thái thanh toán</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="p-3 border rounded-lg w-full"
                  >
                    <option value="pending">Chờ thanh toán</option>
                    <option value="paid">Đã thanh toán</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Phí vận chuyển (VND)</label>
                  <input
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(parseInt(e.target.value) || 0)}
                    className="p-3 border rounded-lg w-full"
                    min="0"
                  />
                </div>
              </div>

              {/* Tổng tiền */}
              {orderItems.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span>{formatPrice(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span>{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t">
                    <span>Tổng cộng:</span>
                    <span className="text-green-600">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border rounded-lg hover:bg-gray-100 transition"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || orderItems.length === 0}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Đang tạo..." : "Tạo đơn hàng"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualOrderModal;