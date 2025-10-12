import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal, Loader2 } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import QuickViewModal from '../components/products/QuickViewModal';
import { useProducts, useCategories } from '../hooks/useProducts';

const ProductsPage = ({ onAddToCart }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { name: categoryFromUrl } = useParams();

  // =============================================
  // UI STATE
  // =============================================
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (categoryFromUrl) {
      return categoryFromUrl.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    if (searchParams.get('category')) {
      return searchParams.get('category');
    }
    return 'Tất cả';
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'default');
  const [priceRange, setPriceRange] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // =============================================
  // FETCH DATA FROM SUPABASE
  // =============================================
  
  // Get category slug from selectedCategory
  const categorySlug = selectedCategory !== 'Tất cả' 
    ? selectedCategory.toLowerCase().replace(/\s+/g, '-')
    : '';

  // Fetch products with filters
  const { products: allProducts, loading: productsLoading } = useProducts({
    category: categorySlug,
    search: searchQuery,
    sortBy: sortBy,
    minPrice: priceRange?.min,
    maxPrice: priceRange?.max,
  });

  // Fetch categories for filter
  const { categories: supabaseCategories, loading: categoriesLoading } = useCategories();

  // =============================================
  // PROCESS CATEGORIES
  // =============================================
  const categories = useMemo(() => {
    return supabaseCategories.map(cat => cat.name);
  }, [supabaseCategories]);

  // =============================================
  // PRICE RANGES
  // =============================================
  const priceRanges = [
    { label: 'Dưới 50 triệu', min: 0, max: 50000000 },
    { label: '50tr - 100tr', min: 50000000, max: 100000000 },
    { label: '100tr - 150tr', min: 100000000, max: 150000000 },
    { label: 'Trên 150tr', min: 150000000, max: Infinity }
  ];

  // =============================================
  // UPDATE URL WHEN FILTERS CHANGE
  // =============================================
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    
    if (!categoryFromUrl && selectedCategory !== 'Tất cả') {
      params.set('category', selectedCategory);
    }
    
    if (sortBy !== 'default') params.set('sort', sortBy);
    setSearchParams(params);
  }, [searchQuery, selectedCategory, sortBy, setSearchParams, categoryFromUrl]);

  // =============================================
  // HANDLERS
  // =============================================
  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    
    if (category !== 'Tất cả') {
      const categoryUrl = category.toLowerCase().replace(/\s+/g, '-');
      navigate(`/category/${categoryUrl}`);
    } else {
      navigate('/products');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Tất cả');
    setPriceRange(null);
    setSortBy('default');
    navigate('/products');
  };

  // =============================================
  // LOADING STATE
  // =============================================
  const isLoading = productsLoading || categoriesLoading;

  // =============================================
  // RENDER
  // =============================================
  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Compact Header Banner */}
      <div className="bg-gray-900 text-white flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Bộ Sưu Tập Sản Phẩm
          </h1>
          <p className="text-gray-300 text-sm">
            {isLoading ? 'Đang tải...' : `${allProducts.length} sản phẩm`}
          </p>
        </div>
      </div>

      {/* Collapsible Search & Filters Bar - Sticky */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-30 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Toggle Buttons Row */}
          <div className="flex items-center gap-3 py-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm"
            >
              <Search size={18} />
              <span>Tìm kiếm</span>
              {showSearch ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm"
            >
              <SlidersHorizontal size={18} />
              <span>Bộ lọc</span>
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {(searchQuery || selectedCategory !== 'Tất cả' || priceRange) && (
              <button
                onClick={handleClearFilters}
                className="ml-auto text-sm text-red-600 hover:text-red-700 underline"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Collapsible Search */}
          {showSearch && (
            <div className="pb-3">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className={`flex items-center border-2 rounded-lg transition-all ${
                  searchFocused ? 'border-black shadow-md' : 'border-gray-300'
                }`}>
                  <Search size={20} className="ml-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="flex-1 px-4 py-2.5 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="mr-2 p-1.5 hover:bg-gray-100 rounded-full transition"
                    >
                      <X size={18} className="text-gray-500" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="pb-3 space-y-3 border-t pt-3">
              
              {/* Category Filter */}
              <div>
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-600">Danh mục</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategoryChange('Tất cả')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      selectedCategory === 'Tất cả'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        selectedCategory === cat
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range & Sort in one row */}
              <div className="flex flex-wrap gap-4">
                {/* Price Range Filter */}
                <div className="flex-1 min-w-[200px]">
                  <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-600">Khoảng giá</h3>
                  <div className="flex flex-wrap gap-2">
                    {priceRanges.map((range, index) => (
                      <button
                        key={index}
                        onClick={() => setPriceRange(priceRange?.label === range.label ? null : range)}
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

                {/* Sort */}
                <div>
                  <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-600">Sắp xếp</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-xs bg-white cursor-pointer"
                  >
                    <option value="default">Mặc định</option>
                    <option value="newest">Mới nhất</option>
                    <option value="price-asc">Giá: Thấp → Cao</option>
                    <option value="price-desc">Giá: Cao → Thấp</option>
                    <option value="name-asc">Tên: A → Z</option>
                    <option value="name-desc">Tên: Z → A</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Products Grid - Takes remaining height */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black" />
                <p className="text-gray-600">Đang tải sản phẩm...</p>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && allProducts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {allProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && allProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-6">
                <svg className="w-32 h-32 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-gray-500 mb-6">
                Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
              </p>
              <button
                onClick={handleClearFilters}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={onAddToCart}
      />
    </div>
  );
};

export default ProductsPage;