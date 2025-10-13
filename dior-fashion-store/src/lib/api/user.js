import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

/**
 * -----------------------------------------------------------------------------
 * User Profile Management
 * -----------------------------------------------------------------------------
 */

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No user logged in');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    toast.error('Failed to load profile');
    return { data: null, error };
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: profileData.full_name,
        phone: profileData.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    toast.success('Profile updated successfully!');
    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error('Failed to update profile');
    return { data: null, error };
  }
};

/**
 * Change user password
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
export const changePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    toast.success('Password changed successfully!');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error changing password:', error);
    toast.error('Failed to change password');
    return { success: false, error };
  }
};

/**
 * -----------------------------------------------------------------------------
 * User Addresses Management
 * -----------------------------------------------------------------------------
 */

/**
 * Get user addresses
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of addresses
 */
export const getUserAddresses = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching addresses:', error);
    toast.error('Failed to load addresses');
    return { data: [], error };
  }
};

/**
 * Create new address
 * @param {Object} addressData - Address data
 * @returns {Promise<Object>} Created address
 */
export const createAddress = async (addressData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('No user logged in');

    // If this is the default address, unset other defaults
    if (addressData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert([{
        ...addressData,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;

    toast.success('Address added successfully!');
    return { data, error: null };
  } catch (error) {
    console.error('Error creating address:', error);
    toast.error('Failed to add address');
    return { data: null, error };
  }
};

/**
 * Update address
 * @param {string} addressId - Address ID
 * @param {Object} addressData - Address data to update
 * @returns {Promise<Object>} Updated address
 */
export const updateAddress = async (addressId, addressData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('No user logged in');

    // If this is the default address, unset other defaults
    if (addressData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(addressData)
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    toast.success('Address updated successfully!');
    return { data, error: null };
  } catch (error) {
    console.error('Error updating address:', error);
    toast.error('Failed to update address');
    return { data: null, error };
  }
};

/**
 * Delete address
 * @param {string} addressId - Address ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteAddress = async (addressId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id);

    if (error) throw error;

    toast.success('Address deleted successfully!');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting address:', error);
    toast.error('Failed to delete address');
    return { success: false, error };
  }
};

/**
 * -----------------------------------------------------------------------------
 * User Orders
 * -----------------------------------------------------------------------------
 */

/**
 * Get user orders
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of orders
 */
export const getUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, product_images(image_url)))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching orders:', error);
    toast.error('Failed to load orders');
    return { data: [], error };
  }
};

/**
 * Get single order details
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Order details
 */
export const getUserOrderDetail = async (orderId, userId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, product_images(image_url)))')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching order details:', error);
    toast.error('Failed to load order details');
    return { data: null, error };
  }
};

/**
 * Cancel order (if status is pending)
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const cancelOrder = async (orderId, userId) => {
  try {
    // Check if order can be cancelled (only pending orders)
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    if (order.status !== 'pending') {
      toast.error('Only pending orders can be cancelled');
      return { success: false, error: 'Order cannot be cancelled' };
    }

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', userId);

    if (error) throw error;

    toast.success('Order cancelled successfully!');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error cancelling order:', error);
    toast.error('Failed to cancel order');
    return { success: false, error };
  }
};