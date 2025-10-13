import React from 'react';
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // <-- ĐÃ THÊM: Import useAuth hook

/**
 * Recursive Nav Item Component for nested submenus
 */
const RecursiveNavItem = ({ item }) => {
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
};

const Header = ({ 
  brandName = "BeeWo", 
  cart = [], 
  wishlist = [], 
  onCartClick = () => {}, 
  onWishlistClick = () => {},
  navigation = [] 
}) => {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedMobile, setExpandedMobile] = React.useState({});
  
  // --- SỬA LỖI ---
  // Lấy trạng thái đăng nhập thật từ useAuth hook thay vì dùng mock data
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  // --- HẾT SỬA LỖI ---

  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Search:', searchQuery);
      navigate(`/products?search=${searchQuery.trim()}`); // Chuyển hướng tới trang tìm kiếm
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/'); // Chuyển về trang chủ sau khi đăng xuất
  };

  const toggleMobileSubmenu = (index) => {
    setExpandedMobile(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Giữ lại demoNavigation làm dữ liệu dự phòng nếu cần
  const demoNavigation = [
    { text: 'Về BeeWo', url: '/about' },
    { text: 'Bộ Sưu Tập', url: '/products' },
    { text: 'Tất Cả Sản Phẩm', url: '/products' },
    { text: 'Ưu Đãi Độc Quyền', url: '/sale' },
  ];

  const navData = navigation.length > 0 ? navigation : demoNavigation;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu & Search */}
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

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold tracking-widest uppercase">
              {brandName}
            </h1>
          </Link>

          {/* Right Icons */}
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setSearchOpen(!searchOpen)} 
              className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition" 
              title="Tìm kiếm"
            >
              <Search size={20} />
            </button>

            {isAuthenticated ? (
              <div className="relative group">
                <button 
                  className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition" 
                  title={user?.email}
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
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                      <User size={16} />Tài khoản
                    </Link>
                    <Link to="/profile/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                      <ShoppingCart size={16} />Đơn hàng của tôi
                    </Link>
                    <Link to="/profile/wishlist" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                      <Heart size={16} />Danh sách yêu thích
                    </Link>
                  </div>
                  {isAdmin && (
                    <div className="border-t border-gray-100 py-2">
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition font-medium">
                        Admin Dashboard
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
            ) : (
              <Link 
                to="/login" 
                className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition" 
                title="Đăng nhập"
              >
                <User size={20} />
              </Link>
            )}

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
        <div className="md:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col py-2">
            {navData.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between">
                  <Link 
                    to={item.url} 
                    onClick={() => !item.submenu && setMobileMenuOpen(false)} 
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition uppercase tracking-wide"
                  >
                    {item.text}
                  </Link>
                  {item.submenu && (
                    <button
                      onClick={() => toggleMobileSubmenu(index)}
                      className="px-4 py-3 text-gray-700 hover:bg-gray-50"
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
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-8 py-2 text-sm text-gray-600 hover:bg-gray-100 transition"
                      >
                        {subItem.text}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <div className="border-t border-gray-100 mt-2 pt-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-xs text-gray-500">{user?.email}</div>
                  <Link 
                    to="/profile" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <User size={16} />Tài khoản
                  </Link>
                  <Link 
                    to="/profile/orders" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <ShoppingCart size={16} />Đơn hàng
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
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }} 
                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                  >
                    <LogOut size={16} />Đăng xuất
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setMobileMenuOpen(false)} 
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

export default Header;