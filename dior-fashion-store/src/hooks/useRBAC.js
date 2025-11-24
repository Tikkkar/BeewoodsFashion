import { useAuth } from './useAuth';

/**
 * useRBAC Hook
 * Provides role-based access control helpers
 */
export const useRBAC = () => {
    const auth = useAuth();

    /**
     * Check if user has specific permission
     */
    const hasPermission = (permission) => {
        const { userRole } = auth;

        const permissions = {
            // Admin permissions
            'admin': ['*'], // All permissions

            // Sale permissions
            'sale': [
                'orders.create',
                'orders.view.own',
                'orders.update.own',
                'products.view',
                'customers.view'
            ],

            // Warehouse permissions
            'warehouse': [
                'orders.view.all',
                'orders.update.status',
                'shipments.view',
                'shipments.create',
                'shipments.update',
                'inventory.view'
            ],

            // Customer permissions
            'customer': [
                'orders.view.own',
                'orders.create',
                'products.view'
            ]
        };

        const rolePermissions = permissions[userRole] || [];

        // Admin has all permissions
        if (rolePermissions.includes('*')) return true;

        // Check specific permission
        return rolePermissions.includes(permission);
    };

    /**
     * Check if user can access a specific route
     */
    const canAccessRoute = (route) => {
        const { userRole } = auth;

        const routeAccess = {
            '/admin': ['admin', 'sale', 'warehouse'],
            '/admin/dashboard': ['admin', 'sale', 'warehouse'],
            '/admin/orders': ['admin', 'sale', 'warehouse'],
            '/admin/products': ['admin'],
            '/admin/categories': ['admin'],
            '/admin/banners': ['admin'],
            '/admin/employees': ['admin'],
            '/admin/shipments': ['admin', 'warehouse'],
            '/admin/inventory': ['admin', 'warehouse'],
            '/admin/my-orders': ['sale'],
            '/admin/warehouse': ['warehouse'],
        };

        const allowedRoles = routeAccess[route];

        if (!allowedRoles) return false;

        return allowedRoles.includes(userRole);
    };

    /**
     * Filter data based on user role
     * For Sale: only show own orders from last 30 days
     */
    const filterOrders = (orders) => {
        const { userRole, userId } = auth;

        if (userRole === 'admin' || userRole === 'warehouse') {
            return orders; // Show all
        }

        if (userRole === 'sale') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            return orders.filter(order => {
                const orderDate = new Date(order.created_at);
                return order.created_by === userId && orderDate >= thirtyDaysAgo;
            });
        }

        if (userRole === 'customer') {
            return orders.filter(order => order.user_id === userId);
        }

        return [];
    };

    /**
     * Get role display name
     */
    const getRoleDisplayName = (role) => {
        const roleNames = {
            'admin': 'Quản trị viên',
            'sale': 'Nhân viên Sale',
            'warehouse': 'Nhân viên Kho',
            'customer': 'Khách hàng'
        };

        return roleNames[role] || role;
    };

    /**
     * Get role badge color
     */
    const getRoleBadgeColor = (role) => {
        const colors = {
            'admin': 'bg-purple-100 text-purple-800',
            'sale': 'bg-blue-100 text-blue-800',
            'warehouse': 'bg-green-100 text-green-800',
            'customer': 'bg-gray-100 text-gray-800'
        };

        return colors[role] || colors.customer;
    };

    return {
        ...auth,
        hasPermission,
        canAccessRoute,
        filterOrders,
        getRoleDisplayName,
        getRoleBadgeColor
    };
};

export default useRBAC;
