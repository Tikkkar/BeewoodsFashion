import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserWishlist, removeFromWishlist } from '../../lib/api/wishlist';
import { Loader2, Heart, ShoppingCart, Trash2, ExternalLink } from 'lucide-react';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { 
  style: 'currency', 
  currency: 'VND' 
}).format(price);

const WishlistPage = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    setLoading(true);
    const { data } = await getUserWishlist(user.id);
    if (data) {
      // Filter out items where product is null (deleted products)
      setWishlist(data.filter(item => item.products));
    }
    setLoading(false);
  };

  const handleRemove = async (productId) => {
    const { success } = await removeFromWishlist(productId);
    if (success) {
      loadWishlist();
    }
  };

  const handleAddToCart = (product) => {
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.product_images?.[0]?.image_url,
        quantity: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Dispatch event to update cart
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Optional: Remove from wishlist after adding to cart
    // handleRemove(product.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold mb-1">My Wishlist</h2>
          <p className="text-gray-600 text-sm">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {/* Wishlist Items */}
      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-600 mb-6">
            Save your favorite items and never lose track of them
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const product = item.products;
            
            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition group"
              >
                {/* Product Image */}
                <Link
                  to={`/products/${product.slug}`}
                  className="block relative aspect-square overflow-hidden bg-gray-100"
                >
                  <img
                    src={product.product_images?.[0]?.image_url || '/placeholder.png'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {!product.is_active && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-medium">Out of Stock</span>
                    </div>
                  )}
                </Link>

                {/* Product Info */}
                <div className="p-4">
                  <Link
                    to={`/products/${product.slug}`}
                    className="block mb-2 hover:text-gray-600 transition"
                  >
                    <h3 className="font-medium line-clamp-2">{product.name}</h3>
                  </Link>
                  
                  <p className="text-lg font-bold mb-4">{formatPrice(product.price)}</p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.is_active}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart size={18} />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* View Product Link */}
                  <Link
                    to={`/products/${product.slug}`}
                    className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-600 hover:text-black transition"
                  >
                    <span>View Details</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;