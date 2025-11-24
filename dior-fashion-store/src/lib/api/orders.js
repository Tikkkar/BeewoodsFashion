import { supabase } from "../supabase";

// =============================================
// GENERATE ORDER NUMBER
// =============================================
// Option 2: BEWO-2410290001 (Năm ngắn + tháng + ngày + số)
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

// =============================================
// UPDATE PRODUCT STOCK AFTER ORDER
// =============================================
const updateProductStock = async (cartItems) => {
  try {
    for (const item of cartItems) {
      // Get current stock
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.id)
        .single();

      if (fetchError) throw fetchError;

      // Update stock
      const newStock = product.stock - item.quantity;

      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: Math.max(0, newStock) })
        .eq("id", item.id);

      if (updateError) throw updateError;

      // Update size stock if applicable
      if (item.selectedSize && item.selectedSize !== "One Size") {
        const { data: sizeData, error: sizeError } = await supabase
          .from("product_sizes")
          .select("stock")
          .eq("product_id", item.id)
          .eq("size", item.selectedSize)
          .single();

        if (!sizeError && sizeData) {
          await supabase
            .from("product_sizes")
            .update({ stock: Math.max(0, sizeData.stock - item.quantity) })
            .eq("product_id", item.id)
            .eq("size", item.selectedSize);
        }
      }
    }

    return { success: true };
  } catch (error) {
    // console.error("Error updating stock:", error);
    return { success: false, error };
  }
};

// =============================================
// CREATE ORDER
// =============================================
export const createOrder = async (orderData) => {
  try {
    const { cartItems, customerInfo, shippingInfo, discountInfo } = orderData;

    // 1. Tính toán lại các giá trị tổng
    const originalSubtotal = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const shippingFee = 30000;
    const appliedDiscountCode = discountInfo?.code || null;
    const discountAmount = discountInfo?.discountAmount || 0;
    const totalAfterDiscount = originalSubtotal - discountAmount;
    const finalTotal = totalAfterDiscount + shippingFee;

    // THAY ĐỔI: Lấy user_id từ auth nếu user đã đăng nhập
    let userId = null;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Kiểm tra user có tồn tại trong bảng public.users không
      const { data: publicUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      userId = publicUser?.id || null;
    }

    // 2. Generate order number
    const orderNumber = generateOrderNumber();

    // 3. Tạo đối tượng payload cho bảng ORDERS
    const orderPayload = {
      order_number: orderNumber,
      user_id: userId,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,

      // Nối chuỗi địa chỉ đầy đủ để tiện hiển thị nếu cần
      shipping_address: shippingInfo.address,
      shipping_city: shippingInfo.city,
      shipping_district: shippingInfo.district,
      shipping_ward: shippingInfo.ward || "",

      notes: customerInfo.notes || null,
      subtotal: originalSubtotal,
      discount_amount: discountAmount,
      applied_discount_code: appliedDiscountCode,
      shipping_fee: shippingFee,
      total_amount: finalTotal,
      status: "pending", // Mặc định pending. Khi admin chuyển sang 'processing', Trigger sẽ tạo vận đơn J&T.
      payment_method: "cod", // Mặc định COD
      payment_status: "pending",
    };

    // 4. Chèn đơn hàng vào DB
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select()
      .single();

    if (orderError) throw orderError;

    // =========================================================================
    // MỚI: Lấy thông tin cân nặng (Weight) từ bảng Products để Snapshot dữ liệu
    // =========================================================================
    // Lấy danh sách ID sản phẩm trong giỏ hàng
    const productIds = cartItems.map((item) => item.id);

    // Fetch dữ liệu weight_g từ DB
    const { data: productsWeightData } = await supabase
      .from("products")
      .select("id, weight_g")
      .in("id", productIds);

    // Tạo Map để tra cứu nhanh: { productId: weight }
    const weightMap = {};
    if (productsWeightData) {
      productsWeightData.forEach(p => {
        weightMap[p.id] = p.weight_g || 0; // Nếu null thì set bằng 0
      });
    }

    // 5. Chèn order items (Kèm cân nặng snapshot)
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      product_image: item.imagePrimary,
      size: item.selectedSize || "One Size",
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,

      // TRƯỜNG MỚI: Snapshot cân nặng (để sau này đối soát J&T chính xác)
      // Nếu không tìm thấy trong DB thì mặc định 200g (giá trị an toàn)
      weight_g: weightMap[item.id] !== undefined ? weightMap[item.id] : 200
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      // Rollback: xóa đơn hàng vừa tạo nếu lỗi insert items
      await supabase.from("orders").delete().eq("id", order.id);
      throw itemsError;
    }

    // 6. Cập nhật tồn kho
    const stockResult = await updateProductStock(cartItems);
    if (!stockResult.success) {
      // Log warning nhưng không throw lỗi chặn đơn hàng
    }

    return { data: order, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Lỗi không xác định" };
  }
};

// =============================================
// GET ORDER BY ID
// =============================================
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items(*)
      `
      )
      .eq("id", orderId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// =============================================
// GET ORDER BY ORDER NUMBER
// =============================================
export const getOrderByNumber = async (orderNumber) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items(*)
      `
      )
      .eq("order_number", orderNumber)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// =============================================
// GET USER ORDERS
// =============================================
export const getUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items(*)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};