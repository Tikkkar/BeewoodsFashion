import { useState, useEffect } from 'react';
import { fetchProducts, fetchProductBySlug, fetchProductById, fetchCategories, fetchBanners } from '../lib/api/products';

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
          setError(fetchError);
          setProducts([]);
        } else {
          setProducts(data || []);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
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
// HOOK: USE PRODUCT BY ID (for QuickView)
// =============================================
export const useProductById = (productId) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    let timeoutId;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        timeoutId = setTimeout(() => {
          if (mounted) {
            setError('Không thể tải chi tiết sản phẩm');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchProductById(productId);
        
        clearTimeout(timeoutId);

        if (!mounted) return;

        if (fetchError) {
          setError(fetchError);
          setProduct(null);
        } else {
          setProduct(data);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
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
  }, [productId]);

  return { product, loading, error };
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
            setError('Không thể tải sản phẩm');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchProductBySlug(slug);
        
        clearTimeout(timeoutId);

        if (!mounted) return;

        if (fetchError) {
          setError(fetchError);
          setProduct(null);
        } else {
          
          // PARSE ATTRIBUTES NẾU LÀ STRING
          if (data && data.attributes) {
            if (typeof data.attributes === 'string') {
              try {
                data.attributes = JSON.parse(data.attributes);
              } catch (e) {
                data.attributes = {};
              }
            }
          } else if (data) {
            data.attributes = {};
          }
          
          setProduct(data);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
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
            setError('Không thể tải danh mục');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchCategories();
        
        clearTimeout(timeoutId);

        if (!mounted) return;

        if (fetchError) {
          setError(fetchError);
          setCategories([]);
        } else {
          setCategories(data || []);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
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
            setError('Không thể tải banners');
            setLoading(false);
          }
        }, 10000);

        const { data, error: fetchError } = await fetchBanners();
        
        clearTimeout(timeoutId);

        if (!mounted) return;

        if (fetchError) {
          setError(fetchError);
          setBanners([]);
        } else {
          setBanners(data || []);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
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