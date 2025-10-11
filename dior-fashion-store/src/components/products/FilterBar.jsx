import React from 'react';
import { Filter } from 'lucide-react';

const FilterBar = ({ categories, selectedCategory, onSelectCategory }) => {
  const allCategories = ['Tất cả', ...categories];

  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Filter size={20} className="text-gray-600" />
        <h3 className="text-sm tracking-widest text-gray-600">LỌC THEO DANH MỤC</h3>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3">
        {allCategories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`
              px-6 py-2 rounded-full tracking-wide text-sm
              transition-all duration-300
              ${selectedCategory === category
                ? 'bg-black text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-black hover:shadow-md'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>
      
      {selectedCategory !== 'Tất cả' && (
        <p className="text-center text-sm text-gray-500 mt-4 tracking-wide">
          Đang hiển thị: <span className="font-medium">{selectedCategory}</span>
        </p>
      )}
    </div>
  );
};

export default FilterBar;