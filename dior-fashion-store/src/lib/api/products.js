import { supabase } from '../supabase';

// =============================================
// FETCH ALL PRODUCTS
// =============================================
export const fetchProducts = async (filters = {}) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(id, image_url, is_primary, display_order),
        sizes:product_sizes(id, size, stock)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.category) {
      query = query.eq('category.slug', filters.category);
    }

    if (filters.featured) {
      query = query.eq('is_featured', true);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'name-asc':
          query = query.order('name', { ascending: true });
          break;
        case 'name-desc':
          query = query.order('name', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          break;
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to match your current structure
    const transformedData = data.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: parseFloat(product.price),
      originalPrice: product.original_price ? parseFloat(product.original_price) : null,
      category: product.category?.name || 'Uncategorized',
      categorySlug: product.category?.slug || '',
      image: product.images?.find(img => img.is_primary)?.image_url || 
             product.images?.[0]?.image_url || 
             'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
      images: product.images
        ?.sort((a, b) => a.display_order - b.display_order)
        .map(img => img.image_url) || [],
      sizes: product.sizes?.map(s => s.size) || [],
      stock: product.stock,
      featured: product.is_featured,
      viewCount: product.view_count || 0,
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { data: null, error: error.message };
  }
};

// =============================================
// FETCH SINGLE PRODUCT BY SLUG
// =============================================
export const fetchProductBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(id, image_url, is_primary, display_order),
        sizes:product_sizes(id, size, stock),
        reviews:reviews(id, rating, comment, created_at, user_id)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    // Transform to match your current structure
    const product = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: parseFloat(data.price),
      originalPrice: data.original_price ? parseFloat(data.original_price) : null,
      category: data.category?.name || 'Uncategorized',
      categorySlug: data.category?.slug || '',
      image: data.images?.find(img => img.is_primary)?.image_url || 
             data.images?.[0]?.image_url || 
             'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
      images: data.images
        ?.sort((a, b) => a.display_order - b.display_order)
        .map(img => img.image_url) || [],
      sizes: data.sizes?.map(s => ({ size: s.size, stock: s.stock })) || [],
      stock: data.stock,
      featured: data.is_featured,
      viewCount: data.view_count || 0,
      reviews: data.reviews || [],
    };

    // Increment view count
    await supabase
      .from('products')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);

    return { data: product, error: null };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { data: null, error: error.message };
  }
};

// =============================================
// FETCH CATEGORIES
// =============================================
export const fetchCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: null, error: error.message };
  }
};

// =============================================
// FETCH BANNERS
// =============================================
export const fetchBanners = async () => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching banners:', error);
    return { data: null, error: error.message };
  }
};

// =============================================
// SEARCH PRODUCTS
// =============================================
export const searchProducts = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(id, image_url, is_primary, display_order)
      `)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) throw error;

    const transformedData = data.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: parseFloat(product.price),
      category: product.category?.name || 'Uncategorized',
      image: product.images?.find(img => img.is_primary)?.image_url || 
             product.images?.[0]?.image_url || 
             'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error searching products:', error);
    return { data: null, error: error.message };
  }
};