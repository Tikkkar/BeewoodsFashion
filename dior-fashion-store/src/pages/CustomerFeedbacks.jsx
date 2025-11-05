import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const CustomerFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_feedbacks')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (feedbacks.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Khách hàng của chúng tôi</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hàng nghìn khách hàng đã tin tưởng và hài lòng với sản phẩm
          </p>
        </div>

        {/* Feedbacks Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="group relative"
            >
              {/* Image */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg transition-transform duration-300 group-hover:scale-105">
                <img
                  src={feedback.customer_image}
                  alt={feedback.customer_name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Customer Name - Hover Effect */}
              <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <p className="text-white font-semibold text-center px-2">
                  {feedback.customer_name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Optional: Add a "View More" button if you have many feedbacks */}
        {feedbacks.length > 12 && (
          <div className="text-center mt-12">
            <button className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors">
              Xem thêm khách hàng
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomerFeedbacks;