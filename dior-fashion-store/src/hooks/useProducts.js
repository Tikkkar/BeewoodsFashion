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
    let mounted = true; // ⚡ PREVENT STATE UPDATE AFTER UNMOUNT
    let timeoutId;

    const loadProducts = async () => {
      try {
        console.log('📦 Fetching products with filters:', filters);
        
        // ⚡ TIMEOUT - FAIL AFTER 10 SECONDS
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.error('⏱️ Products fetch timeout');
            setError('Không thể tải sản phẩm. Vui lòng thử lại.');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchProducts(filters);
        
        clearTimeout(timeoutId); // ⚡ CLEAR TIMEOUT IF SUCCESS

        if (!mounted) return; // ⚡ STOP IF UNMOUNTED

        if (fetchError) {
          console.error('❌ Products fetch error:', fetchError);
          setError(fetchError);
          setProducts([]);
        } else {
          console.log('✅ Products loaded:', data?.length || 0);
          setProducts(data || []);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
        console.error('❌ Products fetch exception:', err);
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
      mounted = false; // ⚡ CLEANUP
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [JSON.stringify(filters)]); // ⚡ STRINGIFY FOR DEEP COMPARISON

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
        console.log('📦 Fetching product:', slug);
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.error('⏱️ Product fetch timeout');
            setError('Không thể tải sản phẩm');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchProductBySlug(slug);
        
        clearTimeout(timeoutId);

        if (!mounted) return;

        if (fetchError) {
          console.error('❌ Product fetch error:', fetchError);
          setError(fetchError);
          setProduct(null);
        } else {
          console.log('✅ Product loaded:', data?.name);
          setProduct(data);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
        console.error('❌ Product fetch exception:', err);
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
        console.log('📁 Fetching categories...');
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.error('⏱️ Categories fetch timeout');
            setError('Không thể tải danh mục');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchCategories();
        
        clearTimeout(timeoutId);

        if (!mounted) return;

        if (fetchError) {
          console.error('❌ Categories fetch error:', fetchError);
          setError(fetchError);
          setCategories([]);
        } else {
          console.log('✅ Categories loaded:', data?.length || 0);
          setCategories(data || []);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
        console.error('❌ Categories fetch exception:', err);
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
        console.log('🎨 Fetching banners...');
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.error('⏱️ Banners fetch timeout');
            setError('Không thể tải banners');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchBanners();
        
        clearTimeout(timeoutId);

        if (!mounted) return;

        if (fetchError) {
          console.error('❌ Banners fetch error:', fetchError);
          setError(fetchError);
          setBanners([]);
        } else {
          console.log('✅ Banners loaded:', data?.length || 0);
          setBanners(data || []);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
        console.error('❌ Banners fetch exception:', err);
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