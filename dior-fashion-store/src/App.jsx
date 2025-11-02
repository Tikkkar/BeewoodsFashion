import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { useToast } from "./hooks/useToast";

// ✨ Dữ liệu tĩnh giờ được import từ một file riêng
import { brandData } from "./data";

// Layout Components
import TopBar from "./components/layout/TopBar";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import AboutPage from "./pages/AboutPage";
import ReturnPolicyPage from "./pages/ReturnPolicyPage";
import ShippingPolicyPage from "./pages/ShippingPolicyPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import PaymentPolicyPage from "./pages/PaymentPolicyPage";
import TermsPage from "./pages/TermsPage";
import CareersPage from "./pages/CareersPage";
import ChatWidget from "./components/chatbot/ChatWidget";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdTargeting from "./pages/admin/AdTargeting";
// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import SEOManagerPage from "./pages/admin/SEOManager";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import FacebookSettingsPage from "./pages/admin/chatbot/FacebookSettingsPage";
import ConversationsPage from "./pages/admin/chatbot/ConversationsPage";
import ScenariosTab from "./pages/admin/chatbot/ScenariosTab";
// User Pages
import ProfileLayout from "./pages/user/ProfileLayout";
import ProfilePage from "./pages/user/ProfilePage";
import OrderHistoryPage from "./pages/user/OrderHistoryPage";
import OrderDetailPage from "./pages/user/OrderDetailPage";
import AddressesPage from "./pages/user/AddressesPage";
import WishlistPage from "./pages/user/WishlistPage";

// Cart Components
import CartSidebar from "./components/cart/CartSidebar";
import WishlistSidebar from "./components/cart/WishlistSidebar";
import { ToastContainer } from "./components/common/Toast";

// ✅ NEW: Wrapper component that uses useLocation
function AppContent({
  cart,
  wishlist,
  menuOpen,
  setMenuOpen,
  cartOpen,
  setCartOpen,
  wishlistOpen,
  setWishlistOpen,
  handleAddToCart,
  handleRemoveFromCart,
  handleUpdateQuantity,
  handleRemoveFromWishlist,
  handleClearCart,
  toasts,
  removeToast,
}) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {/* ✅ FIXED: Only show ChatWidget on non-admin routes */}
      {!isAdminRoute && <ChatWidget />}

      <div className="min-h-screen flex flex-col">
        {/* Top Bar - Hide in admin */}
        {!isAdminRoute && <TopBar message={brandData.topBarMessage} />}

        {/* Header - Hide in admin */}
        {!isAdminRoute && (
          <Header
            brandName={brandData.brand.name}
            cart={cart}
            wishlist={wishlist}
            menuOpen={menuOpen}
            onMenuToggle={() => setMenuOpen(!menuOpen)}
            onCartClick={() => setCartOpen(true)}
            onWishlistClick={() => setWishlistOpen(true)}
            navigation={brandData.navigation}
          />
        )}

        {/* Main Routes */}
        <main className="flex-1">
          <Routes>
            {/* =============================================
                PUBLIC ROUTES
                ============================================= */}
            <Route
              path="/"
              element={<HomePage onAddToCart={handleAddToCart} />}
            />

            <Route
              path="/products"
              element={
                <ProductsPage
                  onAddToCart={handleAddToCart}
                  wishlist={wishlist}
                />
              }
            />

            <Route
              path="/category/:slug"
              element={
                <ProductsPage
                  onAddToCart={handleAddToCart}
                  wishlist={wishlist}
                />
              }
            />

            <Route
              path="/product/:slug"
              element={
                <ProductDetailPage
                  onAddToCart={handleAddToCart}
                  brand={brandData.brand}
                  wishlist={wishlist}
                />
              }
            />

            <Route
              path="/checkout"
              element={
                <CheckoutPage cart={cart} onClearCart={handleClearCart} />
              }
            />

            <Route path="/checkout/success" element={<OrderSuccessPage />} />

            {/* =============================================
                POLICY PAGES
                ============================================= */}
            <Route
              path="/about"
              element={<AboutPage brand={brandData.brand} />}
            />
            <Route
              path="/return-policy"
              element={<ReturnPolicyPage brand={brandData.brand} />}
            />
            <Route
              path="/shipping-policy"
              element={<ShippingPolicyPage brand={brandData.brand} />}
            />
            <Route
              path="/privacy-policy"
              element={<PrivacyPolicyPage brand={brandData.brand} />}
            />
            <Route
              path="/payment-policy"
              element={<PaymentPolicyPage brand={brandData.brand} />}
            />
            <Route
              path="/terms"
              element={<TermsPage brand={brandData.brand} />}
            />
            <Route path="/careers" element={<CareersPage />} />
            {/* =============================================
                AUTH ROUTES
                ============================================= */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* =============================================
                USER PROFILE ROUTES
                ============================================= */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProfilePage />} />
              <Route path="orders" element={<OrderHistoryPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
              <Route path="addresses" element={<AddressesPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
            </Route>

            {/* =============================================
                ADMIN ROUTES
                ============================================= */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="ad-targeting" element={<AdTargeting />} />
              {/* Products */}
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductForm />} />
              <Route path="products/:id" element={<AdminProductForm />} />
              <Route path="/admin/seo-manager" element={<SEOManagerPage />} />
              {/* Categories */}
              <Route path="categories" element={<AdminCategories />} />

              {/* Banners */}
              <Route path="banners" element={<AdminBanners />} />

              {/* Orders */}
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              {/* Facebook Settings for Chatbot */}
              <Route
                path="chatbot/facebook"
                element={<FacebookSettingsPage />}
              />
              <Route
                path="chatbot/conversations"
                element={<ConversationsPage />}
              />
              <Route path="chatbot/scenarios" element={<ScenariosTab />} />
            </Route>

            {/* =============================================
                404 NOT FOUND
                ============================================= */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404</h1>
                    <p className="text-gray-600 mb-4">Page not found</p>
                    <Link to="/" className="text-blue-600 hover:underline">
                      Back to Home
                    </Link>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>

        {/* Footer - Hide in admin */}
        {!isAdminRoute && (
          <Footer brand={brandData.brand} sections={brandData.footerSections} />
        )}

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
    </>
  );
}

function App() {

  // =============================================
  // TOAST NOTIFICATIONS
  // =============================================
  const { toasts, removeToast, success } = useToast();

  // =============================================
  // UI STATE
  // =============================================
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  // =============================================
  // CART STATE
  // =============================================
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("bewo_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("bewo_cart", JSON.stringify(cart));
  }, [cart]);

  // =============================================
  // WISHLIST STATE
  // =============================================
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem("bewo_wishlist");
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("bewo_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const handleWishlistChange = () => {
      try {
        const savedWishlist = localStorage.getItem("bewo_wishlist");
        setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
      } catch {
        setWishlist([]);
      }
    };

    window.addEventListener("storage", handleWishlistChange);
    window.addEventListener("wishlistUpdated", handleWishlistChange);

    return () => {
      window.removeEventListener("storage", handleWishlistChange);
      window.removeEventListener("wishlistUpdated", handleWishlistChange);
    };
  }, []);

  // =============================================
  // HANDLERS
  // =============================================
  const handleAddToCart = (product, selectedSize = null) => {
    const cartId = `${product.id}-${selectedSize || "default"}-${Date.now()}`;

    const cartItem = {
      id: product.id,
      cartId: cartId,
      name: product.name,
      price: product.price,
      imagePrimary: product.imagePrimary,
      selectedSize: selectedSize || product.sizes?.[0] || "One Size",
      quantity: 1,
    };

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) =>
          item.id === product.id && item.selectedSize === cartItem.selectedSize
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += 1;
        return updatedCart;
      }

      return [...prevCart, cartItem];
    });

    success(`Đã thêm "${product.name}" vào giỏ hàng!`);
    setCartOpen(true);
  };

  const handleRemoveFromCart = (itemId, selectedSize) => {
    setCart((prevCart) => {
      if (typeof itemId === "string" && itemId.includes("-")) {
        return prevCart.filter((item) => item.cartId !== itemId);
      }

      if (selectedSize) {
        return prevCart.filter(
          (item) => !(item.id === itemId && item.selectedSize === selectedSize)
        );
      }

      return prevCart.filter((item) => item.id !== itemId);
    });
  };

  const handleUpdateQuantity = (itemId, newQuantity, selectedSize) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId, selectedSize);
      return;
    }

    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.cartId === itemId) {
          return { ...item, quantity: newQuantity };
        }

        if (item.id === itemId && item.selectedSize === selectedSize) {
          return { ...item, quantity: newQuantity };
        }

        if (item.id === itemId && !selectedSize) {
          return { ...item, quantity: newQuantity };
        }

        return item;
      });
    });
  };

  const handleRemoveFromWishlist = (productId) => {
    const newWishlist = wishlist.filter((item) => item.id !== productId);
    setWishlist(newWishlist);
    localStorage.setItem("bewo_wishlist", JSON.stringify(newWishlist));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem("bewo_cart");
  };

  // =============================================
  // RENDER
  // =============================================
  return (
    <Router>
      <AuthProvider>
        <AppContent
          cart={cart}
          wishlist={wishlist}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          cartOpen={cartOpen}
          setCartOpen={setCartOpen}
          wishlistOpen={wishlistOpen}
          setWishlistOpen={setWishlistOpen}
          handleAddToCart={handleAddToCart}
          handleRemoveFromCart={handleRemoveFromCart}
          handleUpdateQuantity={handleUpdateQuantity}
          handleRemoveFromWishlist={handleRemoveFromWishlist}
          handleClearCart={handleClearCart}
          toasts={toasts}
          removeToast={removeToast}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
