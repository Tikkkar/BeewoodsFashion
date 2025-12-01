import React, { useState, useEffect, lazy, Suspense } from "react";
import { lazyRetry } from "./utils/lazyRetry";
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

// ✅ Import ScrollToTop component
import ScrollToTop from "./components/common/ScrollToTop";

// ✅ Import dữ liệu tĩnh
import { brandData } from "./data";

// =============================================
// ✅ CRITICAL: Import ngay (Above the fold)
// =============================================
import TopBar from "./components/layout/TopBar";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import CartSidebar from "./components/cart/CartSidebar";
import WishlistSidebar from "./components/cart/WishlistSidebar";
import { ToastContainer } from "./components/common/Toast";

// =============================================
// ✅ LAZY LOAD: Routes không critical
// =============================================
const HomePage = lazy(() => import("./pages/HomePage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/OrderSuccessPage"));
const WeddingPage = lazy(() => import("./pages/WeddingPage"));

// Policy pages - lazy
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ReturnPolicyPage = lazy(() => import("./pages/ReturnPolicyPage"));
const ShippingPolicyPage = lazy(() => import("./pages/ShippingPolicyPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const PaymentPolicyPage = lazy(() => import("./pages/PaymentPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));

// Auth pages
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ProtectedRoute = lazy(() => import("./components/auth/ProtectedRoute"));
const RoleBasedRoute = lazy(() => import("./components/auth/RoleBasedRoute"));

// Admin pages - Heavy, nên lazy load

const AdminLayout = lazyRetry(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazyRetry(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazyRetry(() => import("./pages/admin/AdminProducts"));
const AdminProductForm = lazyRetry(() => import("./pages/admin/AdminProductForm"));
const AdminCategories = lazyRetry(() => import("./pages/admin/AdminCategories"));
const AdminBanners = lazyRetry(() => import("./pages/admin/AdminBanners"));
const AdminOrders = lazyRetry(() => import("./pages/admin/AdminOrders"));
const AdminOrderDetail = lazyRetry(() => import("./pages/admin/AdminOrderDetail"));
const AdminShipments = lazyRetry(() => import("./pages/admin/AdminShipments"));
const SEOManagerPage = lazyRetry(() => import("./pages/admin/SEOManager"));
const AdminAnalytics = lazyRetry(() => import("./pages/admin/AdminAnalytics"));
const FacebookSettingsPage = lazyRetry(() => import("./pages/admin/chatbot/FacebookSettingsPage"));
const ConversationsPage = lazyRetry(() => import("./pages/admin/chatbot/ConversationsPage"));
const ScenariosTab = lazyRetry(() => import("./pages/admin/chatbot/ScenariosTab"));
const FacebookPostsPage = lazyRetry(() => import("./pages/admin/chatbot/FacebookPostsPage"));
const AdminFeedbackManagement = lazyRetry(() => import("./components/admin/AdminFeedbackManagement"));
const FacebookAutoPostSettings = lazyRetry(() => import("./pages/admin/FacebookAutoPostSettings"));
const FacebookPostsHistory = lazyRetry(() => import("./pages/admin/FacebookPostsHistory"));
const InventoryManagement = lazyRetry(() => import("./pages/admin/InventoryManagement"));
const AdTargeting = lazyRetry(() => import("./pages/admin/AdTargeting"));
const EmployeeManagement = lazyRetry(() => import("./pages/admin/EmployeeManagement"));

// Employee pages
const SaleDashboard = lazy(() => import("./pages/employee/SaleDashboard"));
const WarehouseDashboard = lazy(() => import("./pages/employee/WarehouseDashboard"));

// User pages
const ProfileLayout = lazy(() => import("./pages/user/ProfileLayout"));
const ProfilePage = lazy(() => import("./pages/user/ProfilePage"));
const OrderHistoryPage = lazy(() => import("./pages/user/OrderHistoryPage"));
const OrderDetailPage = lazy(() => import("./pages/user/OrderDetailPage"));
const AddressesPage = lazy(() => import("./pages/user/AddressesPage"));
const WishlistPage = lazy(() => import("./pages/user/WishlistPage"));

// ChatWidget - Load sau 3s
const ChatWidget = lazy(() =>
  new Promise(resolve => {
    setTimeout(() => resolve(import("./components/chatbot/ChatWidget")), 3000);
  })
);

// =============================================
// ✅ LOADING FALLBACK
// =============================================
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

// =============================================
// ✅ APP CONTENT WRAPPER
// =============================================
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
  const isWeddingPage = location.pathname === "/wedding";

  return (
    <>
      {/* ✅ CRITICAL: ScrollToTop - Must be inside Router */}
      <ScrollToTop />

      {/* ✅ ChatWidget - Lazy loaded */}
      {!isAdminRoute && !isWeddingPage && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}

      <div className="min-h-screen flex flex-col">
        {/* Top Bar */}
        {!isAdminRoute && !isWeddingPage && <TopBar message={brandData.topBarMessage} />}

        {/* Header */}
        {!isAdminRoute && !isWeddingPage && (
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

        {/* Main Routes - Wrapped in Suspense */}
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* PUBLIC ROUTES */}
              <Route
                path="/"
                element={<HomePage onAddToCart={handleAddToCart} />}
              />

              <Route
                path="/wedding"
                element={<WeddingPage />}
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

              {/* POLICY PAGES */}
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

              {/* AUTH ROUTES */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* USER PROFILE ROUTES */}
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

              {/* EMPLOYEE ROUTES */}
              <Route
                path="/employee/sale"
                element={
                  <RoleBasedRoute allowedRoles={['sale']}>
                    <SaleDashboard />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/employee/warehouse"
                element={
                  <RoleBasedRoute allowedRoles={['warehouse']}>
                    <WarehouseDashboard />
                  </RoleBasedRoute>
                }
              />

              {/* ADMIN ROUTES */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'sale', 'warehouse']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="ad-targeting" element={<AdTargeting />} />
                <Route path="feedbacks" element={<AdminFeedbackManagement />} />
                <Route path="facebook-settings" element={<FacebookAutoPostSettings />} />
                <Route path="facebook-posts" element={<FacebookPostsPage />} />
                <Route path="facebook-posts-history" element={<FacebookPostsHistory />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route path="products/:id" element={<AdminProductForm />} />
                <Route path="seo-manager" element={<SEOManagerPage />} />
                <Route path="inventory" element={<InventoryManagement />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} />
                <Route path="shipments" element={<AdminShipments />} />
                <Route path="employees" element={<EmployeeManagement />} />
                <Route path="chatbot/facebook" element={<FacebookSettingsPage />} />
                <Route path="chatbot/conversations" element={<ConversationsPage />} />
                <Route path="chatbot/scenarios" element={<ScenariosTab />} />
              </Route>

              {/* 404 */}
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
          </Suspense>
        </main>

        {/* Footer */}
        {!isAdminRoute && !isWeddingPage && (
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

// =============================================
// ✅ MAIN APP
// =============================================
function App() {
  const { toasts, removeToast, success } = useToast();

  // UI STATE
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  // CART STATE
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

  // WISHLIST STATE
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

  // HANDLERS
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
