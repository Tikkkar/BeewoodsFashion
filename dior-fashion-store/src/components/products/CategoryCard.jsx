import React, { useCallback } from 'react'; // 1. Import useCallback
import { useNavigate } from 'react-router-dom';

const CategoryCard = ({ category }) => {
  const navigate = useNavigate();
  
  if (!category) return null;

  // 2. Bọc hàm trong useCallback
  const handleClick = useCallback(() => {
    if (category.slug) { // Thêm kiểm tra slug tồn tại cho chắc chắn
      navigate(`/category/${category.slug}`);
    }
  }, [navigate, category.slug]); // 3. Thêm dependencies

  return (
    <div 
      className="relative overflow-hidden group cursor-pointer"
      onClick={handleClick}
    >
      {/* ... phần còn lại của component giữ nguyên ... */}
      <img
        src={category.image_url || category.img}
        alt={category.name}
        className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
        onError={(e) => e.target.src = 'https://placehold.co/400x600/eee/333?text=Category'}
      />
      
      <div className="absolute inset-0 bg-black/40 flex items-end justify-center p-6 transition duration-300 group-hover:bg-black/20">
        <h3 className="text-white text-xl font-bold tracking-widest uppercase">
          {category.name}
        </h3>
      </div>
    </div>
  );
};

export default CategoryCard;