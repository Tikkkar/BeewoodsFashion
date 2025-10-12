import React, { useState, useEffect } from 'react';
import { testSupabaseConnection } from './lib/testConnection';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Edit3 } from 'lucide-react';
import { useEditor } from './hooks/useEditor';
import { useToast } from './hooks/useToast';
import { AuthProvider } from './hooks/useAuth'; // ⚡ THÊM DÒNG NÀY
// Layout Components
import TopBar from './components/layout/TopBar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import AboutPage from './pages/AboutPage';
import ReturnPolicyPage from './pages/ReturnPolicyPage';
import ShippingPolicyPage from './pages/ShippingPolicyPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PaymentPolicyPage from './pages/PaymentPolicyPage';
import TermsPage from './pages/TermsPage';
// AUTH PAGES
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
// Cart & Editor
import CartSidebar from './components/cart/CartSidebar';
import WishlistSidebar from './components/cart/WishlistSidebar';
import EditorPanel from './components/editor/EditorPanel';
import { ToastContainer } from './components/common/Toast';

function App() {
  // =============================================
  // TEST SUPABASE CONNECTION ON MOUNT
  // =============================================
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  // =============================================
  // EDITOR STATE (for brands/settings only - NOT products)
  // =============================================
  const { 
    data, 
    setData, 
    savedData,
    editMode, 
    previewMode,
    handleSave, 
    handleReset,
    toggleEditMode,
    togglePreviewMode,
    undo,
    redo,
    canUndo,
    canRedo,
    historyIndex,
    historyLength
  } = useEditor();
  
  // =============================================
  // TOAST NOTIFICATIONS
  // =============================================
  const { toasts, removeToast, success, error, warning } = useToast();

  // =============================================
  // UI STATE
  // =============================================
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); // ⚡ CHỈ DÙNG MỘT STATE
  const [wishlistOpen, setWishlistOpen] = useState(false); // ⚡ CHỈ DÙNG MỘT STATE

  // =============================================
  // CART STATE (localStorage)
  // =============================================
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('dior_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('dior_cart', JSON.stringify(cart));
  }, [cart]);

  // =============================================
  // WISHLIST STATE (localStorage)
  // =============================================
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem('dior_wishlist');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch {
      return [];
    }
  });

  // Save wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('dior_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Listen to wishlist changes
  useEffect(() => {
    const handleWishlistChange = () => {
      try {
        const savedWishlist = localStorage.getItem('dior_wishlist');
        setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
      } catch {
        setWishlist([]);
      }
    };

    window.addEventListener('storage', handleWishlistChange);
    window.addEventListener('wishlistUpdated', handleWishlistChange);

    return () => {
      window.removeEventListener('storage', handleWishlistChange);
      window.removeEventListener('wishlistUpdated', handleWishlistChange);
    };
  }, []);

  // =============================================
  // DISABLE SCROLL WHEN EDITOR IS OPEN
  // =============================================
  useEffect(() => {
    if (editMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [editMode]);

  // =============================================
  // CLOSE MENU ON DESKTOP RESIZE
  // =============================================
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================================
  // HANDLERS
  // =============================================

  // Save handler with toast
  const handleSaveWithToast = () => {
    const successResult = handleSave();
    if (successResult) {
      success('✅ Đã lưu thay đổi thành công!');
      return true;
    }
    error('❌ Có lỗi xảy ra khi lưu!');
    return false;
  };

  // ⚡ ADD TO CART - FIXED
  const handleAddToCart = (product, selectedSize = null) => {
    // Create unique cartId
    const cartId = `${product.id}-${selectedSize || 'default'}-${Date.now()}`;
    
    const cartItem = {
      id: product.id,
      cartId: cartId,
      name: product.name,
      price: product.price,
      image: product.image,
      selectedSize: selectedSize || product.sizes?.[0] || 'One Size',
      quantity: 1
    };

    setCart(prevCart => {
      // Check if product with same size already exists
      const existingItemIndex = prevCart.findIndex(
        item => item.id === product.id && item.selectedSize === cartItem.selectedSize
      );
      
      if (existingItemIndex > -1) {
        // Increase quantity if exists
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += 1;
        return updatedCart;
      }
      
      // Add new item
      return [...prevCart, cartItem];
    });
    
    success(`Đã thêm "${product.name}" vào giỏ hàng!`);
    setCartOpen(true); // Auto-open cart
  };

  // ⚡ REMOVE FROM CART - FIXED
  const handleRemoveFromCart = (itemId, selectedSize) => {
    setCart(prevCart => {
      // If itemId is cartId (contains '-')
      if (typeof itemId === 'string' && itemId.includes('-')) {
        return prevCart.filter(item => item.cartId !== itemId);
      }
      
      // If has selectedSize, remove by id + size
      if (selectedSize) {
        return prevCart.filter(
          item => !(item.id === itemId && item.selectedSize === selectedSize)
        );
      }
      
      // Fallback: remove by id
      return prevCart.filter(item => item.id !== itemId);
    });
  };

  // ⚡ UPDATE QUANTITY - NEW FUNCTION
  const handleUpdateQuantity = (itemId, newQuantity, selectedSize) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId, selectedSize);
      return;
    }

    setCart(prevCart => {
      return prevCart.map(item => {
        // Match by cartId
        if (item.cartId === itemId) {
          return { ...item, quantity: newQuantity };
        }
        
        // Match by id + size
        if (item.id === itemId && item.selectedSize === selectedSize) {
          return { ...item, quantity: newQuantity };
        }
        
        // Match by id only (fallback)
        if (item.id === itemId && !selectedSize) {
          return { ...item, quantity: newQuantity };
        }
        
        return item;
      });
    });
  };

  // Remove from wishlist handler
  const handleRemoveFromWishlist = (productId) => {
    const newWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(newWishlist);
    localStorage.setItem('dior_wishlist', JSON.stringify(newWishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  // Clear cart handler
  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem('dior_cart');
  };

  // Menu toggle
  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  // =============================================
  // RENDER
  // =============================================
  return (
    <Router>
       <AuthProvider> {/* ⚡ WRAP VỚI AuthProvider */}
      <div className="min-h-screen flex flex-col">
        
        {/* Editor Toggle Button */}
        {!editMode && (
          <button
            onClick={toggleEditMode}
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[99] p-3 md:p-4 bg-black text-white rounded-full shadow-2xl hover:bg-gray-800 transition hover:scale-110"
            aria-label="Open Editor"
          >
            <Edit3 size={20} className="md:w-6 md:h-6" />
          </button>
        )}

        {/* Editor Panel - FOR BRAND SETTINGS ONLY */}
        {editMode && (
          <EditorPanel
            data={data}
            setData={setData}
            onSave={handleSaveWithToast}
            onClose={toggleEditMode}
            onReset={handleReset}
            undo={undo}
            redo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            previewMode={previewMode}
            togglePreviewMode={togglePreviewMode}
            historyIndex={historyIndex}
            historyLength={historyLength}
          />
        )}

        {/* Top Bar */}
        <TopBar message={data.topBarMessage} />
        
        {/* Header */}
        <Header
          brandName={data.brand.name}
          cart={cart}
          wishlist={wishlist}
          menuOpen={menuOpen}
          onMenuToggle={handleMenuToggle}
          onCartClick={() => setCartOpen(true)}
          onWishlistClick={() => setWishlistOpen(true)}
          navigation={data.navigation}
        />

        {/* Main Routes */}
        <Routes>
          {/* Home Page - NOW USES SUPABASE */}
          <Route 
            path="/" 
            element={
              <HomePage 
                onAddToCart={handleAddToCart}
              />
            } 
          />

          {/* All Products Page - NOW USES SUPABASE */}
          <Route 
            path="/products" 
            element={
              <ProductsPage 
                onAddToCart={handleAddToCart}
                wishlist={wishlist}
              />
            } 
          />

          {/* Category Page - NOW USES SUPABASE */}
          <Route 
            path="/category/:slug" 
            element={
              <ProductsPage 
                onAddToCart={handleAddToCart}
                wishlist={wishlist}
              />
            } 
          />

          {/* Product Detail Page - NOW USES SUPABASE */}
          <Route 
            path="/product/:slug" 
            element={
              <ProductDetailPage 
                onAddToCart={handleAddToCart}
                brand={data.brand}
                wishlist={wishlist}
              />
            } 
          />

          {/* Checkout Page */}
          <Route 
            path="/checkout" 
            element={
              <CheckoutPage 
                cart={cart}
                onClearCart={handleClearCart}
              />
            } 
          />

          {/* Order Success Page */}
          <Route 
            path="/checkout/success" 
            element={<OrderSuccessPage />} 
          />
           {/* Protected Route Example */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex items-center justify-center">
                    <h1 className="text-2xl">Profile Page (Protected)</h1>
                  </div>
                </ProtectedRoute>
              } 
            />
            {/* Admin Route Example */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen flex items-center justify-center">
                    <h1 className="text-2xl">Admin Dashboard (Admin Only)</h1>
                  </div>
                </ProtectedRoute>
              } 
            />
          {/* Policy Pages - Keep using data from editor */}
          <Route path="/about" element={<AboutPage brand={data.brand} />} />
          <Route path="/return-policy" element={<ReturnPolicyPage brand={data.brand} />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage brand={data.brand} />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage brand={data.brand} />} />
          <Route path="/payment-policy" element={<PaymentPolicyPage brand={data.brand} />} />
          <Route path="/terms" element={<TermsPage brand={data.brand} />} />
          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>

        {/* Footer */}
        <Footer 
          brand={data.brand} 
          sections={data.footerSections} 
        />

        {/* Cart Sidebar */}
        <CartSidebar
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          cart={cart}
          onRemoveItem={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
        />

        {/* Wishlist Sidebar */}
        <WishlistSidebar
          isOpen={wishlistOpen}
          onClose={() => setWishlistOpen(false)}
          wishlist={wishlist}
          onRemoveItem={handleRemoveFromWishlist}
          onAddToCart={handleAddToCart}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
       </AuthProvider>
    </Router>
  );
}

export default App;