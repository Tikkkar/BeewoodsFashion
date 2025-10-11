import React from 'react';
import { Trash2, Plus } from 'lucide-react';

const CategoriesEditor = ({ data, setData }) => {
  const updateCategory = (index, updates) => {
    const newCategories = [...data.categories];
    newCategories[index] = { ...newCategories[index], ...updates };
    setData({ ...data, categories: newCategories });
  };
  
  const deleteCategory = (index) => {
    setData({ ...data, categories: data.categories.filter((_, i) => i !== index) });
  };
  
  const addCategory = () => {
    setData({
      ...data,
      categories: [...data.categories, {
        name: 'NEW CATEGORY',
        img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400'
      }]
    });
  };
  
  return (
    <div className="space-y-4">
      {data.categories.map((cat, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <img src={cat.img} alt={cat.name} className="w-16 h-16 object-cover rounded" />
            <input
              type="text"
              value={cat.name}
              onChange={(e) => updateCategory(index, { name: e.target.value })}
              className="flex-1 px-2 py-1 text-sm border rounded"
            />
            <button
              onClick={() => deleteCategory(index)}
              className="p-2 hover:bg-red-50 text-red-500 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <input
            type="text"
            value={cat.img}
            onChange={(e) => updateCategory(index, { img: e.target.value })}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder="Image URL"
          />
        </div>
      ))}
      
      <button
        onClick={addCategory}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-black text-sm flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Add New Category
      </button>
    </div>
  );
};

export default CategoriesEditor;