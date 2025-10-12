import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import QuickViewModal from '../components/products/QuickViewModal';

const ProductsPage = ({ products, onAddToCart }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { name: categoryFromUrl } = useParams();

  // Category name mapping - Maps navigation items to actual product categories
  const CATEGORY_MAPPING = {
    'bags': ['Bags', 'Handbags'],
    'handbags': ['Bags', 'Handbags'],
    'ready-to-wear': ['Ready-to-Wear'],
    'haute-couture': ['Haute Couture'],
    'accessories': ['Accessories'],
    // Navigation categories that should show multiple product categories
    'women': ['Ready-to-Wear', 'Haute Couture', 'Bags', 'Handbags', 'Accessories'],
    'men': ['Ready-to-Wear', 'Accessories']
  };

  // State from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => {
    // Priority: URL path > URL query param > default
    if (categoryFromUrl) {
      // Convert URL to proper category name - return as STRING
      const normalized = categoryFromUrl.toLowerCase().replace(/\s+/g, '-');
      
      // Return the capitalized category name for display
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
  
  // UI State
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  // Price ranges
  const priceRanges = [
    { label: 'Dưới 50 triệu', min: 0, max: 50000000 },
    { label: '50tr - 100tr', min: 50000000, max: 100000000 },
    { label: '100tr - 150tr', min: 100000000, max: 150000000 },
    { label: 'Trên 150tr', min: 150000000, max: Infinity }
  ];

  // Update URL when filters change (but NOT category if from URL path)
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    
    // Only set category query param if NOT from URL path
    if (!categoryFromUrl && selectedCategory !== 'Tất cả') {
      params.set('category', selectedCategory);
    }
    
    if (sortBy !== 'default') params.set('sort', sortBy);
    setSearchParams(params);
  }, [searchQuery, selectedCategory, sortBy, setSearchParams, categoryFromUrl]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Category filter - Handle both direct categories and mapped ones (Women/Men)
    if (selectedCategory !== 'Tất cả') {
      filtered = filtered.filter(p => {
        const productCat = p.category.toLowerCase();
        const selectedCat = selectedCategory.toLowerCase();
        
        // Check if selectedCategory maps to multiple categories (like Women/Men)
        const mappedCategories = CATEGORY_MAPPING[selectedCat];
        if (Array.isArray(mappedCategories)) {
          // Filter by any of the mapped categories
          return mappedCategories.some(cat => {
            const mappedCat = cat.toLowerCase();
            if (mappedCat === productCat) return true;
            // Handle Bags/Handbags equivalence
            if ((mappedCat === 'bags' || mappedCat === 'handbags') && 
                (productCat === 'bags' || productCat === 'handbags')) {
              return true;
            }
            return false;
          });
        }
        
        // Direct match
        if (productCat === selectedCat) return true;
        
        // Special case: Handbags == Bags
        if ((productCat === 'handbags' || productCat === 'bags') && 
            (selectedCat === 'handbags' || selectedCat === 'bags')) {
          return true;
        }
        
        return false;
      });
    }

    // Price range filter
    if (priceRange) {
      filtered = filtered.filter(p => 
        p.price >= priceRange.min && p.price <= priceRange.max
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, priceRange]);

  // Sort products
  const sortedProducts = useMemo(() => {
    let sorted = [...filteredProducts];

    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      default:
        break;
    }

    return sorted;
  }, [filteredProducts, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // If changing category, redirect to proper URL
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Compact Header Banner */}
      <div className="bg-gray-900 text-white flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Bộ Sưu Tập Sản Phẩm
          </h1>
          <p className="text-gray-300 text-sm">
            {sortedProducts.length} sản phẩm
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
          
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          ) : (
            /* No Results */
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