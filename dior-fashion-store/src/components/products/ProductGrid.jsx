import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, onAddToCart, onQuickView, title }) => {
  // Default empty function nếu không có onQuickView
  const handleQuickView = onQuickView || (() => {});

  return (
    <section className="w-full">
      {title && (
        <h2 className="text-3xl md:text-4xl font-light tracking-widest text-center mb-12">
          {title}
        </h2>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onQuickView={handleQuickView}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;