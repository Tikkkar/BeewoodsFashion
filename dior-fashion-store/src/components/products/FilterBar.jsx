import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

const FilterBar = ({ 
  categories,  // ⚡ Nhận array of objects từ Supabase: [{id, name, slug}, ...]
  selectedCategory, 
  onSelectCategory,
  priceRange,
  onPriceRangeChange,
  sizes,
  selectedSizes,
  onSizeToggle,
  showMobileFilter,
  onToggleMobileFilter
}) => {
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isSizeOpen, setIsSizeOpen] = useState(true);

  // ⚡ Convert categories to names array + add "Tất cả"
  const categoryNames = ['Tất cả', ...(categories?.map(c => c.name) || [])];

  const priceRanges = [
    { label: 'Dưới 500k', min: 0, max: 500000 },
    { label: '500k - 1tr', min: 500000, max: 1000000 },
    { label: '1tr - 2tr', min: 1000000, max: 2000000 },
    { label: '2tr - 5tr', min: 2000000, max: 5000000 },
    { label: 'Trên 5tr', min: 5000000, max: Infinity }
  ];

  const defaultSizes = sizes || ['XS', 'S', 'M', 'L', 'XL'];

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <button
        onClick={onToggleMobileFilter}
        className="md:hidden fixed bottom-4 left-4 z-40 bg-black text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-gray-800 transition"
      >
        <Filter size={18} />
        <span className="font-medium">Bộ lọc</span>
      </button>

      {/* Filter Sidebar */}
      <div className={`
        fixed md:sticky top-0 left-0 h-full md:h-auto
        w-80 md:w-full bg-white
        shadow-2xl md:shadow-none
        z-50 md:z-0
        transition-transform duration-300
        ${showMobileFilter ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">Bộ Lọc</h3>
          <button
            onClick={onToggleMobileFilter}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 md:p-0 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] md:max-h-none">
          
          {/* Category Filter */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Filter size={18} className="text-gray-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Danh Mục</h3>
            </div>
            
            <div className="space-y-2">
              {categoryNames.map((categoryName) => (
                <button
                  key={categoryName}
                  onClick={() => {
                    onSelectCategory(categoryName);
                    if (window.innerWidth < 768) {
                      onToggleMobileFilter?.();
                    }
                  }}
                  className={`
                    w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${selectedCategory === categoryName
                      ? 'bg-black text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {categoryName}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          {onPriceRangeChange && (
            <div className="border-t pt-6">
              <button
                onClick={() => setIsPriceOpen(!isPriceOpen)}
                className="flex items-center justify-between w-full mb-4"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider">Khoảng Giá</h3>
                <ChevronDown 
                  size={18} 
                  className={`transition-transform ${isPriceOpen ? 'rotate-180' : ''}`}
                />
              </button>
              
              {isPriceOpen && (
                <div className="space-y-2">
                  {priceRanges.map((range, index) => (
                    <label
                      key={index}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    >
                      <input
                        type="radio"
                        name="priceRange"
                        checked={
                          priceRange?.min === range.min && 
                          priceRange?.max === range.max
                        }
                        onChange={() => onPriceRangeChange(range)}
                        className="w-4 h-4 text-black focus:ring-black"
                      />
                      <span className="text-sm text-gray-700">{range.label}</span>
                    </label>
                  ))}
                  
                  {priceRange && (
                    <button
                      onClick={() => onPriceRangeChange(null)}
                      className="text-xs text-red-600 hover:text-red-700 mt-2 underline"
                    >
                      Xóa bộ lọc giá
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Size Filter */}
          {onSizeToggle && (
            <div className="border-t pt-6">
              <button
                onClick={() => setIsSizeOpen(!isSizeOpen)}
                className="flex items-center justify-between w-full mb-4"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider">Kích Thước</h3>
                <ChevronDown 
                  size={18} 
                  className={`transition-transform ${isSizeOpen ? 'rotate-180' : ''}`}
                />
              </button>
              
              {isSizeOpen && (
                <div className="grid grid-cols-3 gap-2">
                  {defaultSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => onSizeToggle(size)}
                      className={`
                        py-2.5 rounded-lg text-sm font-medium border-2
                        transition-all duration-200
                        ${selectedSizes?.includes(size)
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 text-gray-700 hover:border-black'
                        }
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Clear All Filters */}
          <div className="border-t pt-6">
            <button
              onClick={() => {
                onSelectCategory('Tất cả');
                onPriceRangeChange?.(null);
                selectedSizes?.forEach(size => onSizeToggle?.(size));
              }}
              className="w-full py-3 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-black hover:text-black transition"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {showMobileFilter && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onToggleMobileFilter}
        />
      )}
    </>
  );
};

export default FilterBar;