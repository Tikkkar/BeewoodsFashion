import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRBAC } from '../../hooks/useRBAC';

/**
 * RoleBasedRoute Component
 * Protects routes based on user role
 * 
 * Usage:
 * <RoleBasedRoute allowedRoles={['admin', 'sale']}>
 *   <AdminOrders />
 * </RoleBasedRoute>
 */
const RoleBasedRoute = ({
    children,
    allowedRoles = [],
    redirectTo = '/login',
    fallback = null
}) => {
    const { userRole, isAuthenticated, loading } = useRBAC();

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // Not authenticated
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    // Check if user role is allowed
    const isAllowed = allowedRoles.includes(userRole);

    if (!isAllowed) {
        // Show fallback or redirect to unauthorized page
        if (fallback) {
            return fallback;
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Bạn không có quyền truy cập trang này
                    </p>
                    <a
                        href="/admin"
                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
                    >
                        Quay lại Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return children;
};

export default RoleBasedRoute;
