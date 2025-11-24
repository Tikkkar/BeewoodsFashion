import React, { useState, useCallback, useMemo, memo } from 'react';
import { Search, ShoppingCart, User, Menu, X, ChevronDown, ChevronRight, LogOut, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRBAC } from '../../hooks/useRBAC';

/**
 * Recursive Nav Item Component for nested submenus
 * Memoized to prevent unnecessary re-renders
 */
const RecursiveNavItem = memo(({ item }) => {
  return (
    <li className="relative group/sub">
      <Link
        to={item.url}
        className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition rounded-md"
      >
        <span>{item.text}</span>
        {item.submenu && <ChevronRight size={16} />}
      </Link>

      {/* Nested submenu */}
      {item.submenu && (
        <ul className="absolute top-0 left-full ml-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 z-20">
          {item.submenu.map((subItem, subIndex) => (
            <RecursiveNavItem key={subIndex} item={subItem} />
          ))}
        </ul>
      )}
    </li>
  );
});

RecursiveNavItem.displayName = 'RecursiveNavItem';

/**
 * User Menu Component - Extracted for better organization
 */
const UserMenu = memo(({ user, isAdmin, userRole, handleLogout }) => {
  return (
    <div className="relative group">
      <button
        className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition"
        title={user?.email}
        aria-label="User menu"
      >
        <User size={20} />
      </button>
      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
        <div className="p-3 border-b border-gray-100">
          <p className="text-sm font-medium truncate text-gray-900">
            {user?.user_metadata?.full_name || 'User'}
          </p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <div className="py-2">
          <Link
            to="/profile"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <User size={16} />Tài khoản
          </Link>
          <Link
            to="/profile/orders"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <ShoppingCart size={16} />Đơn hàng của tôi
          </Link>
        </div>

        {/* Admin Dashboard Link */}
        {isAdmin && (
          <div className="border-t border-gray-100 py-2">
            <Link
              to="/admin"
              className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition font-medium"
            >
              <LayoutDashboard size={16} />Admin Dashboard
            </Link>
          </div>
        )}

        {/* Employee Dashboard Link */}
        {(userRole === 'sale' || userRole === 'warehouse') && (
          <div className="border-t border-gray-100 py-2">
            <Link
              to={userRole === 'sale' ? '/employee/sale' : '/employee/warehouse'}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition font-medium"
            >
              <LayoutDashboard size={16} />Dashboard Nhân viên
            </Link>
          </div>
        )}

        <div className="border-t border-gray-100 py-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={16} />Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
});

UserMenu.displayName = 'UserMenu';

/**
 * Mobile Menu Item Component
 */
const MobileMenuItem = memo(({ item, index, expandedMobile, toggleMobileSubmenu, closeMobileMenu }) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          to={item.url}
          onClick={() => !item.submenu && closeMobileMenu()}
          className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition uppercase tracking-wide"
        >
          {item.text}
        </Link>
        {item.submenu && (
          <button
            onClick={() => toggleMobileSubmenu(index)}
            className="px-4 py-3 text-gray-700 hover:bg-gray-50"
            aria-label={`Toggle ${item.text} submenu`}
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${expandedMobile[index] ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Mobile Submenu */}
      {item.submenu && expandedMobile[index] && (
        <div className="bg-gray-50 border-t border-gray-200">
          {item.submenu.map((subItem, subIndex) => (
            <Link
              key={subIndex}
              to={subItem.url}
              onClick={closeMobileMenu}
              className="block px-8 py-2 text-sm text-gray-600 hover:bg-gray-100 transition"
            >
              {subItem.text}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});

MobileMenuItem.displayName = 'MobileMenuItem';

/**
 * Main Header Component - Optimized
 */
const Header = ({
  brandName = "BEWO",
  cart = [],
  onCartClick,
  navigation = []
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMobile, setExpandedMobile] = useState({});

  const { user, isAuthenticated, isAdmin, userRole, logout } = useRBAC();
  const navigate = useNavigate();

  // Memoize handlers
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery.trim()}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }, [searchQuery, navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      // Ignore logout errors, just redirect
      console.log('Logout completed');
      navigate('/');
    }
  }, [logout, navigate]);

  const toggleMobileSubmenu = useCallback((index) => {
    setExpandedMobile(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setSearchOpen(prev => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const handleCartClick = useCallback(() => {
    onCartClick?.();
  }, [onCartClick]);

  // Memoize navigation data
  const demoNavigation = useMemo(() => [
    { text: 'Về BeeWo', url: '/about' },
    { text: 'Bộ Sưu Tập', url: '/products' },
    { text: 'Tất Cả Sản Phẩm', url: '/products' },
    { text: 'Ưu Đãi Độc Quyền', url: '/sale' },
  ], []);

  const navData = useMemo(() =>
    navigation.length > 0 ? navigation : demoNavigation,
    [navigation, demoNavigation]
  );

  // Memoize cart count
  const cartCount = useMemo(() => cart?.length || 0, [cart?.length]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left Side - Mobile Menu & Brand Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className="p-2 hover:bg-gray-100 rounded-lg transition md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Brand Name */}
            <Link to="/" className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold tracking-widest uppercase">
                {brandName}
              </h1>
            </Link>
          </div>

          {/* Center - Logo Image (Optimized) */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center"
            aria-label="Home"
          >
            <img
              src="https://image2url.com/images/1762405291178-3c948423-ae0b-4be5-8d85-ab843865c994.png"
              alt={`${brandName} Logo`}
              className="h-10 md:h-14 w-auto object-contain"
              width="70"
              height="70"
              loading="eager"
              fetchpriority="high"
            />
          </Link>

          {/* Right Side - Icons */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search Button */}
            <button
              onClick={toggleSearch}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Tìm kiếm"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <UserMenu
                user={user}
                isAdmin={isAdmin}
                userRole={userRole}
                handleLogout={handleLogout}
              />
            ) : (
              <Link
                to="/login"
                className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition"
                title="Đăng nhập"
                aria-label="Login"
              >
                <User size={20} />
              </Link>
            )}

            {/* Cart Button */}
            <button
              onClick={handleCartClick}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition"
              title="Giỏ hàng"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center gap-8 pb-4 border-t border-gray-100 pt-4">
          {navData.map((item, index) => (
            <div key={index} className="relative group">
              <Link
                to={item.url}
                className="flex items-center gap-1 cursor-pointer text-sm font-medium text-gray-700 hover:text-black transition tracking-wide uppercase"
              >
                {item.text}
                {item.submenu && (
                  <ChevronDown
                    size={16}
                    className="transition-transform group-hover:rotate-180"
                  />
                )}
              </Link>

              {/* First Level Submenu */}
              {item.submenu && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <ul className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                    {item.submenu.map((subItem, subIndex) => (
                      <RecursiveNavItem key={subIndex} item={subItem} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Search Bar */}
        {searchOpen && (
          <div className="py-3 border-t border-gray-100">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                autoFocus
                aria-label="Search products"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                aria-label="Submit search"
              >
                <Search size={20} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col py-2">
            {navData.map((item, index) => (
              <MobileMenuItem
                key={index}
                item={item}
                index={index}
                expandedMobile={expandedMobile}
                toggleMobileSubmenu={toggleMobileSubmenu}
                closeMobileMenu={closeMobileMenu}
              />
            ))}

            <div className="border-t border-gray-100 mt-2 pt-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-xs text-gray-500 truncate">
                    {user?.email}
                  </div>
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <User size={16} />Tài khoản
                  </Link>
                  <Link
                    to="/profile/orders"
                    onClick={closeMobileMenu}
                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <ShoppingCart size={16} />Đơn hàng
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={closeMobileMenu}
                      className="px-4 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 transition flex items-center gap-2"
                    >
                      <LayoutDashboard size={16} />Admin Dashboard
                    </Link>
                  )}

                  {/* Employee Dashboard Link Mobile */}
                  {(userRole === 'sale' || userRole === 'warehouse') && (
                    <Link
                      to={userRole === 'sale' ? '/employee/sale' : '/employee/warehouse'}
                      onClick={closeMobileMenu}
                      className="px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition flex items-center gap-2"
                    >
                      <LayoutDashboard size={16} />Dashboard Nhân viên
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                  >
                    <LogOut size={16} />Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <User size={16} />Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

// Memoize entire Header component
export default memo(Header, (prevProps, nextProps) => {
  // Only re-render if these props actually changed
  return (
    prevProps.brandName === nextProps.brandName &&
    prevProps.cart?.length === nextProps.cart?.length &&
    prevProps.navigation === nextProps.navigation &&
    prevProps.onCartClick === nextProps.onCartClick
  );
});