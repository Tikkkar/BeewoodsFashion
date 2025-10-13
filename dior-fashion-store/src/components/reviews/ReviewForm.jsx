import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { submitReview } from '../../lib/api/reviews';
import { Loader2, X } from 'lucide-react';
import StarRating from './StarRating';
import { toast } from 'react-hot-toast';

const ReviewForm = ({ productId, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }

    setSubmitting(true);

    const { data, error } = await submitReview({
      product_id: productId,
      rating,
      comment: comment.trim()
    });

    setSubmitting(false);

    if (data && !error) {
      setRating(0);
      setComment('');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Write a Review</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Your Rating *
              </label>
              <div className="flex items-center gap-4">
                <StarRating
                  rating={rating}
                  interactive={true}
                  onChange={setRating}
                  size={32}
                />
                {rating > 0 && (
                  <span className="text-sm text-gray-600">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                required
                minLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 10 characters ({comment.length}/10)
              </p>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your review will be visible to other customers. 
                Please be honest and constructive.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
                disabled={submitting || rating === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;