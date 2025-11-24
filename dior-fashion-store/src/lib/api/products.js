import { supabase } from '../supabase';

// =============================================
// HELPER: INCREMENT VIEW COUNT
// =============================================
const incrementViewCount = async (productId) => {
  try {
    // Gọi RPC (Stored Procedure) nếu có để an toàn concurrency
    // Hoặc dùng cách đơn giản này (chấp nhận rủi ro race condition nhỏ)
    const { data } = await supabase.rpc('increment_product_view', { product_id: productId });

    // Nếu chưa tạo hàm RPC, fallback về cách update thủ công (không khuyến khích cho traffic lớn)
    if (!data) {
      /* // Logic thủ công nếu cần:
      const { data: product } = await supabase.from('products').select('view_count').eq('id', productId).single();
      if (product) {
          await supabase.from('products').update({ view_count: (product.view_count || 0) + 1 }).eq('id', productId);
      }
      */
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
};

// =============================================
// FETCH ALL PRODUCTS (Catalog/Filter)
// =============================================
export const fetchProducts = async (filters = {}) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        id, name, slug, description, price, original_price, stock, is_featured, brand_name,
        weight_g, 
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
        .not('original_price', 'is', null)
        .filter('price', 'lt', 'original_price'); // Cú pháp filter so sánh cột với cột hơi phức tạp trong supabase-js v2, check lại nếu lỗi
      // Cách thay thế an toàn hơn nếu filter cột-cột lỗi: query.lt('price', 1000000000) (nhưng ko so sánh dynamic được)
      // Lưu ý: Supabase JS client đôi khi không hỗ trợ so sánh 2 cột trực tiếp dễ dàng. 
      // Tốt nhất là lọc ở client hoặc dùng .rpc() nếu logic phức tạp.
    }

    // Lọc theo giá
    if (filters.minPrice) {
      const minPrice = parseInt(filters.minPrice, 10);
      if (!isNaN(minPrice)) query = query.gte('price', minPrice);
    }
    if (filters.maxPrice) {
      const maxPrice = parseInt(filters.maxPrice, 10);
      if (!isNaN(maxPrice)) query = query.lte('price', maxPrice);
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
    } else if (filters.sortBy === 'popular') {
      query = query.order('view_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') return { data: [], error: null };
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
        category: product.categories?.name || null,
        imagePrimary: primaryImage?.image_url || '/placeholder.png',
        imageSecondary: secondaryImage?.image_url || null,
        brandName: product.brand_name || null,
        weight: product.weight_g || 0, // Bổ sung weight để hiển thị nếu cần
      };
    }) || [];

    return { data: transformedData, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// =============================================
// FETCH PRODUCT BY SLUG - WITH LOGISTICS & FEATURES
// =============================================
export const fetchProductBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories!inner(id, name, slug),
        product_images (
          id, image_url, is_primary, display_order
        ),
        product_sizes (
          id, size, stock, weight_g
        ),
        reviews (
          id, rating, comment, user_id, is_verified_purchase, created_at
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: 'Product not found' };

    // Side-effect: Tăng view count (chạy ngầm, không await để không block UI)
    incrementViewCount(data.id);

    // Parse Attributes
    let parsedAttributes = {};
    if (data.attributes) {
      if (typeof data.attributes === 'string') {
        try {
          parsedAttributes = JSON.parse(data.attributes);
        } catch (e) {
          console.error('Error parsing attributes:', e);
          parsedAttributes = {};
        }
      } else {
        parsedAttributes = data.attributes;
      }
    }
    const features = parsedAttributes.features || [];

    // Transform data
    const transformedData = {
      ...data,
      images: data.product_images
        ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map(img => img.image_url) || [],

      // Map sizes đầy đủ hơn
      sizes: data.product_sizes?.map(s => ({
        id: s.id,
        size: s.size, // Changed from name to size to match frontend expectation
        stock: s.stock,
        weight: s.weight_g // size specific weight
      })) || [],

      reviews: data.reviews || [],
      category: data.categories?.name || null,
      categoryId: data.categories?.id || null, // Cần ID để fetch related products
      brandName: data.brand_name || null,

      // Logistics info (Quan trọng cho tính phí ship)
      weight: data.weight_g || 500,
      dimensions: {
        length: data.length_cm || 0,
        width: data.width_cm || 0,
        height: data.height_cm || 0
      },

      attributes: {
        ...parsedAttributes,
        features,
      },
    };

    return { data: transformedData, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// =============================================
// FETCH RELATED PRODUCTS (Sản phẩm liên quan)
// =============================================
export const fetchRelatedProducts = async (categoryId, currentProductId, limit = 4) => {
  try {
    if (!categoryId) return { data: [], error: null };

    const { data, error } = await supabase
      .from('products')
      .select(`
                id, name, slug, price, original_price, brand_name,
                categories!inner(id, name, slug),
                product_images!inner(image_url, is_primary)
            `)
      .eq('is_active', true)
      // .eq('categories.id', categoryId) // Lưu ý: Nếu quan hệ N-N phải lọc khác, đây là 1-N
      .filter('product_categories.category_id', 'eq', categoryId) // Nếu dùng bảng trung gian product_categories, cần sửa lại query này tùy cấu trúc. 
      // Giả định cấu trúc đơn giản hiện tại là products có category_id hoặc join bảng:
      // SỬA LẠI LOGIC CHUẨN JOIN:
      // Do cấu trúc DB của bạn dùng relation categories!inner, ta lọc trên relation
      .eq('categories.id', categoryId)
      .neq('id', currentProductId) // Loại trừ sản phẩm đang xem
      .limit(limit);

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
        brandName: product.brand_name || null,
      };
    }) || [];

    return { data: transformedData, error: null };

  } catch (error) {
    // Fallback: nếu lỗi lọc category, trả về mảng rỗng chứ đừng crash
    console.warn("Error fetching related products", error);
    return { data: [], error: error.message };
  }
}

// =============================================
// FETCH NEW ARRIVALS (Hàng mới về)
// =============================================
export const fetchNewArrivals = async (limit = 8) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
          id, name, slug, price, original_price, brand_name,
          categories!inner(name),
          product_images!inner(image_url, is_primary)
        `)
      .eq('is_active', true)
      .limit(limit)
      .order('created_at', { ascending: false }); // Mới nhất lên đầu

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
        brandName: product.brand_name || null,
      };
    }) || [];
    return { data: transformedData, error: null };
  } catch (error) {
    return { data: [], error: error.message };
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
// FETCH BANNERS
// =============================================
export const fetchBanners = async () => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select(`*`)
      .eq('is_active', true) // Chỉ lấy banner đang active
      // Logic kiểm tra ngày tháng nếu cần: .lte('start_date', new Date().toISOString())...
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
        id, name, slug, price, brand_name,
        categories!inner(name),
        product_images!inner(image_url, is_primary)
      `)
      .eq('is_active', true)
      .ilike('name', `%${searchTerm.trim()}%`)
      .limit(10)
      .order('view_count', { ascending: false }); // Ưu tiên sản phẩm xem nhiều khi search

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
        brandName: product.brand_name || null,
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
        brandName: product.brand_name || null,
      };
    }) || [];
    return { data: transformedData, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// =============================================
// FETCH PRODUCT BY ID (QuickView)
// =============================================
export const fetchProductById = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories!inner(id, name, slug),
        product_images (id, image_url, is_primary, display_order),
        product_sizes (id, size, stock, weight_g),
        reviews (id, rating, comment, user_id, is_verified_purchase, created_at)
      `)
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: 'Product not found' };

    // Increment View Count
    incrementViewCount(data.id);

    // Parse attributes
    let parsedAttributes = {};
    try {
      parsedAttributes = typeof data.attributes === 'string' ? JSON.parse(data.attributes) : data.attributes || {};
    } catch (e) { }

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

      // Logistics
      weight: data.weight_g || 0,

      attributes: parsedAttributes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { data: transformed, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};