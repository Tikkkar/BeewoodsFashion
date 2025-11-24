import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

/**
 * ============================================================================
 * EMPLOYEE MANAGEMENT API
 * ============================================================================
 * API functions for managing employees (Sale & Warehouse) with RBAC
 */

/**
 * Get current user's role and info
 */
export const getCurrentUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: { message: 'Not authenticated' } };
    }

    const { data: profile, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, employee_code, department, is_active')
        .eq('id', user.id)
        .single();

    return { data: profile, error };
};

/**
 * Get orders with role-based filtering
 * - Admin: all orders
 * - Warehouse: all orders
 * - Sale: only own orders (30 days)
 */
export const getOrdersForEmployee = async (filters = {}) => {
    try {
        // Get current user role
        const { data: userProfile } = await getCurrentUserRole();

        if (!userProfile) {
            throw new Error('User not found');
        }

        const { role, id: userId } = userProfile;

        // Build query based on role
        let query = supabase
            .from('orders')
            .select(`
        *,
        order_items(*)
      `)
            .order('created_at', { ascending: false });

        // Apply role-based filters
        if (role === 'sale') {
            // Sale: only own orders + last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            query = query
                .eq('created_by', userId)
                .gte('created_at', thirtyDaysAgo.toISOString());
        } else if (role === 'warehouse') {
            // Warehouse: all orders (no filter)
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
        } else if (role === 'admin') {
            // Admin: all orders
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.created_by) {
                query = query.eq('created_by', filters.created_by);
            }
        } else {
            // Customer or unknown role
            query = query.eq('user_id', userId);
        }

        // Apply common filters
        if (filters.search) {
            query = query.or(`order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`);
        }

        if (filters.date_from) {
            query = query.gte('created_at', filters.date_from);
        }

        if (filters.date_to) {
            query = query.lte('created_at', filters.date_to);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error in getOrdersForEmployee:', error);
        toast.error(error.message);
        return { data: null, error };
    }
};

/**
 * Create order as Sale employee
 */
export const createOrderAsSale = async (orderData) => {
    try {
        const { data: userProfile } = await getCurrentUserRole();

        if (!userProfile || userProfile.role !== 'sale') {
            throw new Error('Only Sale employees can create orders');
        }

        // Add created_by to order data
        const orderWithCreator = {
            ...orderData,
            created_by: userProfile.id
        };

        const { data, error } = await supabase
            .from('orders')
            .insert(orderWithCreator)
            .select()
            .single();

        if (error) throw error;

        toast.success('Order created successfully!');
        return { data, error: null };
    } catch (error) {
        console.error('Error creating order:', error);
        toast.error(error.message);
        return { data: null, error };
    }
};

/**
 * Get employee statistics
 */
export const getEmployeeStats = async (employeeId = null) => {
    try {
        let query = supabase
            .from('v_employee_stats')
            .select('*');

        if (employeeId) {
            query = query.eq('employee_id', employeeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data: employeeId ? data[0] : data, error: null };
    } catch (error) {
        console.error('Error fetching employee stats:', error);
        return { data: null, error };
    }
};

/**
 * Get current user's stats (for Sale dashboard)
 */
export const getMyStats = async () => {
    try {
        const { data: userProfile } = await getCurrentUserRole();

        if (!userProfile) {
            throw new Error('User not found');
        }

        return await getEmployeeStats(userProfile.id);
    } catch (error) {
        console.error('Error fetching my stats:', error);
        return { data: null, error };
    }
};

/**
 * Get all employees (Admin only)
 */
export const getEmployees = async (filters = {}) => {
    try {
        let query = supabase
            .from('users')
            .select('id, email, full_name, role, employee_code, department, is_active, hired_date, created_at')
            .in('role', ['sale', 'warehouse', 'admin'])
            .order('created_at', { ascending: false });

        if (filters.role) {
            query = query.eq('role', filters.role);
        }

        if (filters.is_active !== undefined) {
            query = query.eq('is_active', filters.is_active);
        }

        if (filters.search) {
            query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employees');
        return { data: null, error };
    }
};

/**
 * Create new employee (Admin only)
 * Note: Uses regular signup + role update approach since admin.createUser requires server-side
 */
export const createEmployee = async (employeeData) => {
    try {
        // Step 1: Create auth user using regular signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: employeeData.email,
            password: employeeData.password,
            options: {
                data: {
                    full_name: employeeData.full_name
                },
                emailRedirectTo: window.location.origin + '/login'
            }
        });

        if (authError) {
            // Handle specific auth errors
            if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
                throw new Error(`Email ${employeeData.email} đã được sử dụng. Vui lòng dùng email khác.`);
            }
            throw authError;
        }

        if (!authData.user) {
            throw new Error('Không thể tạo tài khoản. Vui lòng thử lại.');
        }

        // Step 2: Update user profile with employee data
        const { data, error } = await supabase
            .from('users')
            .upsert({
                id: authData.user.id,
                email: employeeData.email,
                full_name: employeeData.full_name,
                role: employeeData.role,
                employee_code: employeeData.employee_code,
                department: employeeData.department,
                phone: employeeData.phone,
                hired_date: employeeData.hired_date || new Date().toISOString(),
                is_active: true
            }, {
                onConflict: 'id'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating user profile:', error);
            throw new Error('Không thể tạo hồ sơ nhân viên: ' + error.message);
        }

        toast.success(`Nhân viên ${employeeData.full_name} đã được tạo thành công!`);
        toast.info('Email xác nhận đã được gửi đến ' + employeeData.email, { duration: 5000 });

        return { data, error: null };
    } catch (error) {
        console.error('Error creating employee:', error);

        // Show user-friendly error message
        const errorMessage = error.message || 'Có lỗi xảy ra khi tạo nhân viên';
        toast.error(errorMessage, { duration: 6000 });

        return { data: null, error };
    }
};

/**
 * Resend confirmation email to employee
 */
export const resendConfirmationEmail = async (email) => {
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: window.location.origin + '/login'
            }
        });

        if (error) throw error;

        toast.success('Email xác nhận đã được gửi lại!');
        return { error: null };
    } catch (error) {
        console.error('Error resending confirmation email:', error);
        toast.error('Lỗi: ' + error.message);
        return { error };
    }
};

/**
 * Send password reset email to employee
 */
export const sendPasswordResetEmail = async (email) => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password'
        });

        if (error) throw error;

        toast.success('Email đặt lại mật khẩu đã được gửi!');
        return { error: null };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        toast.error('Lỗi: ' + error.message);
        return { error };
    }
};

/**
 * Update employee (Admin only)
 */
export const updateEmployee = async (employeeId, updates) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', employeeId)
            .select()
            .single();

        if (error) throw error;

        toast.success('Employee updated successfully!');
        return { data, error: null };
    } catch (error) {
        console.error('Error updating employee:', error);
        toast.error(error.message);
        return { data: null, error };
    }
};

/**
 * Deactivate employee (Admin only)
 */
export const deactivateEmployee = async (employeeId) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ is_active: false })
            .eq('id', employeeId)
            .select()
            .single();

        if (error) throw error;

        toast.success('Employee deactivated successfully!');
        return { data, error: null };
    } catch (error) {
        console.error('Error deactivating employee:', error);
        toast.error(error.message);
        return { data: null, error };
    }
};

/**
 * Get warehouse pending orders (for Warehouse dashboard)
 */
export const getWarehousePendingOrders = async () => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        order_items(*)
      `)
            .in('status', ['pending', 'processing'])
            .order('created_at', { ascending: true });

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        return { data: null, error };
    }
};

/**
 * Update order status (Warehouse can update to mark as packed/shipped)
 */
export const updateOrderStatus = async (orderId, newStatus, notes = null) => {
    try {
        const updates = {
            status: newStatus,
            updated_at: new Date().toISOString()
        };

        if (notes) {
            updates.notes = notes;
        }

        const { data, error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw error;

        toast.success(`Order status updated to ${newStatus}`);
        return { data, error: null };
    } catch (error) {
        console.error('Error updating order status:', error);
        toast.error(error.message);
        return { data: null, error };
    }
};

/**
 * Log employee action (for audit)
 */
export const logEmployeeAction = async (action, resourceType, resourceId, oldData = null, newData = null) => {
    try {
        const { data: userProfile } = await getCurrentUserRole();

        if (!userProfile) return;

        await supabase
            .from('employee_audit_logs')
            .insert({
                employee_id: userProfile.id,
                action,
                resource_type: resourceType,
                resource_id: resourceId,
                old_data: oldData,
                new_data: newData
            });
    } catch (error) {
        console.error('Error logging employee action:', error);
        // Don't throw error, just log it
    }
};
