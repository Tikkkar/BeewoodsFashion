import { supabase } from '../supabase';

// =============================================
// FETCH ALL PRODUCTS
// =============================================
export const fetchProducts = async (filters = {}) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        id, name, slug, description, price, original_price, stock, is_featured,
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
      // ✨ BỔ SUNG: BỘ LỌC SẢN PHẨM GIẢM GIÁ
    if (filters.onSale) {
      query = query
        .not('original_price', 'is', null) // Phải có giá gốc
        .filter('price', 'lt', 'original_price'); // Và giá bán phải NHỎ HƠN giá gốc
    }
    // ✨ SỬA LỖI: Chuyển đổi giá trị bộ lọc giá thành số
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
    
    // ✨ SỬA LỖI: Bổ sung logic sắp xếp theo tên Z-A
    if (filters.sortBy === 'price-asc') {
        query = query.order('price', { ascending: true });
    } else if (filters.sortBy === 'price-desc') {
        query = query.order('price', { ascending: false });
    } else if (filters.sortBy === 'name-asc') {
        query = query.order('name', { ascending: true });
    } else if (filters.sortBy === 'name-desc') {
        query = query.order('name', { ascending: false });
    } else { // Mặc định là mới nhất
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`No products found for category slug: ${filters.category}`);
        return { data: [], error: null };
      }
      console.error('❌ Supabase error:', error);
      throw error;
    }

    const transformedData = data?.map(product => {
      const sortedImages = product.product_images?.sort((a, b) => (a.display_order || 99) - (b.display_order || 99));
      const primaryImage = sortedImages?.find(img => img.is_primary) || sortedImages?.[0];
      const secondaryImage = sortedImages?.find(img => !img.is_primary) || sortedImages?.[1];

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: parseFloat(product.price),
        originalPrice: product.original_price ? parseFloat(product.original_price) : null,
        category: product.categories.name || 'Uncategorized', 
        imagePrimary: primaryImage?.image_url || '/placeholder.png',
        imageSecondary: secondaryImage?.image_url,
      };
    }) || [];

    return { data: transformedData, error: null };

  } catch (error) {
    console.error('❌ Fetch products error:', error);
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
            id, name, slug, description, price, original_price, stock, is_featured, view_count,
            categories!inner(id, name, slug),
            product_images (image_url, is_primary, display_order),
            product_sizes (size, stock)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error) {
      console.error('❌ Product fetch error:', error);
      throw error;
    }

    const sortedImages = data.product_images?.sort((a, b) => (a.display_order || 99) - (b.display_order || 99));
    const primaryImage = sortedImages?.find(img => img.is_primary) || sortedImages?.[0];

    const product = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: parseFloat(data.price),
      originalPrice: data.original_price ? parseFloat(data.original_price) : null,
      category: data.categories.name,
      categorySlug: data.categories.slug,
      image: (primaryImage?.image_url || '/placeholder.png'),
      images: sortedImages?.map(img => img.image_url) || [],
      sizes: data.product_sizes?.map(s => ({ size: s.size, stock: s.stock })) || [],
      stock: data.stock,
      featured: data.is_featured,
      viewCount: data.view_count || 0
    };

    // Tăng view count
    supabase
      .rpc('increment_view_count', { product_id_to_inc: data.id })
      .then(({ error: rpcError }) => {
        if (rpcError) console.error('View count update failed:', rpcError);
      });

    return { data: product, error: null };

  } catch (error) {
    console.error('❌ Fetch product error:', error);
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
    console.error('❌ Fetch categories error:', error);
    return { data: [], error: error.message };
  }
};

// =============================================
// FETCH BANNERS
// =============================================
export const fetchBanners = async () => {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('id, title, subtitle, image_url, button_text, button_link, display_order')
            .eq('is_active', true)
            .order('display_order', { ascending: true })
            .limit(10);

        if (error) throw error;
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
                id, name, slug, price,
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
                category: product.categories?.name || 'Uncategorized',
                image: (primaryImage?.image_url || '/placeholder.png')
            };
        }) || [];
        return { data: transformedData, error: null };
    } catch (error) {
        console.error('❌ Search error:', error);
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
                id, name, slug, price, original_price,
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
                category: product.categories?.name || 'Uncategorized',
                image: (primaryImage?.image_url || '/placeholder.png')
            };
        }) || [];
        return { data: transformedData, error: null };
    } catch (error) {
        console.error('❌ Featured products error:', error);
        return { data: [], error: error.message };
    }
};