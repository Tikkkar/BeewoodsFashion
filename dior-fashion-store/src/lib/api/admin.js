import { supabase } from "../supabase";
import { toast } from "react-hot-toast";

/**
 * -----------------------------------------------------------------------------
 * Reusable Image Uploader
 * -----------------------------------------------------------------------------
 */
export const uploadImage = async (file, bucket = "products") => {
  const fileName = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file);

  if (error) {
    toast.error(`Image upload failed: ${error.message}`);
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return publicUrl;
};

/**
 * -----------------------------------------------------------------------------
 * Products Management (CRUD) - ĐÃ CẬP NHẬT CHO NHIỀU DANH MỤC
 * -----------------------------------------------------------------------------
 */
export const getAdminProducts = async () => {
  // ✨ SỬA LỖI: Chỉ định rõ quan hệ thông qua bảng trung gian
  const { data, error } = await supabase
    .from("products")
    .select("*, categories!product_categories(name)")
    .order("created_at", { ascending: false });
  if (error) toast.error("Failed to fetch products.");
  return { data, error };
};

export const getAdminProductById = async (id) => {
  // ✨ SỬA LỖI: Chỉ định rõ quan hệ và lấy đầy đủ thông tin categories
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, product_images(*), product_sizes(*), categories!product_categories(*)"
    )
    .eq("id", id)
    .single();
  if (error) toast.error("Failed to fetch product details.");
  return { data, error };
};

export const createProduct = async (
  productData,
  images,
  sizes,
  categoryIds
) => {
  // ✨ THAY ĐỔI: Nhận thêm categoryIds
  const { data: newProduct, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();
  if (error) throw error;

  // Xử lý ảnh và size (như cũ)
  if (images.length > 0) {
    const imagePayload = images.map((url, i) => ({
      product_id: newProduct.id,
      image_url: url,
      is_primary: i === 0,
      display_order: i,
    }));
    await supabase.from("product_images").insert(imagePayload);
  }
  if (sizes.length > 0) {
    const sizePayload = sizes.map((s) => ({ product_id: newProduct.id, ...s }));
    await supabase.from("product_sizes").insert(sizePayload);
  }

  // ✨ MỚI: Liên kết sản phẩm với các danh mục trong bảng trung gian
  if (categoryIds && categoryIds.length > 0) {
    const productCategoriesPayload = categoryIds.map((catId) => ({
      product_id: newProduct.id,
      category_id: catId,
    }));
    const { error: catError } = await supabase
      .from("product_categories")
      .insert(productCategoriesPayload);
    if (catError) throw catError;
  }

  return newProduct;
};

export const updateProduct = async (
  id,
  productData,
  newImages,
  newSizes,
  categoryIds
) => {
  // ✨ THAY ĐỔI: Nhận thêm categoryIds
  const { error } = await supabase
    .from("products")
    .update(productData)
    .eq("id", id);
  if (error) throw error;

  // Xử lý ảnh và size (như cũ)
  await supabase.from("product_images").delete().eq("product_id", id);
  if (newImages.length > 0) {
    const imagePayload = newImages.map((url, i) => ({
      product_id: id,
      image_url: url,
      is_primary: i === 0,
      display_order: i,
    }));
    await supabase.from("product_images").insert(imagePayload);
  }

  await supabase.from("product_sizes").delete().eq("product_id", id);
  if (newSizes.length > 0) {
    const sizePayload = newSizes.map((s) => ({ product_id: id, ...s }));
    await supabase.from("product_sizes").insert(sizePayload);
  }

  // ✨ MỚI: Cập nhật lại liên kết danh mục
  // Cách đơn giản nhất: Xóa hết liên kết cũ và tạo lại liên kết mới
  await supabase.from("product_categories").delete().eq("product_id", id);
  if (categoryIds && categoryIds.length > 0) {
    const productCategoriesPayload = categoryIds.map((catId) => ({
      product_id: id,
      category_id: catId,
    }));
    const { error: catError } = await supabase
      .from("product_categories")
      .insert(productCategoriesPayload);
    if (catError) throw catError;
  }
};

export const deleteProduct = async (id) => {
  // Hàm này không thay đổi vì ON DELETE CASCADE đã được cài đặt trong CSDL
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    toast.error(`Failed to delete product: ${error.message}`);
    throw error;
  }
  toast.success("Product deleted successfully.");
};

// ... (Các hàm còn lại từ Categories, Banners, Orders, Dashboard không thay đổi)
/**
 * -----------------------------------------------------------------------------
 * Categories Management (CRUD)
 * -----------------------------------------------------------------------------
 */
export const getAdminCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order");
  if (error) toast.error("Failed to fetch categories.");
  return { data, error };
};

export const saveCategory = async (category) => {
  const { id, ...data } = category;
  let error;
  if (id) {
    ({ error } = await supabase.from("categories").update(data).eq("id", id));
  } else {
    ({ error } = await supabase.from("categories").insert(data));
  }
  if (error) {
    toast.error(`Failed to save category: ${error.message}`);
    throw error;
  }
  toast.success(`Category ${id ? "updated" : "created"} successfully!`);
};

export const deleteCategory = async (id) => {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    toast.error(`Failed to delete category: ${error.message}`);
    throw error;
  }
  toast.success("Category deleted successfully.");
};

/**
 * -----------------------------------------------------------------------------
 * Banners Management (CRUD)
 * -----------------------------------------------------------------------------
 */
export const getAdminBanners = async () => {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    toast.error("Failed to fetch banners.");
    return { data: null, error };
  }
  return { data, error: null };
};

export const saveBanner = async (banner) => {
  const { id, ...data } = banner;
  let error;

  if (id) {
    // Update existing banner
    ({ error } = await supabase.from("banners").update(data).eq("id", id));
  } else {
    // Create new banner
    ({ error } = await supabase.from("banners").insert(data));
  }

  if (error) {
    toast.error(`Failed to save banner: ${error.message}`);
    throw error;
  }

  toast.success(`Banner ${id ? "updated" : "created"} successfully!`);
};

export const deleteBanner = async (id) => {
  const { error } = await supabase.from("banners").delete().eq("id", id);

  if (error) {
    toast.error(`Failed to delete banner: ${error.message}`);
    throw error;
  }

  toast.success("Banner deleted successfully.");
};

/**
 * -----------------------------------------------------------------------------
 * Orders Management
 * -----------------------------------------------------------------------------
 */
export const getAdminOrders = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false });
  if (error) toast.error("Failed to fetch orders.");
  return { data, error };
};

export const getAdminOrderDetails = async (id) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, users(*), order_items(*, products(name,product_images(image_url)))"
    )
    .eq("id", id)
    .single();
  if (error) toast.error("Failed to fetch order details.");
  return { data, error };
};

export const updateOrderStatus = async (id, status) => {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    toast.error("Failed to update order status.");
    throw error;
  }

  toast.success("Order status updated!");
};

/**
 * -----------------------------------------------------------------------------
 * Dashboard Statistics
 * -----------------------------------------------------------------------------
 */
export const getDashboardStats = async () => {
  try {
    // Get all orders with complete data
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total_amount, status, created_at");

    if (ordersError) throw ordersError;

    // Calculate revenue (only completed orders)
    const totalRevenue =
      orders
        ?.filter((o) => o.status === "completed")
        .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    // Count orders by status
    const totalOrders = orders?.length || 0;
    const pendingOrders =
      orders?.filter((o) => o.status === "pending").length || 0;
    const completedOrders =
      orders?.filter((o) => o.status === "completed").length || 0;

    // Get products count
    const { count: totalProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: activeProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    toast.error("Failed to load dashboard statistics.");
    return null;
  }
};

export const getRecentOrders = async (limit = 5) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, created_at, total_amount, status, users(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent orders:", error);
    return [];
  }

  return data || [];
};

export const getBestSellingProducts = async (limit = 5) => {
  const { data, error } = await supabase
    .from("order_items")
    .select(
      "product_id, quantity, products!inner(id, name, price, product_images(image_url))"
    )
    .order("quantity", { ascending: false });

  if (error) {
    console.error("Error fetching best selling products:", error);
    return [];
  }

  // Aggregate quantities by product
  const productMap = {};
  data?.forEach((item) => {
    if (!item.products) return;
    const productId = item.product_id;
    if (!productMap[productId]) {
      productMap[productId] = {
        ...item.products,
        totalQuantity: 0,
      };
    }
    productMap[productId].totalQuantity += item.quantity;
  });

  return Object.values(productMap)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
};
