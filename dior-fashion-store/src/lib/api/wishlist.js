import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

/**
 * -----------------------------------------------------------------------------
 * Wishlist Management
 * -----------------------------------------------------------------------------
 */

/**
 * Get user's wishlist
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of wishlist items with product details
 */
export const getUserWishlist = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        products (
          id,
          name,
          slug,
          price,
          is_active,
          product_images (image_url)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    toast.error('Failed to load wishlist');
    return { data: [], error };
  }
};

/**
 * Add product to wishlist
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Created wishlist item
 */
export const addToWishlist = async (productId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please login to add to wishlist');
      return { data: null, error: 'Not logged in' };
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    if (existing) {
      toast.info('Already in your wishlist');
      return { data: existing, error: null };
    }

    const { data, error } = await supabase
      .from('wishlists')
      .insert([{
        user_id: user.id,
        product_id: productId
      }])
      .select()
      .single();

    if (error) throw error;

    toast.success('Added to wishlist!');
    return { data, error: null };
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    toast.error('Failed to add to wishlist');
    return { data: null, error };
  }
};

/**
 * Remove product from wishlist
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Success status
 */
export const removeFromWishlist = async (productId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not logged in');

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) throw error;

    toast.success('Removed from wishlist');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    toast.error('Failed to remove from wishlist');
    return { success: false, error };
  }
};

/**
 * Check if product is in user's wishlist
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Is in wishlist
 */
export const isInWishlist = async (userId, productId) => {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { isInWishlist: !!data, error: null };
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return { isInWishlist: false, error };
  }
};

/**
 * Toggle product in wishlist (add if not exists, remove if exists)
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Result with action taken
 */
export const toggleWishlist = async (productId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please login to manage wishlist');
      return { data: null, error: 'Not logged in' };
    }

    // Check if exists
    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    if (existing) {
      // Remove from wishlist
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;

      toast.success('Removed from wishlist');
      return { action: 'removed', error: null };
    } else {
      // Add to wishlist
      const { data, error } = await supabase
        .from('wishlists')
        .insert([{
          user_id: user.id,
          product_id: productId
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Added to wishlist!');
      return { action: 'added', data, error: null };
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    toast.error('Failed to update wishlist');
    return { data: null, error };
  }
};

/**
 * Sync localStorage wishlist to database
 * @param {Array} localWishlist - Array of product IDs from localStorage
 * @returns {Promise<boolean>} Success status
 */
export const syncWishlistToDatabase = async (localWishlist) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !localWishlist || localWishlist.length === 0) {
      return { success: true, error: null };
    }

    // Get existing wishlist from database
    const { data: existingWishlist } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id);

    const existingIds = existingWishlist?.map(item => item.product_id) || [];

    // Find items that need to be added
    const itemsToAdd = localWishlist.filter(id => !existingIds.includes(id));

    if (itemsToAdd.length > 0) {
      const { error } = await supabase
        .from('wishlists')
        .insert(
          itemsToAdd.map(productId => ({
            user_id: user.id,
            product_id: productId
          }))
        );

      if (error) throw error;

      toast.success(`Synced ${itemsToAdd.length} items to your wishlist`);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error syncing wishlist:', error);
    toast.error('Failed to sync wishlist');
    return { success: false, error };
  }
};

/**
 * Clear entire wishlist
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const clearWishlist = async (userId) => {
  try {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    toast.success('Wishlist cleared');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    toast.error('Failed to clear wishlist');
    return { success: false, error };
  }
};