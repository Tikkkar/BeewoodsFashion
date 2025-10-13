import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

/**
 * -----------------------------------------------------------------------------
 * Reviews Management
 * -----------------------------------------------------------------------------
 */

/**
 * Get reviews for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} List of reviews
 */
export const getProductReviews = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(full_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { data: [], error };
  }
};

/**
 * Check if user has purchased a product
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Has purchased
 */
export const hasUserPurchasedProduct = async (userId, productId) => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('id, orders(user_id, status)')
      .eq('product_id', productId)
      .eq('orders.user_id', userId)
      .eq('orders.status', 'completed')
      .limit(1);

    if (error) throw error;

    return { hasPurchased: data && data.length > 0, error: null };
  } catch (error) {
    console.error('Error checking purchase:', error);
    return { hasPurchased: false, error };
  }
};

/**
 * Check if user has already reviewed a product
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Has reviewed
 */
export const hasUserReviewedProduct = async (userId, productId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .limit(1);

    if (error) throw error;

    return { hasReviewed: data && data.length > 0, error: null };
  } catch (error) {
    console.error('Error checking review:', error);
    return { hasReviewed: false, error };
  }
};

/**
 * Submit a product review
 * @param {Object} reviewData - Review data
 * @returns {Promise<Object>} Created review
 */
export const submitReview = async (reviewData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not logged in');

    // Check if user has already reviewed this product
    const { hasReviewed } = await hasUserReviewedProduct(user.id, reviewData.product_id);
    
    if (hasReviewed) {
      toast.error('You have already reviewed this product');
      return { data: null, error: 'Already reviewed' };
    }

    // Check if user has purchased this product
    const { hasPurchased } = await hasUserPurchasedProduct(user.id, reviewData.product_id);

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        user_id: user.id,
        product_id: reviewData.product_id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        is_verified_purchase: hasPurchased
      }])
      .select()
      .single();

    if (error) throw error;

    toast.success('Review submitted successfully!');
    return { data, error: null };
  } catch (error) {
    console.error('Error submitting review:', error);
    toast.error('Failed to submit review');
    return { data: null, error };
  }
};

/**
 * Get average rating for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Average rating and count
 */
export const getProductRating = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { averageRating: 0, totalReviews: 0, error: null };
    }

    const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / data.length).toFixed(1);

    return {
      averageRating: parseFloat(averageRating),
      totalReviews: data.length,
      error: null
    };
  } catch (error) {
    console.error('Error calculating rating:', error);
    return { averageRating: 0, totalReviews: 0, error };
  }
};

/**
 * Delete review (user can only delete their own)
 * @param {string} reviewId - Review ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteReview = async (reviewId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not logged in');

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id);

    if (error) throw error;

    toast.success('Review deleted successfully!');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting review:', error);
    toast.error('Failed to delete review');
    return { success: false, error };
  }
};