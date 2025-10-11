import React, { useState } from 'react';
import { Search, ShoppingCart, Heart, User, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${searchQuery}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
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
            {/* Desktop Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Search size={20} />
            </button>

            {/* User */}
            <Link to="/login" className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition">
              <User size={20} />
            </Link>

            {/* Wishlist */}
            <button
              onClick={onWishlistClick}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition"
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
            <Link
              key={index}
              to={`/category/${item.toLowerCase()}`}
              className="text-sm font-medium text-gray-700 hover:text-black transition tracking-wide uppercase"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* Search Bar (Expanded) */}
        {searchOpen && (
          <div className="py-3 border-t border-gray-100">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition"
              >
                <Search size={18} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col py-2">
            {navigation?.map((item, index) => (
              <Link
                key={index}
                to={`/category/${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition uppercase tracking-wide"
              >
                {item}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition border-t border-gray-100"
            >
              Đăng nhập / Đăng ký
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;