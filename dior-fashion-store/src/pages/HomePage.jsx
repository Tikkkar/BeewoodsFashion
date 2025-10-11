import React, { useState, useEffect, useMemo } from 'react';
import HeroSlider from '../components/hero/HeroSlider';
import CategoryGrid from '../components/products/CategoryGrid';
import ProductGrid from '../components/products/ProductGrid';
import BrandStory from '../components/sections/BrandStory';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/products/FilterBar';
import SortDropdown from '../components/products/SortDropdown';
import Pagination from '../components/products/Pagination';
import QuickViewModal from '../components/products/QuickViewModal';

const HomePage = ({ data, currentSlide, setCurrentSlide, onAddToCart }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const productsPerPage = 8;

  // Auto slide logic
  useEffect(() => {
    if (data.banners && data.banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % data.banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [data.banners, setCurrentSlide]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % data.banners.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + data.banners.length) % data.banners.length);
  };

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(data.products.map(p => p.category))];
  }, [data.products]);

  // Filter & Sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = data.products;

    // Filter by category
    if (selectedCategory !== 'Tất cả') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort products
    const sorted = [...filtered];
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
      default:
        // Keep original order
        break;
    }

    return sorted;
  }, [data.products, selectedCategory, searchQuery, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedProducts.length / productsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage, productsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <main className="flex-grow pt-16 md:pt-20">
      <HeroSlider
        slides={data.banners}
        currentSlide={currentSlide}
        onNext={handleNextSlide}
        onPrev={handlePrevSlide}
        onSelectSlide={setCurrentSlide}
      />
      
      <BrandStory /> 
      
      <CategoryGrid 
        categories={data.categories} 
        title="SAVOIR-FAIRE" 
      />
      
      {/* Products Section with Search, Filter, Sort & Pagination */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-light tracking-widest text-center mb-12">
            SẢN PHẨM MỚI NHẤT
          </h2>

          {/* Search Bar */}
          <SearchBar 
            onSearch={setSearchQuery}
            placeholder="Tìm kiếm sản phẩm..."
          />

          {/* Filter Bar */}
          <FilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Sort Dropdown */}
          <SortDropdown
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* Results Info */}
          <div className="mb-6 text-center text-sm text-gray-600">
            Hiển thị {paginatedProducts.length} / {filteredAndSortedProducts.length} sản phẩm
          </div>

          {/* Products Grid */}
          {paginatedProducts.length > 0 ? (
            <>
              <ProductGrid
                products={paginatedProducts}
                onAddToCart={onAddToCart}
                onQuickView={setQuickViewProduct}
              />

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-gray-500 tracking-wide mb-4">
                Không tìm thấy sản phẩm nào
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Tất cả');
                  setSortBy('default');
                }}
                className="px-6 py-3 bg-black text-white tracking-wide hover:bg-gray-800 transition-colors rounded-lg"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={onAddToCart}
      />
    </main>
  );
};

export default HomePage;