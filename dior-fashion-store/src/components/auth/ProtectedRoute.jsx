import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-black mx-auto mb-4" />
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // console.log('❌ No user, redirect to login'); // Đã loại bỏ console.log
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    // console.log('❌ Not admin, redirect to home'); // Đã loại bỏ console.log
    return <Navigate to="/" replace />;
  }

  // console.log('✅ Access granted'); // Đã loại bỏ console.log
  return children;
};

export default ProtectedRoute;