import React from 'react';
import CategoryCard from './CategoryCard';
import SectionTitle from '../common/SectionTitle';
import { useCategories } from '../../hooks/useProducts';
import { Loader2 } from 'lucide-react';

const CategoryGrid = ({ title = "DANH MỤC SẢN PHẨM" }) => {
  // ⚡ Fetch categories từ Supabase
  const { categories, loading } = useCategories();

  if (loading) {
    return (
      <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-black" />
        </div>
      </section>
    );
  }

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
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;