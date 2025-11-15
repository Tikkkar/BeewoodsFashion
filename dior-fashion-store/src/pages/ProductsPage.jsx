import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { X, Loader2, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import QuickViewModal from '../components/products/QuickViewModal';
import { useProducts, useCategories } from '../hooks/useProducts';

const ProductsPage = ({ onAddToCart }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug: categorySlugFromUrl } = useParams();

  // FILTERS từ URL
  const filters = useMemo(() => ({
    search: searchParams.get('search') || '',
    category: categorySlugFromUrl || null,
    sortBy: searchParams.get('sort') || 'newest',
    minPrice: searchParams.get('minPrice') || null,
    maxPrice: searchParams.get('maxPrice') || null,
    onSale: searchParams.get('onSale') === 'true',
  }), [searchParams, categorySlugFromUrl]);

  // UI STATE
  const [priceRange, setPriceRange] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  
  // MOBILE FILTER DRAWER STATE
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // FETCH DATA
  const { products: allProducts, loading: productsLoading, error: productsError } = useProducts(filters);
  const { categories: supabaseCategories, loading: categoriesLoading, error: categoriesError } = useCategories();

  // PRICE RANGES - Phải định nghĩa trước useEffect
  const priceRanges = useMemo(() => [
    { label: 'Dưới 500k', min: 0, max: 500000 },
    { label: '500k - 1tr', min: 500000, max: 1000000 },
    { label: '1tr - 2tr', min: 1000000, max: 2000000 },
    { label: 'Trên 2tr', min: 2000000, max: Infinity }
  ], []);

  const categories = useMemo(() => {
    return [{ id: 'all', name: 'Tất cả', slug: null }, ...supabaseCategories];
  }, [supabaseCategories]);

  // Đồng bộ UI state với URL
  useEffect(() => {
    if (filters.minPrice || filters.maxPrice) {
      const matchedRange = priceRanges.find(r => String(r.min) === filters.minPrice && String(r.max) === filters.maxPrice);
      setPriceRange(matchedRange || null);
    } else {
      setPriceRange(null);
    }
  }, [filters, priceRanges]);

  // HANDLERS
  const updateUrlParams = (newParams) => {
    const currentParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });
    setSearchParams(currentParams);
  };

  const handleCategoryChange = (categorySlug) => {
    if (categorySlug) {
      navigate(`/category/${categorySlug}`);
    } else {
      navigate('/products');
    }
    setShowMobileFilters(false);
  };

  const handlePriceChange = (range) => {
    const isClearing = priceRange?.label === range.label;
    setPriceRange(isClearing ? null : range);
    updateUrlParams({
      minPrice: isClearing ? null : range.min,
      maxPrice: isClearing ? null : range.max === Infinity ? null : range.max
    });
    setShowMobileFilters(false);
  };

  const handleSortChange = (sortByValue) => {
    updateUrlParams({ sort: sortByValue === 'newest' ? null : sortByValue });
  };
  
  const handleClearFilters = () => {
    setPriceRange(null);
    navigate('/products');
    setShowMobileFilters(false);
  };

  const isLoading = productsLoading || categoriesLoading;

  // Đếm số lượng filter đang active (bỏ search)
  const activeFiltersCount = [
    filters.category,
    filters.onSale,
    priceRange
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ============================= */}
      {/* DESKTOP FILTERS - Hidden on Mobile */}
      {/* ============================= */}
      <div className="hidden md:block border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="pb-3 space-y-3 pt-3">
            {/* Categories */}
            <div>
              <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-600">Danh mục</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => handleCategoryChange(cat.slug)} 
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      filters.category === cat.slug 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-600">Khoảng giá & Khuyến mãi</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => updateUrlParams({ onSale: filters.onSale ? null : 'true' })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      filters.onSale
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Đang giảm giá
                  </button>

                  <div className="h-4 w-px bg-gray-200 mx-1"></div>
                  
                  {priceRanges.map((range, index) => (
                    <button 
                      key={index} 
                      onClick={() => handlePriceChange(range)} 
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        priceRange?.label === range.label 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className='flex-shrink-0'>
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-600">Sắp xếp</h3>
                <select 
                  value={filters.sortBy} 
                  onChange={(e) => handleSortChange(e.target.value)} 
                  className="w-full sm:w-auto px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-xs bg-white cursor-pointer"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá: Thấp → Cao</option>
                  <option value="price-desc">Giá: Cao → Thấp</option>
                  <option value="name-asc">Tên: A → Z</option>
                  <option value="name-desc">Tên: Z → A</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* MOBILE FILTERS BAR - Compact buttons */}
      {/* ============================= */}
      <div className="md:hidden border-b border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* Filter Button */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${
                activeFiltersCount > 0
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>Bộ lọc</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <select 
              value={filters.sortBy} 
              onChange={(e) => handleSortChange(e.target.value)} 
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:border-black flex-shrink-0"
            >
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="name-asc">A → Z</option>
              <option value="name-desc">Z → A</option>
            </select>

            {/* Active Filters Tags */}
            {filters.onSale && (
              <span className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
                Giảm giá
                <button onClick={() => updateUrlParams({ onSale: null })} className="hover:bg-red-200 rounded-full p-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
            
            {priceRange && (
              <span className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
                {priceRange.label}
                <button onClick={() => handlePriceChange(priceRange)} className="hover:bg-blue-200 rounded-full p-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* MOBILE FILTER DRAWER */}
      {/* ============================= */}
      {showMobileFilters && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Bộ lọc</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-700">Danh mục</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.slug)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                        filters.category === cat.slug
                          ? 'bg-black text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sale Filter */}
              <div>
                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-700">Khuyến mãi</h3>
                <button
                  onClick={() => updateUrlParams({ onSale: filters.onSale ? null : 'true' })}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                    filters.onSale
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  Đang giảm giá
                </button>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-700">Khoảng giá</h3>
                <div className="space-y-2">
                  {priceRanges.map((range, index) => (
                    <button
                      key={index}
                      onClick={() => handlePriceChange(range)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                        priceRange?.label === range.label
                          ? 'bg-black text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
              <button
                onClick={handleClearFilters}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Xem {allProducts.length} sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS GRID */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-black" />
            </div>
          ) : allProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {allProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={onAddToCart} 
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <h3 className="text-xl md:text-2xl font-bold text-gray-700 mb-3">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-500 mb-6 text-sm md:text-base">Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.</p>
              <button 
                onClick={handleClearFilters} 
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium text-sm md:text-base"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      <QuickViewModal 
        product={quickViewProduct} 
        isOpen={!!quickViewProduct} 
        onClose={() => setQuickViewProduct(null)} 
        onAddToCart={onAddToCart}
      />

      {/* CSS for hiding scrollbar on mobile filter tags */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ProductsPage;