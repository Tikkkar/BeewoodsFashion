import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ onSearch, placeholder = "Tìm kiếm sản phẩm..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className={`
        relative flex items-center border-2 rounded-full overflow-hidden
        transition-all duration-300
        ${isFocused ? 'border-black shadow-lg' : 'border-gray-300'}
      `}>
        <Search 
          size={20} 
          className="absolute left-4 text-gray-400"
        />
        
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full py-3 pl-12 pr-12 tracking-wide focus:outline-none"
        />
        
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        )}
      </div>
      
      {searchTerm && (
        <p className="text-sm text-gray-500 mt-2 text-center tracking-wide">
          Đang tìm kiếm: "{searchTerm}"
        </p>
      )}
    </div>
  );
};

export default SearchBar;