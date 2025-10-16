import React from 'react';

const BrandStory = () => (
  <section className="py-20 px-4">
    <div className="container mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <img 
            src="https://images.unsplash.com/photo-1558769132-cb1aea48f8a5?w=800" 
            alt="BeeWo"
            className="w-full h-[600px] object-cover"
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-4xl font-light tracking-widest">THE MAISON</h2>
          <p className="text-gray-600 leading-relaxed">
            Founded in 1946, Christian Dior revolutionized the world of fashion with his iconic New Look. 
            Today, the House continues to embody elegance and innovation.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default BrandStory;