import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, ShoppingBag, MapPin, Heart, Settings } from 'lucide-react';

const ProfileLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      title: 'Profile',
      icon: User,
      path: '/profile',
      exact: true
    },
    {
      title: 'Orders',
      icon: ShoppingBag,
      path: '/profile/orders'
    },
    {
      title: 'Addresses',
      icon: MapPin,
      path: '/profile/addresses'
    },
    {
      title: 'Wishlist',
      icon: Heart,
      path: '/profile/wishlist'
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Account</h1>
          <p className="text-gray-600">
            Welcome back, {user?.user_metadata?.full_name || user?.profile?.full_name || 'Customer'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* User Info */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {user?.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user?.user_metadata?.full_name || user?.profile?.full_name || 'Customer'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="p-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path, item.exact);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition mb-1
                        ${active
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Stats (Optional) */}
            <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Wishlist Items</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;