import React, { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Sparkles, User, Bot, Copy, Check, ShoppingCart, Package } from "lucide-react";
import { toast } from "react-hot-toast";
import AddressSelector from "../checkout/AddressSelector";
import {
  sendChatMessage,
  parseCustomerInfo,
  suggestProducts,
} from "../../lib/api/orderAssistant.js";
import { createOrderFromAI } from "../../lib/api/orders.js";

const OrderAIAssistant = ({
  isOpen,
  onClose,
  products,
  onOrderCreated,
}) => {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Xin chào! Tôi là AI Assistant của BeewoodsFashion. Tôi có thể giúp bạn:\n\n✅ Parse thông tin khách hàng từ tin nhắn\n✅ Gợi ý sản phẩm phù hợp\n✅ Tạo đơn hàng nhanh\n\nBạn cần tôi hỗ trợ gì?",
      type: "chat",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Order Creation States
  const [parsedCustomerInfo, setParsedCustomerInfo] = useState(null);

  // Manual Customer Info States
  const [manualCustomerInfo, setManualCustomerInfo] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    shipping_address: "",
    shipping_ward: "",
    shipping_district: "",
    shipping_city: "",
    notes: ""
  });

  // Address codes for API
  const [addressCodes, setAddressCodes] = useState({
    cityCode: null,
    districtCode: null,
    wardCode: null
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("One Size");
  const [shippingFee, setShippingFee] = useState(30000);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Available sizes for selected product
  const [availableSizes, setAvailableSizes] = useState([]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch sizes when product is selected
    if (selectedProduct) {
      fetchProductSizes(selectedProduct.id);
    } else {
      setAvailableSizes([]);
      setSelectedSize("One Size");
    }
  }, [selectedProduct]);

  // Auto-fill manual form when parsedCustomerInfo changes
  useEffect(() => {
    if (parsedCustomerInfo) {
      setManualCustomerInfo({
        customer_name: parsedCustomerInfo.customer_name || "",
        customer_phone: parsedCustomerInfo.customer_phone || "",
        customer_email: parsedCustomerInfo.customer_email || "",
        shipping_address: parsedCustomerInfo.shipping_address || "",
        shipping_ward: parsedCustomerInfo.shipping_ward || "",
        shipping_district: parsedCustomerInfo.shipping_district || "",
        shipping_city: parsedCustomerInfo.shipping_city || "",
        notes: parsedCustomerInfo.notes || ""
      });

      // AI parsed text addresses - notify user to select from dropdown
      toast("💡 Vui lòng chọn địa chỉ chính xác từ dropdown bên dưới", {
        duration: 4000,
        icon: "ℹ️",
        style: {
          background: '#EFF6FF',
          color: '#1E40AF',
          border: '1px solid #BFDBFE'
        }
      });
    }
  }, [parsedCustomerInfo]);

  const fetchProductSizes = async (productId) => {
    try {
      const product = products.find(p => p.id === productId);
      if (product && product.product_sizes && product.product_sizes.length > 0) {
        const sizes = product.product_sizes.map(s => s.size);
        setAvailableSizes(sizes);
        setSelectedSize(sizes[0]);
      } else {
        setAvailableSizes([]);
        setSelectedSize("One Size");
      }
    } catch (error) {
      console.error("Error fetching sizes:", error);
      setAvailableSizes([]);
      setSelectedSize("One Size");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let response;

      if (
        input.toLowerCase().includes("parse") ||
        input.toLowerCase().includes("phân tích") ||
        input.toLowerCase().includes("thông tin khách")
      ) {
        // Parse customer info
        response = await parseCustomerInfo(input);
        if (response.type === "customer_info" && response.data) {
          setParsedCustomerInfo(response.data);
          toast.success("✅ Đã tự động điền thông tin khách hàng!");
        }
      } else if (
        input.toLowerCase().includes("gợi ý") ||
        input.toLowerCase().includes("tìm") ||
        input.toLowerCase().includes("sản phẩm")
      ) {
        // Suggest products
        response = await suggestProducts(input, products);
      } else {
        // General chat
        response = await sendChatMessage(input);
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.type === "chat" ? response.message : formatResponse(response),
        type: response.type,
        data: response.type !== "chat" ? response.data : undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("❌ AI Assistant error:", error);
      toast.error(error.message || "Có lỗi xảy ra khi gọi AI Assistant");

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatResponse = (response) => {
    if (response.type === "customer_info") {
      const { data, message, confidence } = response;
      return `${message}\n\n**Độ tin cậy:** ${confidence === "high" ? "Cao ✅" : confidence === "medium" ? "Trung bình ⚠️" : "Thấp ❌"}\n\n**Thông tin đã trích xuất:**\n- Tên: ${data.customer_name || "N/A"}\n- SĐT: ${data.customer_phone || "N/A"}\n- Email: ${data.customer_email || "N/A"}\n- Địa chỉ: ${data.shipping_address || "N/A"}\n- Phường/Xã: ${data.shipping_ward || "N/A"}\n- Quận/Huyện: ${data.shipping_district || "N/A"}\n- Tỉnh/TP: ${data.shipping_city || "N/A"}`;
    } else if (response.type === "product_suggestions") {
      const { data, message } = response;
      return `${message}\n\n**Sản phẩm gợi ý:**\n${data.products?.map((p, i) => `${i + 1}. ${p.product_name}\n   ${p.reason} (${p.confidence === "high" ? "✅" : p.confidence === "medium" ? "⚠️" : "❌"})`).join("\n\n")}`;
    }
    return "";
  };

  const handleApplyCustomerInfo = (data) => {
    setParsedCustomerInfo(data);
    toast.success("Đã áp dụng thông tin khách hàng!");
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Đã copy!");
  };

  // Handle address selector change
  const handleAddressChange = (addressData) => {
    setManualCustomerInfo(prev => ({
      ...prev,
      shipping_city: addressData.city || "",
      shipping_district: addressData.district || "",
      shipping_ward: addressData.ward || ""
    }));

    setAddressCodes({
      cityCode: addressData.cityCode,
      districtCode: addressData.districtCode,
      wardCode: addressData.wardCode
    });
  };

  const handleCreateOrder = async () => {
    // Validate customer info
    const customerInfo = manualCustomerInfo;

    if (!customerInfo.customer_name || !customerInfo.customer_phone) {
      toast.error("Vui lòng nhập tên và số điện thoại khách hàng!");
      return;
    }

    if (!customerInfo.shipping_address) {
      toast.error("Vui lòng nhập địa chỉ giao hàng!");
      return;
    }

    if (!customerInfo.shipping_city || !customerInfo.shipping_district || !customerInfo.shipping_ward) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã!");
      return;
    }

    if (!selectedProduct) {
      toast.error("Vui lòng chọn sản phẩm!");
      return;
    }

    if (quantity < 1) {
      toast.error("Số lượng phải lớn hơn 0!");
      return;
    }

    setCreatingOrder(true);

    try {
      const orderData = {
        customerInfo: {
          ...customerInfo,
          ...addressCodes // Include address codes for shipping API
        },
        productId: selectedProduct.id,
        quantity: quantity,
        size: selectedSize,
        shippingFee: shippingFee,
        status: orderStatus,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus
      };

      const { data, error } = await createOrderFromAI(orderData);

      if (error) throw new Error(error);

      toast.success(`✅ Đã tạo đơn hàng ${data.order_number} thành công!`);

      // Reset form
      setParsedCustomerInfo(null);
      setManualCustomerInfo({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        shipping_address: "",
        shipping_ward: "",
        shipping_district: "",
        shipping_city: "",
        notes: ""
      });
      setAddressCodes({
        cityCode: null,
        districtCode: null,
        wardCode: null
      });
      setSelectedProduct(null);
      setQuantity(1);
      setSelectedSize("One Size");
      setShippingFee(30000);
      setOrderStatus("pending");
      setPaymentMethod("cod");
      setPaymentStatus("pending");

      if (onOrderCreated) {
        onOrderCreated(data);
      }

      const successMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Đơn hàng ${data.order_number} đã được tạo thành công!\n\n- Khách hàng: ${customerInfo.customer_name}\n- Sản phẩm: ${selectedProduct.name}\n- Số lượng: ${quantity}\n- Địa chỉ: ${customerInfo.shipping_address}, ${customerInfo.shipping_ward}, ${customerInfo.shipping_district}, ${customerInfo.shipping_city}\n- Tổng tiền: ${(selectedProduct.price * quantity + shippingFee).toLocaleString("vi-VN")} ₫`,
        type: "chat",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMessage]);

    } catch (error) {
      console.error("❌ Create order error:", error);
      toast.error(error.message || "Có lỗi khi tạo đơn hàng!");
    } finally {
      setCreatingOrder(false);
    }
  };

  const canCreateOrder = manualCustomerInfo.customer_name &&
    manualCustomerInfo.customer_phone &&
    manualCustomerInfo.shipping_address &&
    manualCustomerInfo.shipping_city &&
    manualCustomerInfo.shipping_district &&
    manualCustomerInfo.shipping_ward &&
    selectedProduct &&
    quantity > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-2">
            <Sparkles size={24} />
            <h3 className="font-semibold text-lg">AI Assistant - Tạo Đơn Hàng Nhanh</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Chat Section */}
          <div className="flex-1 flex flex-col border-r border-gray-200">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-purple-500 text-white"
                      }`}
                  >
                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Message bubble */}
                  <div
                    className={`flex-1 max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg ${msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-gray-200"
                        }`}
                    >
                      <div className="whitespace-pre-wrap text-sm">{msg.content}</div>

                      {/* Action buttons */}
                      {msg.role === "assistant" && msg.data && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                          {msg.type === "customer_info" && (
                            <button
                              onClick={() => handleApplyCustomerInfo(msg.data)}
                              className="text-xs bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600 transition"
                            >
                              ✓ Áp dụng thông tin
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded hover:bg-gray-600 transition flex items-center gap-1"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={12} /> Copied
                              </>
                            ) : (
                              <>
                                <Copy size={12} /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {msg.timestamp.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white border border-gray-200 p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Nhập tin nhắn hoặc paste thông tin khách hàng..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>

              {/* Quick actions */}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setInput("Parse thông tin khách hàng từ text sau: ")}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 transition"
                  disabled={loading}
                >
                  📋 Parse thông tin
                </button>
                <button
                  onClick={() => setInput("Gợi ý sản phẩm: ")}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 transition"
                  disabled={loading}
                >
                  🔍 Gợi ý sản phẩm
                </button>
              </div>
            </div>
          </div>

          {/* Right: Order Creation Form */}
          <div className="w-[450px] flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-purple-600">
                <ShoppingCart size={20} />
                <h4 className="font-semibold">Tạo Đơn Hàng Nhanh</h4>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Customer Info Section */}
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                  Thông tin khách hàng
                  {parsedCustomerInfo && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      ✓ AI Parsed
                    </span>
                  )}
                </h5>

                <input
                  type="text"
                  placeholder="Tên khách hàng *"
                  value={manualCustomerInfo.customer_name}
                  onChange={(e) => setManualCustomerInfo({ ...manualCustomerInfo, customer_name: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại *"
                  value={manualCustomerInfo.customer_phone}
                  onChange={(e) => setManualCustomerInfo({ ...manualCustomerInfo, customer_phone: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="email"
                  placeholder="Email (tùy chọn)"
                  value={manualCustomerInfo.customer_email}
                  onChange={(e) => setManualCustomerInfo({ ...manualCustomerInfo, customer_email: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <textarea
                  placeholder="Địa chỉ chi tiết (số nhà, tên đường) *"
                  value={manualCustomerInfo.shipping_address}
                  onChange={(e) => setManualCustomerInfo({ ...manualCustomerInfo, shipping_address: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 h-16 resize-none"
                />

                {/* Address Selector - Vietnam provinces/districts/wards */}
                <div className="border-t pt-3 mt-2">
                  <AddressSelector
                    value={{
                      city: manualCustomerInfo.shipping_city,
                      district: manualCustomerInfo.shipping_district,
                      ward: manualCustomerInfo.shipping_ward
                    }}
                    onChange={handleAddressChange}
                    error={null}
                  />
                </div>

                <textarea
                  placeholder="Ghi chú (tùy chọn)"
                  value={manualCustomerInfo.notes}
                  onChange={(e) => setManualCustomerInfo({ ...manualCustomerInfo, notes: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 h-12 resize-none"
                />
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chọn sản phẩm *
                </label>
                <select
                  value={selectedProduct?.id || ""}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setSelectedProduct(product || null);
                  }}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.price.toLocaleString("vi-VN")} ₫
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số lượng *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Size *
                  </label>
                  {availableSizes.length > 0 ? (
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {availableSizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value="One Size"
                      disabled
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                    />
                  )}
                </div>
              </div>

              {/* Shipping Fee */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phí ship (₫)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(parseInt(e.target.value) || 0)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Payment Method & Status */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    PT thanh toán
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="cod">COD</option>
                    <option value="bank_transfer">Chuyển khoản</option>
                    <option value="vnpay">VNPay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    TT thanh toán
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="pending">Chờ TT</option>
                    <option value="paid">Đã TT</option>
                  </select>
                </div>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái đơn hàng *
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="pending">Pending (Chờ xử lý)</option>
                  <option value="processing">Processing (Đang xử lý)</option>
                  <option value="confirmed">Confirmed (Đã xác nhận)</option>
                </select>
              </div>

              {/* Order Summary */}
              {selectedProduct && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h5 className="font-semibold text-gray-700 mb-2 text-sm">Tóm tắt đơn hàng</h5>
                  <div className="text-xs space-y-1 text-gray-600">
                    <div className="flex justify-between">
                      <span>Sản phẩm:</span>
                      <span className="font-medium text-right">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Đơn giá:</span>
                      <span>{selectedProduct.price.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số lượng:</span>
                      <span>{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{selectedSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span>{(selectedProduct.price * quantity).toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí ship:</span>
                      <span>{shippingFee.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold text-purple-600">
                      <span>Tổng cộng:</span>
                      <span>{(selectedProduct.price * quantity + shippingFee).toLocaleString("vi-VN")} ₫</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Create Order Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleCreateOrder}
                disabled={!canCreateOrder || creatingOrder}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
              >
                {creatingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tạo đơn...
                  </>
                ) : (
                  <>
                    <Package size={20} />
                    Tạo Đơn Hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderAIAssistant;