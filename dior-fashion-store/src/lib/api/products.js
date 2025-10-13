import { supabase } from '../supabase';

// =============================================
// FETCH ALL PRODUCTS (OPTIMIZED)
// =============================================
export const fetchProducts = async (filters = {}) => {
  try {
    console.log('🚀 Fetching products with filters:', filters);

    // OPTIMIZED: Chỉ select fields cần thiết
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        original_price,
        stock,
        is_featured,
        category_id,
        categories!inner(name, slug),
        product_images!inner(image_url, is_primary, display_order)
      `)
      .eq('is_active', true)
      .limit(filters.limit || 50) // LIMIT mặc định
      .order('created_at', { ascending: false });

    // Apply category filter
    if (filters.category) {
      query = query.eq('categories.slug', filters.category);
    }

    // Apply featured filter
    if (filters.featured) {
      query = query.eq('is_featured', true);
    }

    // Apply search filter (tối ưu với ilike)
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Apply price filters
    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    // Apply sorting
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
        case 'newest':
        default:
          // Already ordered by created_at desc
          break;
      }
    }

    // Execute with timeout protection
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 8s')), 8000)
    );

    const { data, error } = await Promise.race([query, timeoutPromise]);

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    // Transform data (lightweight)
    const transformedData = data?.map(product => {
      const primaryImage = product.product_images?.find(img => img.is_primary);
      const firstImage = product.product_images?.[0];
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: parseFloat(product.price),
        originalPrice: product.original_price ? parseFloat(product.original_price) : null,
        category: product.categories?.name || 'Uncategorized',
        categorySlug: product.categories?.slug || '',
        image: (primaryImage?.image_url || firstImage?.image_url || '/placeholder.png'),
        images: product.product_images
          ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map(img => img.image_url) || [],
        stock: product.stock,
        featured: product.is_featured
      };
    }) || [];

    console.log('✅ Products loaded:', transformedData.length);
    return { data: transformedData, error: null };

  } catch (error) {
    console.error('❌ Fetch products error:', error);
    return { data: null, error: error.message };
  }
};

// =============================================
// FETCH SINGLE PRODUCT BY SLUG (OPTIMIZED)
// =============================================
export const fetchProductBySlug = async (slug) => {
  try {
    console.log('🚀 Fetching product:', slug);

    // OPTIMIZED: Single query với minimal data
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 8s')), 8000)
    );

    const { data, error } = await Promise.race([
      supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          description,
          price,
          original_price,
          stock,
          is_featured,
          view_count,
          categories(id, name, slug),
          product_images(image_url, is_primary, display_order),
          product_sizes(size, stock)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single(),
      timeoutPromise
    ]);

    if (error) {
      console.error('❌ Product fetch error:', error);
      throw error;
    }

    // Transform product
    const primaryImage = data.product_images?.find(img => img.is_primary);
    const firstImage = data.product_images?.[0];

    const product = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: parseFloat(data.price),
      originalPrice: data.original_price ? parseFloat(data.original_price) : null,
      category: data.categories?.name || 'Uncategorized',
      categorySlug: data.categories?.slug || '',
      image: (primaryImage?.image_url || firstImage?.image_url || '/placeholder.png'),
      images: data.product_images
        ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map(img => img.image_url) || [],
      sizes: data.product_sizes?.map(s => ({ 
        size: s.size, 
        stock: s.stock 
      })) || [],
      stock: data.stock,
      featured: data.is_featured,
      viewCount: data.view_count || 0
    };

    // ASYNC: Increment view count (không chờ để tăng tốc)
    supabase
      .from('products')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id)
      .then(() => console.log('✅ View count updated'))
      .catch(err => console.error('View count update failed:', err));

    console.log('✅ Product loaded:', product.name);
    return { data: product, error: null };

  } catch (error) {
    console.error('❌ Fetch product error:', error);
    return { data: null, error: error.message };
  }
};

// =============================================
// FETCH CATEGORIES (OPTIMIZED)
// =============================================
export const fetchCategories = async () => {
  try {
    console.log('🚀 Fetching categories...');

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 5s')), 5000)
    );

    const { data, error } = await Promise.race([
      supabase
        .from('categories')
        .select('id, name, slug, image_url, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(20), // LIMIT categories
      timeoutPromise
    ]);

    if (error) {
      console.error('❌ Categories error:', error);
      throw error;
    }

    console.log('✅ Categories loaded:', data?.length || 0);
    return { data: data || [], error: null };

  } catch (error) {
    console.error('❌ Fetch categories error:', error);
    return { data: [], error: error.message };
  }
};

// =============================================
// FETCH BANNERS (OPTIMIZED)
// =============================================
export const fetchBanners = async () => {
  try {
    console.log('🚀 Fetching banners...');

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 5s')), 5000)
    );

    const { data, error } = await Promise.race([
      supabase
        .from('banners')
        .select('id, title, subtitle, image_url, button_text, button_link, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(10), // LIMIT banners
      timeoutPromise
    ]);

    if (error) {
      console.error('❌ Banners error:', error);
      throw error;
    }

    console.log('✅ Banners loaded:', data?.length || 0);
    return { data: data || [], error: null };

  } catch (error) {
    console.error('❌ Fetch banners error:', error);
    return { data: [], error: error.message };
  }
};

// =============================================
// SEARCH PRODUCTS (OPTIMIZED)
// =============================================
export const searchProducts = async (searchTerm) => {
  try {
    console.log('🔍 Searching products:', searchTerm);

    if (!searchTerm || searchTerm.trim().length < 2) {
      return { data: [], error: null };
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Search timeout')), 5000)
    );

    const { data, error } = await Promise.race([
      supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price,
          categories(name),
          product_images!inner(image_url, is_primary)
        `)
        .eq('is_active', true)
        .ilike('name', `%${searchTerm.trim()}%`)
        .limit(10)
        .order('view_count', { ascending: false }), // Popular first
      timeoutPromise
    ]);

    if (error) {
      console.error('❌ Search error:', error);
      throw error;
    }

    const transformedData = data?.map(product => {
      const primaryImage = product.product_images?.find(img => img.is_primary);
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: parseFloat(product.price),
        category: product.categories?.name || 'Uncategorized',
        image: (primaryImage?.image_url || product.product_images?.[0]?.image_url || '/placeholder.png')
      };
    }) || [];

    console.log('✅ Search results:', transformedData.length);
    return { data: transformedData, error: null };

  } catch (error) {
    console.error('❌ Search error:', error);
    return { data: [], error: error.message };
  }
};

// =============================================
// FETCH FEATURED PRODUCTS (NEW - OPTIMIZED)
// =============================================
export const fetchFeaturedProducts = async (limit = 8) => {
  try {
    console.log('🌟 Fetching featured products...');

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 5000)
    );

    const { data, error } = await Promise.race([
      supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price,
          original_price,
          categories(name),
          product_images!inner(image_url, is_primary)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(limit)
        .order('created_at', { ascending: false }),
      timeoutPromise
    ]);

    if (error) throw error;

    const transformedData = data?.map(product => {
      const primaryImage = product.product_images?.find(img => img.is_primary);
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: parseFloat(product.price),
        originalPrice: product.original_price ? parseFloat(product.original_price) : null,
        category: product.categories?.name || 'Uncategorized',
        image: (primaryImage?.image_url || product.product_images?.[0]?.image_url || '/placeholder.png')
      };
    }) || [];

    console.log('✅ Featured products loaded:', transformedData.length);
    return { data: transformedData, error: null };

  } catch (error) {
    console.error('❌ Featured products error:', error);
    return { data: [], error: error.message };
  }
};