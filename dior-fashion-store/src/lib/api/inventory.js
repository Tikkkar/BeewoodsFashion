import { supabase } from "../supabase";
import { toast } from "react-hot-toast";

/**
 * -----------------------------------------------------------------------------
 * INVENTORY MANAGEMENT API
 * -----------------------------------------------------------------------------
 */

// Get all products with stock info for inventory dashboard
export const getInventoryProducts = async (filters = {}) => {
  try {
    let query = supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        brand_name,
        stock,
        price,
        is_active,
        categories!product_categories(id, name),
        product_sizes(id, size, stock),
        product_images(image_url, is_primary, display_order)
      `)
      .order("name");

    // Apply filters
    if (filters.status === "out_of_stock") {
      query = query.eq("stock", 0);
    } else if (filters.status === "low_stock") {
      query = query.gt("stock", 0).lte("stock", filters.lowStockThreshold || 10);
    } else if (filters.status === "in_stock") {
      query = query.gt("stock", filters.lowStockThreshold || 10);
    }

    if (filters.category) {
      query = query.eq("categories.id", filters.category);
    }

    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate stock status for each product
    const productsWithStatus = data.map(product => {
      const totalStock = product.stock || 0;
      const lowStockThreshold = filters.lowStockThreshold || 10;
      
      let stockStatus = "in_stock";
      if (totalStock === 0) {
        stockStatus = "out_of_stock";
      } else if (totalStock <= lowStockThreshold) {
        stockStatus = "low_stock";
      }

      // Get primary image
      const primaryImage = product.product_images?.find(img => img.is_primary)?.image_url 
        || product.product_images?.[0]?.image_url;

      return {
        ...product,
        stockStatus,
        primaryImage,
        hasVariants: product.product_sizes && product.product_sizes.length > 0
      };
    });

    return { data: productsWithStatus, error: null };
  } catch (err) {
    console.error("Error fetching inventory:", err);
    toast.error("Không thể tải dữ liệu inventory");
    return { data: null, error: err };
  }
};

// Get inventory history for a product
export const getInventoryLogs = async (productId, options = {}) => {
  try {
    let query = supabase
      .from("inventory_logs")
      .select(`
        *,
        product_sizes(size),
        created_by_user:users!inventory_logs_created_by_fkey(full_name, email)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.changeType) {
      query = query.eq("change_type", options.changeType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error("Error fetching inventory logs:", err);
    return { data: null, error: err };
  }
};

// Update stock with logging
export const updateStock = async (adjustmentData) => {
  const {
    product_id,
    product_size_id = null,
    size = null,
    quantity_change, // positive for increase, negative for decrease
    change_type, // 'import', 'adjustment', 'damaged', etc
    reason,
    reference_type = "manual",
    reference_id = null,
    metadata = {}
  } = adjustmentData;

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    let stock_before, stock_after, updateTarget;

    // Determine if we're updating size-specific or total stock
    if (size && product_size_id) {
      // Update specific size
      const { data: sizeData, error: sizeError } = await supabase
        .from("product_sizes")
        .select("stock")
        .eq("id", product_size_id)
        .single();

      if (sizeError) throw sizeError;

      stock_before = sizeData.stock;
      stock_after = Math.max(0, stock_before + quantity_change);

      const { error: updateError } = await supabase
        .from("product_sizes")
        .update({ stock: stock_after })
        .eq("id", product_size_id);

      if (updateError) throw updateError;

      updateTarget = "size";
    } else {
      // Update total product stock
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", product_id)
        .single();

      if (productError) throw productError;

      stock_before = productData.stock;
      stock_after = Math.max(0, stock_before + quantity_change);

      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: stock_after, updated_at: new Date().toISOString() })
        .eq("id", product_id);

      if (updateError) throw updateError;

      updateTarget = "product";
    }

    // Create inventory log
    const logData = {
      product_id,
      product_size_id,
      change_type,
      quantity_change,
      stock_before,
      stock_after,
      reason,
      reference_type,
      reference_id,
      created_by: user.id,
      metadata: {
        ...metadata,
        updateTarget,
        timestamp: new Date().toISOString()
      }
    };

    const { error: logError } = await supabase
      .from("inventory_logs")
      .insert([logData]);

    if (logError) {
      console.error("Failed to create inventory log:", logError);
      // Don't throw - stock update succeeded
    }

    return {
      success: true,
      stock_before,
      stock_after,
      quantity_change
    };
  } catch (err) {
    console.error("Error updating stock:", err);
    throw err;
  }
};

// Bulk update stocks
export const bulkUpdateStock = async (adjustments) => {
  try {
    const results = [];
    
    for (const adjustment of adjustments) {
      try {
        const result = await updateStock(adjustment);
        results.push({ ...adjustment, success: true, ...result });
      } catch (err) {
        results.push({ ...adjustment, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (failCount > 0) {
      toast.warning(`Đã cập nhật ${successCount}/${results.length} sản phẩm`);
    } else {
      toast.success(`Đã cập nhật ${successCount} sản phẩm thành công!`);
    }

    return { success: true, results };
  } catch (err) {
    console.error("Bulk update error:", err);
    toast.error("Lỗi khi cập nhật hàng loạt");
    return { success: false, error: err };
  }
};

// Get inventory statistics
export const getInventoryStats = async () => {
  try {
    // Get all products for stats
    const { data: products } = await supabase
      .from("products")
      .select("id, stock, price")
      .eq("is_active", true);

    if (!products) throw new Error("No products found");

    const stats = {
      totalProducts: products.length,
      totalStockValue: products.reduce((sum, p) => sum + (p.stock * p.price), 0),
      totalUnits: products.reduce((sum, p) => sum + p.stock, 0),
      outOfStock: products.filter(p => p.stock === 0).length,
      lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
      inStock: products.filter(p => p.stock > 10).length,
    };

    return { data: stats, error: null };
  } catch (err) {
    console.error("Error getting inventory stats:", err);
    return { data: null, error: err };
  }
};

// Export inventory to CSV (returns data for download)
export const exportInventoryData = async () => {
  try {
    const { data: products } = await supabase
      .from("products")
      .select(`
        name,
        slug,
        brand_name,
        stock,
        price,
        categories!product_categories(name),
        product_sizes(size, stock)
      `)
      .order("name");

    if (!products) throw new Error("No data to export");

    // Format data for CSV
    const csvData = products.flatMap(product => {
      if (product.product_sizes && product.product_sizes.length > 0) {
        // One row per size
        return product.product_sizes.map(size => ({
          "Tên sản phẩm": product.name,
          "Thương hiệu": product.brand_name || "",
          "Danh mục": product.categories?.map(c => c.name).join(", ") || "",
          "Size": size.size,
          "Tồn kho": size.stock,
          "Giá": product.price,
          "Giá trị tồn": size.stock * product.price
        }));
      } else {
        // Single row for product
        return [{
          "Tên sản phẩm": product.name,
          "Thương hiệu": product.brand_name || "",
          "Danh mục": product.categories?.map(c => c.name).join(", ") || "",
          "Size": "N/A",
          "Tồn kho": product.stock,
          "Giá": product.price,
          "Giá trị tồn": product.stock * product.price
        }];
      }
    });

    return { data: csvData, error: null };
  } catch (err) {
    console.error("Error exporting inventory:", err);
    return { data: null, error: err };
  }
};