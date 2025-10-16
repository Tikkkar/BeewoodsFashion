import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import QuickViewModal from '../components/products/QuickViewModal';
import { useProducts, useCategories } from '../hooks/useProducts';

const ProductsPage = ({ onAddToCart }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug: categorySlugFromUrl } = useParams();

  // ==================================================================
  // ✨ SỬA LỖI #1: Luôn lấy bộ lọc từ URL để đảm bảo đồng bộ
  // ==================================================================
  const filters = useMemo(() => ({
    search: searchParams.get('search') || '',
    category: categorySlugFromUrl || null,
    sortBy: searchParams.get('sort') || 'newest',
    minPrice: searchParams.get('minPrice') || null,
    maxPrice: searchParams.get('maxPrice') || null,
    onSale: searchParams.get('onSale') === 'true',
  }), [searchParams, categorySlugFromUrl]);

  // UI STATE (dùng để điều khiển các ô input, select...)
  const [searchQuery, setSearchQuery] = useState(filters.search);
  const [priceRange, setPriceRange] = useState(null); // Sẽ được cập nhật sau
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [pageTitle, setPageTitle] = useState('Tất cả sản phẩm');
  
  // FETCH DATA: Sử dụng object `filters` đã được chuẩn hóa
  const { products: allProducts, loading: productsLoading, error: productsError } = useProducts(filters);
  const { categories: supabaseCategories, loading: categoriesLoading, error: categoriesError } = useCategories();

  // ==================================================================
  // ✨ SỬA LỖI #2: Đồng bộ state của UI với URL khi người dùng back/forward
  // ==================================================================
  useEffect(() => {
    setSearchQuery(filters.search);

    const currentCategory = supabaseCategories.find(cat => cat.slug === filters.category);
    if (currentCategory) {
      setPageTitle(currentCategory.name);
    } else if (filters.search) {
      setPageTitle(`Kết quả cho "${filters.search}"`);
    } else {
      setPageTitle('Tất cả sản phẩm');
    }

    // Đồng bộ lại state priceRange từ URL
    if (filters.minPrice || filters.maxPrice) {
      const matchedRange = priceRanges.find(r => String(r.min) === filters.minPrice && String(r.max) === filters.maxPrice);
      setPriceRange(matchedRange || null);
    } else {
      setPriceRange(null);
    }
  }, [filters, supabaseCategories]);

  const categories = useMemo(() => {
    // ✨ SỬA LỖI #3: Dùng `null` cho "Tất cả" để nhất quán
    return [{ id: 'all', name: 'Tất cả', slug: null }, ...supabaseCategories];
  }, [supabaseCategories]);
  
  const priceRanges = useMemo(() => [
    { label: 'Dưới 500k', min: 0, max: 500000 },
    { label: '500k - 1tr', min: 500000, max: 1000000 },
    { label: '1tr - 2tr', min: 1000000, max: 2000000 },
    { label: 'Trên 2tr', min: 2000000, max: Infinity }
  ], []);

  // HANDLERS: Cập nhật URL thay vì chỉ cập nhật state
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
  };

  const handlePriceChange = (range) => {
    const isClearing = priceRange?.label === range.label;
    setPriceRange(isClearing ? null : range);
    updateUrlParams({
      minPrice: isClearing ? null : range.min,
      maxPrice: isClearing ? null : range.max === Infinity ? null : range.max
    });
  };

  const handleSortChange = (sortByValue) => {
    updateUrlParams({ sort: sortByValue === 'newest' ? null : sortByValue });
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrlParams({ search: searchQuery });
  };

  const handleClearFilters = () => {
    setPriceRange(null);
    navigate('/products');
  };

  const isLoading = productsLoading || categoriesLoading;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-gray-900 text-white flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{pageTitle}</h1>
          <p className="text-gray-300 text-sm">
            {isLoading ? 'Đang tìm kiếm...' : `${allProducts.length} sản phẩm`}
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white sticky top-[64px] md:top-[80px] z-30 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="py-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className={`flex items-center border-2 rounded-lg transition-all ${searchFocused ? 'border-black shadow-md' : 'border-gray-300'}`}>
                <Search size={20} className="ml-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Tìm kiếm theo tên sản phẩm..."
                  className="flex-1 px-4 py-2.5 focus:outline-none"
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(''); updateUrlParams({ search: null }); }} className="mr-2 p-1.5 hover:bg-gray-100 rounded-full transition">
                    <X size={18} className="text-gray-500" />
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="pb-3 space-y-3 border-t pt-3">
            <div>
              <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-600">Danh mục</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => handleCategoryChange(cat.slug)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filters.category === cat.slug ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-600">Khoảng giá & Khuyến mãi</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  {/* ✨ BƯỚC 2: Thêm nút bấm lọc sản phẩm giảm giá */}
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

                  <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block"></div>
                  
                  {priceRanges.map((range, index) => (
                    <button key={index} onClick={() => handlePriceChange(range)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${priceRange?.label === range.label ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className='flex-shrink-0'>
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-600">Sắp xếp</h3>
                <select value={filters.sortBy} onChange={(e) => handleSortChange(e.target.value)} className="w-full sm:w-auto px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-xs bg-white cursor-pointer">
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

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-black" />
            </div>
          ) : allProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onQuickView={setQuickViewProduct}/>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-2xl font-bold text-gray-700 mb-3">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.</p>
              <button onClick={handleClearFilters} className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium">
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      <QuickViewModal product={quickViewProduct} isOpen={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} onAddToCart={onAddToCart}/>
    </div>
  );
};

export default ProductsPage;