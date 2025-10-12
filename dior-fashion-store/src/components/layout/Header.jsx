import React, { useState } from 'react';
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../lib/api/auth';

const Header = ({ 
  brandName, 
  cart, 
  wishlist, 
  onCartClick, 
  onWishlistClick,
  navigation 
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Mobile Menu + Search */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Center: Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold tracking-widest uppercase">
              {brandName}
            </h1>
          </Link>

          {/* Right: Icons */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition"
              title="Tìm kiếm"
            >
              <Search size={20} />
            </button>

            {/* ⚡ LOGIN/PROFILE DROPDOWN */}
            {isAuthenticated ? (
              <div className="relative group">
                <button 
                  className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition"
                  title={user?.email}
                >
                  <User size={20} />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {/* User Info */}
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium truncate text-gray-900">
                      {user?.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <User size={16} />
                      Tài khoản
                    </Link>
                    
                    <Link
                      to="/profile/orders"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <ShoppingCart size={16} />
                      Đơn hàng của tôi
                    </Link>

                    <Link
                      to="/profile/wishlist"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Heart size={16} />
                      Danh sách yêu thích
                    </Link>
                  </div>

                  {/* Admin Link (if admin) */}
                  {isAdmin && (
                    <div className="border-t border-gray-100 py-2">
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    </div>
                  )}

                  {/* Logout */}
                  <div className="border-t border-gray-100 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition"
                title="Đăng nhập"
              >
                <User size={20} />
              </Link>
            )}

            {/* Wishlist */}
            <button
              onClick={onWishlistClick}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition"
              title="Yêu thích"
            >
              <Heart size={20} />
              {wishlist?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition"
              title="Giỏ hàng"
            >
              <ShoppingCart size={20} />
              {cart?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center gap-8 pb-4 border-t border-gray-100 pt-4">
          {navigation?.map((item, index) => (
            item.submenu && item.submenu.length > 0 ? (
              <div key={index} className="relative group pb-2">
                <span className="flex items-center gap-1 cursor-pointer text-sm font-medium text-gray-700 hover:text-black transition tracking-wide uppercase">
                  {item.text}
                  <ChevronDown size={16} className="transition-transform group-hover:rotate-180" />
                </span>
                
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    {item.submenu.map((submenu, subIndex) => (
                      <Link
                        key={subIndex}
                        to={submenu.url}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition"
                      >
                        {submenu.text}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={index}
                to={item.url}
                className="text-sm font-medium text-gray-700 hover:text-black transition tracking-wide uppercase"
              >
                {item.text}
              </Link>
            )
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
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              >
                <Search size={20} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col py-2">
            {/* Navigation Links */}
            {navigation?.map((item, index) => (
              <Link
                key={index}
                to={item.url}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition uppercase tracking-wide"
              >
                {item.text}
              </Link>
            ))}

            {/* Mobile Auth Section */}
            <div className="border-t border-gray-100 mt-2 pt-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-xs text-gray-500">
                    {user?.email}
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <User size={16} />
                    Tài khoản
                  </Link>
                  <Link
                    to="/profile/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <ShoppingCart size={16} />
                    Đơn hàng
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 transition flex items-center gap-2"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <User size={16} />
                  Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;