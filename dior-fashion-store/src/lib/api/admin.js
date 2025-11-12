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
 * Products Management (CRUD)
 * -----------------------------------------------------------------------------
 */
export const getAdminProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories!product_categories(id, name),
      product_sizes(*),
      product_images(id, image_url, is_primary, display_order)
    `)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("❌ Error fetching products:", error);
    toast.error("Failed to fetch products.");
  }
  
  // Debug log
  if (data && data.length > 0) {
    console.log("✅ Total products loaded:", data.length);
    console.log("🔍 First product sample:", {
      name: data[0].name,
      has_images: !!data[0].product_images,
      images_count: data[0].product_images?.length || 0,
      first_image: data[0].product_images?.[0]
    });
  }
  
  return { data, error };
};

export const getAdminProductById = async (id) => {
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
  const { data: newProduct, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();
  if (error) throw error;

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
  const { error } = await supabase
    .from("products")
    .update(productData)
    .eq("id", id);
  if (error) throw error;

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
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    toast.error(`Failed to delete product: ${error.message}`);
    throw error;
  }
  toast.success("Product deleted successfully.");
};

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
    ({ error } = await supabase.from("banners").update(data).eq("id", id));
  } else {
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
 * Manual Orders Management (TẠO ĐƠN HÀNG THỦ CÔNG)
 * -----------------------------------------------------------------------------
 */

// Hàm tạo order number
const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `BEWO-${year}${month}${day}${random}`;
};

export const createManualOrder = async (orderData) => {
  // Tự động generate order_number nếu chưa có
  if (!orderData.order_number) {
    orderData.order_number = generateOrderNumber();
  }

  console.log("📦 Creating manual order:", orderData);

  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();
  
  if (error) {
    console.error("❌ Error creating manual order:", error);
    throw error;
  }
  
  console.log("✅ Manual order created:", data.order_number);
  return { data };
};

export const createOrderItems = async (orderId, items) => {
  const orderItems = items.map(item => ({
    order_id: orderId,
    product_id: item.product_id,
    product_name: item.product_name,
    product_image: item.product_image || null,
    size: item.size || null,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal
  }));

  console.log("📝 Creating order items:", orderItems);

  const { data, error } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();
  
  if (error) {
    console.error("❌ Error creating order items:", error);
    throw error;
  }
  
  console.log("✅ Order items created:", data.length);
  return { data };
};

export const updateProductStock = async (productId, quantity, size = null) => {
  try {
    console.log(`📉 Updating stock for product ${productId}, size: ${size || 'none'}, quantity: -${quantity}`);

    // 1. Cập nhật stock cho size cụ thể (nếu có)
    if (size) {
      const { data: sizeData, error: sizeError } = await supabase
        .from('product_sizes')
        .select('stock')
        .eq('product_id', productId)
        .eq('size', size)
        .single();

      if (sizeError) {
        console.error("❌ Error fetching size stock:", sizeError);
        throw sizeError;
      }

      const newSizeStock = Math.max(0, sizeData.stock - quantity);
      
      const { error: updateSizeError } = await supabase
        .from('product_sizes')
        .update({ stock: newSizeStock })
        .eq('product_id', productId)
        .eq('size', size);

      if (updateSizeError) {
        console.error("❌ Error updating size stock:", updateSizeError);
        throw updateSizeError;
      }
      
      console.log(`✅ Size stock updated: ${size} - ${sizeData.stock} → ${newSizeStock}`);
    }

    // 2. Cập nhật tổng stock của sản phẩm
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error("❌ Error fetching product stock:", productError);
      throw productError;
    }

    const newProductStock = Math.max(0, productData.stock - quantity);
    
    const { error: updateProductError } = await supabase
      .from('products')
      .update({ stock: newProductStock })
      .eq('id', productId);

    if (updateProductError) {
      console.error("❌ Error updating product stock:", updateProductError);
      throw updateProductError;
    }
    
    console.log(`✅ Product stock updated: ${productData.stock} → ${newProductStock}`);
    
    return { success: true };
  } catch (error) {
    console.error("❌ updateProductStock failed:", error);
    throw error;
  }
};

/**
 * -----------------------------------------------------------------------------
 * Dashboard Statistics
 * -----------------------------------------------------------------------------
 */
export const getDashboardStats = async () => {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total_amount, status, created_at");

    if (ordersError) throw ordersError;

    const totalRevenue =
      orders
        ?.filter((o) => o.status === "completed")
        .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    const totalOrders = orders?.length || 0;
    const pendingOrders =
      orders?.filter((o) => o.status === "pending").length || 0;
    const completedOrders =
      orders?.filter((o) => o.status === "completed").length || 0;

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