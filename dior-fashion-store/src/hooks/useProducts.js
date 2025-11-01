import { useState, useEffect } from 'react';
import { fetchProducts, fetchProductBySlug, fetchCategories, fetchBanners } from '../lib/api/products';

// =============================================
// HOOK: USE PRODUCTS
// =============================================
export const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const loadProducts = async () => {
      try {
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            setError('Không thể tải sản phẩm. Vui lòng thử lại.');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchProducts(filters);
        
        clearTimeout(timeoutId);

        if (!mounted) return;

        if (fetchError) {
          // console.error('❌ Products fetch error:', fetchError); // Đã loại bỏ console.error
          setError(fetchError);
          setProducts([]);
        } else {
          setProducts(data || []);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
        // console.error('❌ Products fetch exception:', err); // Đã loại bỏ console.error
        setError(err.message);
        setProducts([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [JSON.stringify(filters)]);

  return { products, loading, error };
};

// =============================================
// HOOK: USE PRODUCT DETAIL
// =============================================
export const useProductDetail = (slug) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let timeoutId;

    const loadProduct = async () => {
      try {
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            // console.error('⏱️ Product fetch timeout'); // Đã loại bỏ console.error
            setError('Không thể tải sản phẩm');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchProductBySlug(slug);
        
        clearTimeout(timeoutId);

        if (!mounted) return;

        if (fetchError) {
          // console.error('❌ Product fetch error:', fetchError); // Đã loại bỏ console.error
          setError(fetchError);
          setProduct(null);
        } else {
          
          // PARSE ATTRIBUTES NẾU LÀ STRING
          if (data && data.attributes) {
            if (typeof data.attributes === 'string') {
              try {
                data.attributes = JSON.parse(data.attributes);
              } catch (e) {
                // console.error('❌ Error parsing attributes:', e); // Đã loại bỏ console.error
                data.attributes = {};
              }
            }
          } else if (data) {
            // Nếu không có attributes, set default empty object
            data.attributes = {};
          }
          const hasContentBlocks = 
            data?.attributes?.content_blocks && 
            Array.isArray(data.attributes.content_blocks) &&
            data.attributes.content_blocks.length > 0;
          
          // if (hasContentBlocks) {
          //   console.table(data.attributes.content_blocks); // Đã loại bỏ console.table
          // }
          // console.groupEnd(); // Đã loại bỏ console.groupEnd
          
          setProduct(data);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
        // console.error('❌ Product fetch exception:', err); // Đã loại bỏ console.error
        setError(err.message);
        setProduct(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [slug]);

  return { product, loading, error };
};

// =============================================
// HOOK: USE CATEGORIES
// =============================================
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const loadCategories = async () => {
      try {
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            // console.error('⏱️ Categories fetch timeout'); // Đã loại bỏ console.error
            setError('Không thể tải danh mục');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchCategories();
        
        clearTimeout(timeoutId);

        if (!mounted) return;

        if (fetchError) {
          // console.error('❌ Categories fetch error:', fetchError); // Đã loại bỏ console.error
          setError(fetchError);
          setCategories([]);
        } else {
          setCategories(data || []);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
        // console.error('❌ Categories fetch exception:', err); // Đã loại bỏ console.error
        setError(err.message);
        setCategories([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { categories, loading, error };
};

// =============================================
// HOOK: USE BANNERS
// =============================================
export const useBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const loadBanners = async () => {
      try {
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            // console.error('⏱️ Banners fetch timeout'); // Đã loại bỏ console.error
            setError('Không thể tải banners');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchBanners();
        
        clearTimeout(timeoutId);

        if (!mounted) return;

        if (fetchError) {
          // console.error('❌ Banners fetch error:', fetchError); // Đã loại bỏ console.error
          setError(fetchError);
          setBanners([]);
        } else {
          setBanners(data || []);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
        // console.error('❌ Banners fetch exception:', err); // Đã loại bỏ console.error
        setError(err.message);
        setBanners([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadBanners();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { banners, loading, error };
};