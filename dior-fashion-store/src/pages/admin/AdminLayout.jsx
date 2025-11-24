import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { signOut } from "../../lib/api/auth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderOpen,
  Image,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Target,
  BarChart3,
  Search,
  Facebook,
  ChevronDown,
  ChevronRight,
  Bot,
  FileText,
  TrendingUp,
  Truck,
} from "lucide-react";

const AdminLayout = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    commerce: true,
    marketing: false,
    chatbot: false,
    analytics: false,
  });

  // Redirect if not admin
  if (!isAdmin) {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const menuStructure = [
    {
      title: "Tổng quan",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
      type: "single"
    },
    {
      title: "Thương mại",
      icon: ShoppingBag,
      key: "commerce",
      type: "group",
      items: [
        {
          title: "Sản phẩm",
          icon: Package,
          path: "/admin/products",
        },
        {
          title: "Danh mục",
          icon: FolderOpen,
          path: "/admin/categories",
        },
        {
          title: "Đơn hàng",
          icon: ShoppingBag,
          path: "/admin/orders",
        },
        {
          title: "Vận chuyển",
          icon: Truck,
          path: "/admin/shipments",
        },
        {
          title: "Quản lý SEO",
          icon: Search,
          path: "/admin/seo-manager",
        },
        {
          title: "Quản lý Kho",
          icon: Search,
          path: "/admin/inventory",
        },
        {
          title: "Banner",
          icon: Image,
          path: "/admin/banners",
        },
      ]
    },
    {
      title: "Marketing & Quảng cáo",
      icon: TrendingUp,
      key: "marketing",
      type: "group",
      items: [
        {
          title: "Facebook Settings",
          icon: Settings,
          path: "/admin/facebook-settings",
        },
        {
          title: "Facebook Posts",
          icon: FileText,
          path: "/admin/facebook-posts",
        },
        {
          title: "Ad Targeting",
          icon: Target,
          path: "/admin/ad-targeting",
        },
      ]
    },
    {
      title: "Chatbot & AI",
      icon: Bot,
      key: "chatbot",
      type: "group",
      items: [
        {
          title: "Cài đặt Chatbot",
          icon: Settings,
          path: "/admin/chatbot/facebook",
        },
        {
          title: "Hội thoại",
          icon: MessageSquare,
          path: "/admin/chatbot/conversations",
        },
      ]
    },
    {
      title: "Phân tích & Báo cáo",
      icon: BarChart3,
      key: "analytics",
      type: "group",
      items: [
        {
          title: "Phân tích tổng quan",
          icon: BarChart3,
          path: "/admin/analytics",
        },
      ]
    },
  ];

  const isActive = (path) => {
    if (path === "/admin/dashboard") {
      return (
        location.pathname === "/admin" ||
        location.pathname === "/admin/dashboard"
      );
    }
    return location.pathname.startsWith(path);
  };

  const isGroupActive = (items) => {
    return items.some(item => isActive(item.path));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-xl font-bold">ADMIN PANEL</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40
          transition-transform duration-300 ease-in-out overflow-y-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:w-64 w-64
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-center sticky top-0 bg-white z-10">
          <h1 className="text-2xl font-bold tracking-widest">BEWO</h1>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 sticky top-16 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-medium">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name ||
                  user?.profile?.full_name ||
                  "Quản trị viên"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 pb-32">
          {menuStructure.map((section) => {
            if (section.type === "single") {
              const Icon = section.icon;
              const active = isActive(section.path);

              return (
                <Link
                  key={section.path}
                  to={section.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition
                    ${active
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{section.title}</span>
                </Link>
              );
            }

            // Group menu
            const Icon = section.icon;
            const isExpanded = expandedMenus[section.key];
            const hasActiveChild = isGroupActive(section.items);

            return (
              <div key={section.key} className="space-y-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleMenu(section.key)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-lg transition
                    ${hasActiveChild
                      ? "bg-gray-100 text-black"
                      : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span className="font-medium">{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>

                {/* Sub-items */}
                {isExpanded && (
                  <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const active = isActive(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm
                            ${active
                              ? "bg-black text-white"
                              : "text-gray-600 hover:bg-gray-100"
                            }
                          `}
                        >
                          <ItemIcon size={18} />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-2 bg-white">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <Home size={20} />
            <span className="font-medium">Quay lại Cửa hàng</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={20} />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;