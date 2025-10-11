import React from 'react';
import { ArrowUpDown } from 'lucide-react';

const SortDropdown = ({ sortBy, onSortChange }) => {
  const sortOptions = [
    { value: 'default', label: 'Mặc định' },
    { value: 'price-asc', label: 'Giá: Thấp → Cao' },
    { value: 'price-desc', label: 'Giá: Cao → Thấp' },
    { value: 'name-asc', label: 'Tên: A → Z' },
    { value: 'name-desc', label: 'Tên: Z → A' },
  ];

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown size={20} className="text-gray-600" />
          <h3 className="text-sm tracking-widest text-gray-600">SẮP XẾP THEO</h3>
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none tracking-wide bg-white cursor-pointer hover:border-gray-400 transition-colors"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SortDropdown;