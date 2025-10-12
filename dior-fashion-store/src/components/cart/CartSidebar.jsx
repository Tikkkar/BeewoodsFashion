import React from 'react';
import { X, Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartSidebar = ({ isOpen, onClose, cart, onRemoveItem, onUpdateQuantity }) => {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('⚠️ Giỏ hàng trống!');
      return;
    }
    onClose();
    navigate('/checkout');
  };

  // ⚡ CHỈ GỌI PROPS - KHÔNG DÙNG setCart
  const handleRemove = (item) => {
    if (item.cartId) {
      onRemoveItem(item.cartId);
    } else if (item.selectedSize) {
      onRemoveItem(item.id, item.selectedSize);
    } else {
      onRemoveItem(item.id);
    }
  };

  const handleIncrease = (item) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(item.cartId || item.id, item.quantity + 1, item.selectedSize);
    }
  };

  const handleDecrease = (item) => {
    if (item.quantity > 1) {
      if (onUpdateQuantity) {
        onUpdateQuantity(item.cartId || item.id, item.quantity - 1, item.selectedSize);
      }
    } else {
      handleRemove(item);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white z-50 shadow-2xl transform transition-transform flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={24} />
            <h2 className="text-xl font-light tracking-widest">
              GIỎ HÀNG ({cart.length})
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 tracking-wide">Giỏ hàng trống</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                const itemKey = item.cartId || `${item.id}-${item.selectedSize || 'default'}`;
                
                return (
                  <div key={itemKey} className="flex gap-4 border-b pb-4">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">
                        {item.name}
                      </h3>
                      
                      {item.selectedSize && (
                        <p className="text-xs text-gray-600 mb-1">
                          Size: {item.selectedSize}
                        </p>
                      )}
                      
                      <p className="text-sm font-semibold text-red-600 mb-2">
                        {formatPrice(item.price)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrease(item)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition"
                        >
                          <Minus size={14} />
                        </button>
                        
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => handleIncrease(item)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition"
                        >
                          <Plus size={14} />
                        </button>

                        <button
                          onClick={() => handleRemove(item)}
                          className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p className="text-sm font-medium mt-1 text-gray-700">
                        Tổng: {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t p-6 bg-white flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg tracking-widest font-medium">TỔNG CỘNG:</span>
              <span className="text-2xl font-semibold tracking-wide text-red-600">
                {formatPrice(calculateTotal())}
              </span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full bg-black text-white py-4 tracking-widest hover:bg-gray-800 transition-colors rounded-lg font-medium"
            >
              THANH TOÁN
            </button>
            <button
              onClick={onClose}
              className="w-full mt-3 border-2 border-black text-black py-3 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Tiếp Tục Mua Sắm
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;