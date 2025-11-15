import { supabase } from "../supabase";
import { toast } from "react-hot-toast";

/**
 * -----------------------------------------------------------------------------
 * INVENTORY MANAGEMENT API
 * -----------------------------------------------------------------------------
 * Note: Excel export requires 'xlsx' package
 * Install: npm install xlsx --save
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
    // Simplified query without foreign key reference to users table
    // We'll get user info separately if needed
    let query = supabase
      .from("inventory_logs")
      .select(`
        id,
        product_id,
        product_size_id,
        change_type,
        quantity_change,
        stock_before,
        stock_after,
        reason,
        reference_type,
        reference_id,
        created_by,
        created_at,
        metadata,
        product_sizes(size)
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

    // Get user info for logs that have created_by
    if (data && data.length > 0) {
      const userIds = [...new Set(data.filter(log => log.created_by).map(log => log.created_by))];
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds);

        // Map user info to logs
        const usersMap = {};
        users?.forEach(user => {
          usersMap[user.id] = user;
        });

        data.forEach(log => {
          if (log.created_by && usersMap[log.created_by]) {
            log.created_by_user = usersMap[log.created_by];
          }
        });
      }
    }

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
    import_date = null, // NEW: Ngày nhập hàng
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

    // Create inventory log with import_date
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
        import_date: import_date || new Date().toISOString(), // Store import date in metadata
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

// Export inventory to Excel
export const exportInventoryToExcel = async () => {
  try {
    // Dynamic import of xlsx
    const XLSX = await import('xlsx').catch(() => null);
    
    if (!XLSX) {
      toast.error("Vui lòng cài đặt thư viện xlsx: npm install xlsx");
      return { success: false, error: "xlsx not installed" };
    }

    toast.loading("Đang xuất dữ liệu...");

    // Fetch products with detailed info including latest import date from logs
    const { data: products } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        brand_name,
        stock,
        price,
        original_price,
        is_active,
        created_at,
        updated_at,
        categories!product_categories(name),
        product_sizes(id, size, stock),
        inventory_logs(
          created_at,
          change_type,
          quantity_change,
          metadata
        )
      `)
      .order("name");

    if (!products || products.length === 0) {
      toast.dismiss();
      toast.error("Không có dữ liệu để xuất");
      return { success: false, error: "No data to export" };
    }

    // Helper function to get latest import date
    const getLatestImportDate = (logs) => {
      if (!logs || logs.length === 0) return null;
      
      const importLogs = logs.filter(log => 
        log.change_type === 'import' && 
        log.quantity_change > 0
      ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (importLogs.length === 0) return null;

      // Check metadata for import_date first, otherwise use created_at
      const latestLog = importLogs[0];
      return latestLog.metadata?.import_date || latestLog.created_at;
    };

    // Format data for Excel - One row per product or size variant
    const excelData = [];
    
    products.forEach(product => {
      const categoryNames = product.categories?.map(c => c.name).join(", ") || "Chưa phân loại";
      const latestImportDate = getLatestImportDate(product.inventory_logs);
      const formattedImportDate = latestImportDate 
        ? new Date(latestImportDate).toLocaleDateString('vi-VN')
        : "Chưa nhập";

      if (product.product_sizes && product.product_sizes.length > 0) {
        // Product with size variants - one row per size
        product.product_sizes.forEach(sizeVariant => {
          excelData.push({
            "Mã SP": product.id.slice(0, 8).toUpperCase(),
            "Tên sản phẩm": product.name,
            "Thương hiệu": product.brand_name || "N/A",
            "Danh mục": categoryNames,
            "Size": sizeVariant.size,
            "Tồn kho": sizeVariant.stock,
            "Giá bán": product.price,
            "Giá gốc": product.original_price || product.price,
            "Giá trị tồn": sizeVariant.stock * product.price,
            "Trạng thái": product.is_active ? "Đang bán" : "Ngừng bán",
            "Ngày nhập gần nhất": formattedImportDate,
            "Ngày tạo": new Date(product.created_at).toLocaleDateString('vi-VN'),
          });
        });
      } else {
        // Product without size variants
        excelData.push({
          "Mã SP": product.id.slice(0, 8).toUpperCase(),
          "Tên sản phẩm": product.name,
          "Thương hiệu": product.brand_name || "N/A",
          "Danh mục": categoryNames,
          "Size": "One Size",
          "Tồn kho": product.stock,
          "Giá bán": product.price,
          "Giá gốc": product.original_price || product.price,
          "Giá trị tồn": product.stock * product.price,
          "Trạng thái": product.is_active ? "Đang bán" : "Ngừng bán",
          "Ngày nhập gần nhất": formattedImportDate,
          "Ngày tạo": new Date(product.created_at).toLocaleDateString('vi-VN'),
        });
      }
    });

    // Calculate summary statistics
    const totalProducts = products.length;
    const totalVariants = excelData.length;
    const totalStock = excelData.reduce((sum, item) => sum + item["Tồn kho"], 0);
    const totalValue = excelData.reduce((sum, item) => sum + item["Giá trị tồn"], 0);

    // Create summary sheet data
    const summaryData = [
      { "Chỉ số": "Tổng số sản phẩm", "Giá trị": totalProducts },
      { "Chỉ số": "Tổng số biến thể", "Giá trị": totalVariants },
      { "Chỉ số": "Tổng tồn kho", "Giá trị": totalStock },
      { "Chỉ số": "Tổng giá trị tồn kho", "Giá trị": new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalValue) },
      { "Chỉ số": "Ngày xuất báo cáo", "Giá trị": new Date().toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })},
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add summary sheet
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng quan");

    // Add detailed inventory sheet
    const wsInventory = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 10 }, // Mã SP
      { wch: 35 }, // Tên sản phẩm
      { wch: 15 }, // Thương hiệu
      { wch: 20 }, // Danh mục
      { wch: 8 },  // Size
      { wch: 10 }, // Tồn kho
      { wch: 12 }, // Giá bán
      { wch: 12 }, // Giá gốc
      { wch: 15 }, // Giá trị tồn
      { wch: 12 }, // Trạng thái
      { wch: 18 }, // Ngày nhập gần nhất
      { wch: 12 }, // Ngày tạo
    ];
    wsInventory['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, wsInventory, "Chi tiết tồn kho");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `BaoGao_TonKho_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(wb, filename);

    toast.dismiss();
    toast.success(`Đã xuất file: ${filename}`);

    return { success: true, filename };
  } catch (err) {
    toast.dismiss();
    console.error("Error exporting to Excel:", err);
    toast.error("Lỗi khi xuất Excel: " + err.message);
    return { success: false, error: err };
  }
};

// Export inventory to CSV (legacy function - kept for backward compatibility)
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