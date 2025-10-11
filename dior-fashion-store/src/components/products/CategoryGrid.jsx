import React from 'react';
import CategoryCard from './CategoryCard';
import SectionTitle from '../common/SectionTitle';

const CategoryGrid = ({ categories, title = "SAVOIR-FAIRE" }) => {
  // Kiểm tra dữ liệu
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 px-4 bg-gray-50">
      <SectionTitle className="text-center mb-12">
        {title}
      </SectionTitle>
      
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {categories.map((cat, i) => (
            <CategoryCard key={i} category={cat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;