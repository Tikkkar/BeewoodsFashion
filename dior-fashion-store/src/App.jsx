import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Edit3 } from 'lucide-react';
import { useEditor } from './hooks/useEditor';
import { useToast } from './hooks/useToast';

// Layout Components
import TopBar from './components/layout/TopBar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';

// Cart & Editor
import CartSidebar from './components/cart/CartSidebar';
import WishlistSidebar from './components/cart/WishlistSidebar';
import EditorPanel from './components/editor/EditorPanel';
import { ToastContainer } from './components/common/Toast';

function App() {
  // Editor state - NOW WITH UNDO/REDO & PREVIEW
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
  
  // Toast notifications
  const { toasts, removeToast, success, error, warning } = useToast();

  // UI State
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  // Cart State (with localStorage)
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('dior_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  // Wishlist State - Used in Header for badge count
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem('dior_wishlist');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch {
      return [];
    }
  });

  // Listen to wishlist changes from other components
  useEffect(() => {
    const handleWishlistChange = () => {
      try {
        const savedWishlist = localStorage.getItem('dior_wishlist');
        setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
      } catch {
        setWishlist([]);
      }
    };

    // Listen to storage events
    window.addEventListener('storage', handleWishlistChange);
    
    // Custom event for same-tab updates
    window.addEventListener('wishlistUpdated', handleWishlistChange);

    return () => {
      window.removeEventListener('storage', handleWishlistChange);
      window.removeEventListener('wishlistUpdated', handleWishlistChange);
    };
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('dior_cart', JSON.stringify(cart));
  }, [cart]);

  // Disable scroll when editor is open
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

  // Close menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced Save Handler with Toast notification
  const handleSaveWithToast = () => {
    const success = handleSave();
    if (success) {
      // Use your custom toast instead of alert
      return true;
    }
    return false;
  };

  // Add to cart handler
  const handleAddToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    
    success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  // Remove from cart handler
  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
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

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Editor Toggle Button - Hide when editor is open */}
        {!editMode && (
          <button
            onClick={toggleEditMode}
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[99] p-3 md:p-4 bg-black text-white rounded-full shadow-2xl hover:bg-gray-800 transition hover:scale-110"
            aria-label="Open Editor"
          >
            <Edit3 size={20} className="md:w-6 md:h-6" />
          </button>
        )}

        {/* Editor Panel - NOW WITH UNDO/REDO & PREVIEW */}
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

        {/* Website Content - Use live data for preview */}
        <TopBar message={data.topBarMessage} />
        
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

        {/* Routes */}
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                data={data}
                currentSlide={currentSlide}
                setCurrentSlide={setCurrentSlide}
                onAddToCart={handleAddToCart}
              />
            } 
          />
          <Route 
            path="/product/:id" 
            element={
              <ProductDetailPage 
                products={data.products}
                onAddToCart={handleAddToCart}
              />
            } 
          />
          <Route 
            path="/checkout" 
            element={
              <CheckoutPage 
                cart={cart}
                onClearCart={handleClearCart}
              />
            } 
          />
          <Route 
            path="/checkout/success" 
            element={<OrderSuccessPage />} 
          />
        </Routes>

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
    </Router>
  );
}

export default App;