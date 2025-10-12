import { useState, useEffect } from 'react';
import { fetchProducts, fetchProductBySlug, fetchCategories, fetchBanners } from '../lib/api/products';

// =============================================
// HOOK: USE PRODUCTS
// =============================================
export const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]); // ⚡ Default []
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null); // ⚡ Reset error
      
      try {
        const { data, error: fetchError } = await fetchProducts(filters);
        
        if (fetchError) {
          setError(fetchError);
          setProducts([]); // ⚡ Set empty array on error
        } else {
          setProducts(data || []); // ⚡ Fallback to []
        }
      } catch (err) {
        console.error('Error in useProducts:', err);
        setError(err.message);
        setProducts([]); // ⚡ Set empty array on exception
      }
      
      setLoading(false);
    };

    loadProducts();
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
    const loadProduct = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await fetchProductBySlug(slug);
        
        if (fetchError) {
          setError(fetchError);
          setProduct(null);
        } else {
          setProduct(data);
        }
      } catch (err) {
        console.error('Error in useProductDetail:', err);
        setError(err.message);
        setProduct(null);
      }
      
      setLoading(false);
    };

    loadProduct();
  }, [slug]);

  return { product, loading, error };
};

// =============================================
// HOOK: USE CATEGORIES
// =============================================
export const useCategories = () => {
  const [categories, setCategories] = useState([]); // ⚡ Default []
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await fetchCategories();
        
        if (fetchError) {
          setError(fetchError);
          setCategories([]); // ⚡ Set empty array
        } else {
          setCategories(data || []); // ⚡ Fallback to []
        }
      } catch (err) {
        console.error('Error in useCategories:', err);
        setError(err.message);
        setCategories([]);
      }
      
      setLoading(false);
    };

    loadCategories();
  }, []);

  return { categories, loading, error };
};

// =============================================
// HOOK: USE BANNERS
// =============================================
export const useBanners = () => {
  const [banners, setBanners] = useState([]); // ⚡ Default []
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBanners = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await fetchBanners();
        
        if (fetchError) {
          setError(fetchError);
          setBanners([]); // ⚡ Set empty array
        } else {
          setBanners(data || []); // ⚡ Fallback to []
        }
      } catch (err) {
        console.error('Error in useBanners:', err);
        setError(err.message);
        setBanners([]);
      }
      
      setLoading(false);
    };

    loadBanners();
  }, []);

  return { banners, loading, error };
};