import React, { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { getAdminProducts } from "../../lib/api/admin";
import OrderAIAssistant from "./OrderAIAssistant";

const ManualOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
      // Tự động mở AI Assistant khi modal mở
      setAiAssistantOpen(true);
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      const { data } = await getAdminProducts();
      if (data) {
        console.log("✅ Loaded products:", data.length);
        setProducts(data);
      }
    } catch (error) {
      console.error("❌ Error loading products:", error);
    }
  };

  const handleOrderCreated = (order) => {
    console.log("✅ Order created from AI:", order);
    setAiAssistantOpen(false);
    onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Chỉ hiển thị khi AI Assistant chưa mở */}
      {!aiAssistantOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-3">Tạo đơn hàng với AI</h2>
            <p className="text-gray-600 mb-8">
              Sử dụng AI Assistant để tạo đơn hàng nhanh chóng và thông minh
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setAiAssistantOpen(true)}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition flex items-center justify-center gap-3 font-semibold text-lg shadow-lg"
              >
                <Sparkles size={24} />
                Mở AI Assistant
              </button>

              <button
                onClick={onClose}
                className="w-full px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
              >
                Đóng
              </button>
            </div>

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-left">
              <p className="text-sm font-semibold text-gray-700 mb-3">AI có thể giúp bạn:</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Parse thông tin khách hàng từ text/voice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Gợi ý sản phẩm phù hợp với nhu cầu</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Tạo đơn hàng tự động với 1 click</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Chat và tư vấn thông minh</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      {aiAssistantOpen && (
        <OrderAIAssistant
          isOpen={aiAssistantOpen}
          onClose={() => {
            setAiAssistantOpen(false);
            onClose();
          }}
          products={products}
          onOrderCreated={handleOrderCreated}
        />
      )}
    </>
  );
};

export default ManualOrderModal;