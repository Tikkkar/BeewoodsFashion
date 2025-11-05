import { supabase } from '../supabase';

// =============================================
// FETCH ALL PRODUCTS
// =============================================
export const fetchProducts = async (filters = {}) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        id, name, slug, description, price, original_price, stock, is_featured, brand_name,
        categories!inner( id, name, slug ),
        product_images!inner(image_url, is_primary, display_order)
      `)
      .eq('is_active', true)
      .limit(filters.limit || 50);

    if (filters.featured) {
      query = query.eq('is_featured', true);
    }

    if (filters.category) {
      query = query.eq('categories.slug', filters.category);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // BỘ LỌC SẢN PHẨM GIẢM GIÁ
    if (filters.onSale) {
      query = query
        .not('original_price', 'is', null) // Phải có giá gốc
        .filter('price', 'lt', 'original_price'); // Giá hiện tại < giá gốc
    }

    // Lọc theo giá
    if (filters.minPrice) {
      const minPrice = parseInt(filters.minPrice, 10);
      if (!isNaN(minPrice)) {
        query = query.gte('price', minPrice);
      }
    }
    if (filters.maxPrice) {
      const maxPrice = parseInt(filters.maxPrice, 10);
      if (!isNaN(maxPrice)) {
        query = query.lte('price', maxPrice);
      }
    }

    // Sắp xếp
    if (filters.sortBy === 'price-asc') {
      query = query.order('price', { ascending: true });
    } else if (filters.sortBy === 'price-desc') {
      query = query.order('price', { ascending: false });
    } else if (filters.sortBy === 'name-asc') {
      query = query.order('name', { ascending: true });
    } else if (filters.sortBy === 'name-desc') {
      query = query.order('name', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: [], error: null };
      }
      throw error;
    }

    const transformedData = data?.map(product => {
      const sortedImages = product.product_images?.sort(
        (a, b) => (a.display_order || 99) - (b.display_order || 99)
      );
      const primaryImage = sortedImages?.find(img => img.is_primary) || sortedImages?.[0];
      const secondaryImage = sortedImages?.find(img => !img.is_primary) || sortedImages?.[1];

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: parseFloat(product.price),
        originalPrice: product.original_price ? parseFloat(product.original_price) : null,
        category: product.categories?.name || null, // null nếu không có category
        imagePrimary: primaryImage?.image_url || '/placeholder.png',
        imageSecondary: secondaryImage?.image_url || null,
        brandName: product.brand_name || null, // <-- brand
      };
    }) || [];

    return { data: transformedData, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// =============================================
// FETCH PRODUCT BY SLUG
// =============================================
export const fetchProductBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories!inner(id, name, slug),
        product_images (
          id,
          image_url,
          is_primary,
          display_order
        ),
        product_sizes (
          id,
          size,
          stock
        ),
        reviews (
          id,
          rating,
          comment,
          user_id,
          is_verified_purchase,
          created_at
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Product not found' };
    }

    // PARSE ATTRIBUTES NẾU LÀ STRING
    if (data.attributes) {
      if (typeof data.attributes === 'string') {
        try {
          data.attributes = JSON.parse(data.attributes);
        } catch (e) {
          data.attributes = {};
        }
      }
    } else {
      data.attributes = {};
    }

    // Transform data
    const transformedData = {
      ...data,
      images: data.product_images
        ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map(img => img.image_url) || [],
      sizes: data.product_sizes
        ?.map(s => s.size)
        .filter(Boolean) || [],
      reviews: data.reviews || [],
      category: data.categories?.name || null,
      brandName: data.brand_name || null, // <-- brand
    };

    return { data: transformedData, error: null };
  } catch (error) {
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
      .select('id, name, slug, image_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(20);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// =============================================
// FETCH BANNERS - ✅ FIXED
// =============================================
export const fetchBanners = async () => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select(`
        id,
        title,
        subtitle,
        image_url,
        mobile_image_url,
        button_text,
        button_link,
        display_order,
        is_active,
        text_color,
        title_size,
        subtitle_size,
        button_style,
        text_position,
        overlay_opacity,
        animation,
        start_date,
        end_date,
        height_mobile,
        height_tablet,
        height_desktop,
        height_large,
        show_content,
        created_at
      `)
      .order('display_order', { ascending: true })
      .limit(10);

    if (error) throw error;

    console.log('✅ Fetched banners from API:', data);

    return { data: data || [], error: null };
  } catch (error) {
    console.error('❌ Fetch banners error:', error);
    return { data: [], error: error.message };
  }
};

// =============================================
// SEARCH PRODUCTS
// =============================================
export const searchProducts = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { data: [], error: null };
    }
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, price, brand_name,
        categories!inner(name),
        product_images!inner(image_url, is_primary)
      `)
      .eq('is_active', true)
      .ilike('name', `%${searchTerm.trim()}%`)
      .limit(10)
      .order('view_count', { ascending: false });

    if (error) throw error;

    const transformedData = data?.map(product => {
      const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: parseFloat(product.price),
        category: product.categories?.name || null,
        image: (primaryImage?.image_url || '/placeholder.png'),
        brandName: product.brand_name || null, // <-- brand
      };
    }) || [];
    return { data: transformedData, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// =============================================
// FETCH FEATURED PRODUCTS
// =============================================
export const fetchFeaturedProducts = async (limit = 8) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, price, original_price, brand_name,
        categories!inner(name),
        product_images!inner(image_url, is_primary)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transformedData = data?.map(product => {
      const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: parseFloat(product.price),
        originalPrice: product.original_price ? parseFloat(product.original_price) : null,
        category: product.categories?.name || null,
        image: (primaryImage?.image_url || '/placeholder.png'),
        brandName: product.brand_name || null, // <-- brand
      };
    }) || [];
    return { data: transformedData, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// =============================================
// FETCH PRODUCT BY ID (for QuickView)
// =============================================
export const fetchProductById = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, description, price, original_price, stock, is_featured, brand_name,
        categories!inner(id, name, slug),
        product_images (
          id,
          image_url,
          is_primary,
          display_order
        ),
        product_sizes (
          id,
          size,
          stock
        ),
        reviews (
          id,
          rating,
          comment,
          user_id,
          is_verified_purchase,
          created_at
        )
      `)
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    if (!data) {
      return { data: null, error: 'Product not found' };
    }

    // Parse attributes if string
    if (data.attributes && typeof data.attributes === 'string') {
      try {
        data.attributes = JSON.parse(data.attributes);
      } catch (e) {
        data.attributes = {};
      }
    } else {
      data.attributes = data.attributes || {};
    }

    const sortedImages = (data.product_images || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const images = sortedImages.map((i) => i.image_url).filter(Boolean);
    const imagePrimary = sortedImages.find((i) => i.is_primary)?.image_url || images[0] || '/placeholder.png';

    const transformed = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price ? parseFloat(data.price) : 0,
      originalPrice: data.original_price ? parseFloat(data.original_price) : null,
      stock: data.stock,
      category: data.categories?.name || null,
      categorySlug: data.categories?.slug || null,
      brandName: data.brand_name || null,
      images,
      imagePrimary,
      sizes: (data.product_sizes || []).map((s) => s.size).filter(Boolean),
      reviews: data.reviews || [],
      isFeatured: data.is_featured,
      viewCount: data.view_count,
      attributes: data.attributes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { data: transformed, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};