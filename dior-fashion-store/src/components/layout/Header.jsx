import React, { useState } from 'react';
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown } from 'lucide-react';
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
      navigate(`/products?search=${searchQuery}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Phần code trên từ Center: Logo trở lên giữ nguyên, không cần thay đổi */}
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
                <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition"
                >
                <Search size={20} />
                </button>
                <Link to="/login" className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition">
                <User size={20} />
                </Link>
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

        {/* Desktop Navigation - ĐÂY LÀ PHẦN THAY ĐỔI */}
        <nav className="hidden md:flex items-center justify-center gap-8 pb-4 border-t border-gray-100 pt-4">
  {navigation?.map((item, index) => (
    item.submenu && item.submenu.length > 0 ? (
      // Thêm pb-2 (padding-bottom) để mở rộng vùng hover xuống dưới
      <div key={index} className="relative group pb-2">
        <span className="flex items-center gap-1 cursor-pointer text-sm font-medium text-gray-700 hover:text-black transition tracking-wide uppercase">
          {item.text}
          <ChevronDown size={16} className="transition-transform group-hover:rotate-180" />
        </span>
        
        {/* Xóa mt-2 và thêm pt-2 để tạo khoảng đệm an toàn */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-opacity duration-300">
          <div className="py-2">
            {item.submenu.map((submenu, subIndex) => (
              <Link
                key={subIndex}
                to={submenu.url}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black"
              >
                {submenu.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    ) : (
      // Link bình thường không thay đổi
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

        {/* Phần Search Bar và Mobile Menu giữ nguyên */}
        {searchOpen && (
            <div className="py-3 border-t border-gray-100">
            {/* ... code form search ... */}
            </div>
        )}
      </div>

        {/* Mobile Menu (Lưu ý: phần này cần logic state để hoạt động, phức tạp hơn) */}
        {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
                <nav className="flex flex-col py-2">
                    {/* Tạm thời mobile menu vẫn hiển thị link cha, chưa có submenu */}
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