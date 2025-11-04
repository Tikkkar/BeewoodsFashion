import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { signOut } from "../../lib/api/auth";
import { BarChart3 } from "lucide-react";
import { ListChecks } from "lucide-react";
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
} from "lucide-react";

const AdminLayout = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not admin
  if (!isAdmin) {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const menuItems = [
    {
      title: "Bảng điều khiển", // Dịch: Dashboard
      icon: LayoutDashboard,
      path: "/admin/dashboard",
    },
    {
      title: "Sản phẩm", // Dịch: Products
      icon: Package,
      path: "/admin/products",
    },
    {
      title: "Danh mục", // Dịch: Categories
      icon: FolderOpen,
      path: "/admin/categories",
    },
    {
      title: "Banner", // Dịch: Banners
      icon: Image,
      path: "/admin/banners",
    },
    {
      title: "Đơn hàng", // Dịch: Orders
      icon: ShoppingBag,
      path: "/admin/orders",
    },
    {
      title: "Phân tích", // Dịch: Analytics
      path: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "Cài đặt Chatbot", // Dịch: Chatbot Settings
      path: "/admin/chatbot/facebook",
      icon: Settings,
    },
    {
      title: "Hội thoại", // Dịch: Conversations
      path: "/admin/chatbot/conversations",
      icon: MessageSquare,
    },
    {
      title: "Ad Targeting", // Dịch: Conversations
      path: "/admin/ad-targeting",
      icon: Target,
    },
    // {
    //   title: "Kịch bản", // Dịch: Scenarios
    //   path: "/admin/chatbot/scenarios",
    //   icon: ListChecks,
    // },
  ];

  const isActive = (path) => {
    // Exact match for dashboard
    if (path === "/admin/dashboard") {
      return (
        location.pathname === "/admin" ||
        location.pathname === "/admin/dashboard"
      );
    }
    // Starts with for other routes
    return location.pathname.startsWith(path);
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
          <h1 className="text-xl font-bold">BẢNG ĐIỀU KHIỂN ADMIN</h1>{" "}
          {/* Dịch: ADMIN PANEL */}
          <div className="w-10" />
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:w-64 w-64
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-center">
          <h1 className="text-2xl font-bold tracking-widest">BEWO</h1>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-medium">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name ||
                  user?.profile?.full_name ||
                  "Quản trị viên"}{" "}
                {/* Dịch: Admin */}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition
                  ${
                    active
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <Home size={20} />
            <span className="font-medium">Quay lại Cửa hàng</span>{" "}
            {/* Dịch: Back to Store */}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={20} />
            <span className="font-medium">Đăng xuất</span> {/* Dịch: Logout */}
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
