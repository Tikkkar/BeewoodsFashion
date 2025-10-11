import React from 'react';

const CategoryCard = ({ category }) => {
  // Kiểm tra dữ liệu
  if (!category) {
    return null;
  }

  return (
    <div className="relative overflow-hidden group cursor-pointer">
      {/* Category Image */}
      <img
        src={category.img}
        alt={category.name}
        className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
        onError={(e) => e.target.src = 'https://placehold.co/400x600/eee/333?text=Category'}
      />
      
      {/* Overlay and Title */}
      <div className="absolute inset-0 bg-black/40 flex items-end justify-center p-6 transition duration-300 group-hover:bg-black/20">
        <h3 className="text-white text-xl font-bold tracking-widest uppercase">
          {category.name}
        </h3>
      </div>
    </div>
  );
};

export default CategoryCard;