// ============================================
// services/chatbotOrderService.ts
// Tạo đơn hàng từ chatbot (không cần user_id)
// ============================================

import { createSupabaseClient } from "../utils/supabaseClient.ts";

interface ProductOrder {
  product_id: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

interface OrderData {
  conversationId: string;
  profileId: string;
  customerName: string;
  customerPhone: string;
  customerFbId?: string;
  shippingAddress: string;
  shippingWard?: string;
  shippingDistrict?: string;
  shippingCity?: string;
  products: ProductOrder[];
  notes?: string;
}

// services/chatbotOrderService.ts

export async function createChatbotOrder(data: OrderData) {
  const supabase = createSupabaseClient();

  console.log("🛒 Creating chatbot order for:", data.customerPhone);

  // ========================================
  // 0. VALIDATION - ✅ THÊM MỚI
  // ========================================

  // Validate required fields
  if (!data.customerName || data.customerName.trim() === "") {
    console.error("❌ Missing customer name");
    return {
      success: false,
      error: "Thiếu tên khách hàng",
      orderSummary: null,
    };
  }

  if (!data.customerPhone || !/^[0+][\d]{9,11}$/.test(data.customerPhone)) {
    console.error("❌ Invalid customer phone:", data.customerPhone);
    return {
      success: false,
      error: "Số điện thoại không hợp lệ",
      orderSummary: null,
    };
  }

  if (!data.shippingAddress || data.shippingAddress.trim().length < 5) {
    console.error(
      "❌ Missing or invalid shipping address:",
      data.shippingAddress,
    );
    return {
      success: false,
      error: "Địa chỉ giao hàng không hợp lệ",
      orderSummary: null,
    };
  }

  if (!data.products || data.products.length === 0) {
    console.error("❌ No products in order");
    return {
      success: false,
      error: "Không có sản phẩm trong đơn hàng",
      orderSummary: null,
    };
  }

  // Validate shippingCity (should be provided)
  if (!data.shippingCity || data.shippingCity.trim() === "") {
    console.warn(
      "⚠️ Missing shipping city, attempting to extract from address",
    );
    // Try to extract city from address
    const cityMatch = data.shippingAddress.match(
      /,\s*(Hà Nội|TP\.?HCM|TP\s*Hồ Chí Minh|Đà Nẵng|Hải Phòng|Cần Thơ)$/i,
    );
    if (cityMatch) {
      data.shippingCity = cityMatch[1];
    } else {
      console.error("❌ Cannot determine shipping city");
      return {
        success: false,
        error: "Không xác định được thành phố giao hàng",
        orderSummary: null,
      };
    }
  }

  console.log("✅ Validation passed");

  // ========================================
  // 1. CALCULATE TOTALS
  // ========================================
  const subtotal = data.products.reduce(
    (sum, p) => sum + (p.price * p.quantity),
    0,
  );

  const shippingFee = subtotal >= 300000 ? 0 : 30000;
  const discountAmount = 0;
  const totalAmount = subtotal + shippingFee - discountAmount;

  // ========================================
  // 2. PREPARE PRODUCT DETAILS
  // ========================================
  const productDetails = data.products.map((p) => ({
    product_id: p.product_id,
    name: p.name,
    price: p.price,
    size: p.size || "One Size",
    quantity: p.quantity,
    image: p.image,
  }));

  const productIds = data.products.map((p) => p.product_id);

  // ========================================
  // 3. CREATE CHATBOT ORDER - ✅ CẢI TIẾN
  // ========================================
  try {
    const { data: order, error: orderError } = await supabase
      .from("chatbot_orders")
      .insert({
        conversation_id: data.conversationId,
        profile_id: data.profileId,
        customer_name: data.customerName.trim(), // ✅ Trim whitespace
        customer_phone: data.customerPhone.trim(),
        customer_fb_id: data.customerFbId || null,
        shipping_address: data.shippingAddress.trim(),
        shipping_ward: data.shippingWard?.trim() || null,
        shipping_district: data.shippingDistrict?.trim() || null,
        shipping_city: data.shippingCity.trim(), // ✅ Now validated
        product_ids: productIds,
        product_details: productDetails,
        subtotal: subtotal,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: "pending",
        notes: data.notes?.trim() || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error("❌ Error creating chatbot order:", orderError);
      // ✅ Return structured error instead of throwing
      return {
        success: false,
        error: orderError.message || "Lỗi khi tạo đơn hàng",
        orderSummary: null,
      };
    }

    console.log("✅ Chatbot order created:", order.id);

    // ========================================
    // 4. UPDATE STOCK - ✅ THÊM ERROR HANDLING
    // ========================================
    try {
      for (const product of data.products) {
        await updateProductStock(
          supabase,
          product.product_id,
          product.size,
          product.quantity,
        );
      }
      console.log("✅ Stock updated for all products");
    } catch (stockError: any) {
      // ✅ Log error but don't fail the order
      console.error(
        "⚠️ Stock update failed (non-blocking):",
        stockError.message,
      );
      // Order is already created, just log the issue
    }

    // ========================================
    // 5. SAVE AS MEMORY FACT - ✅ NON-BLOCKING
    // ========================================
    try {
      await supabase
        .from("customer_memory_facts")
        .insert({
          customer_profile_id: data.profileId,
          fact_type: "special_request",
          fact_text: `Đã đặt hàng: ${
            data.products.map((p) => p.name).join(", ")
          }`,
          importance_score: 8,
          source_conversation_id: data.conversationId,
        });
      console.log("✅ Memory fact saved");
    } catch (memoryError: any) {
      // ✅ Non-blocking, just log
      console.error(
        "⚠️ Memory fact save failed (non-blocking):",
        memoryError.message,
      );
    }

    return {
      success: true,
      order: order,
      orderSummary: {
        subtotal,
        shippingFee,
        discountAmount,
        total: totalAmount,
        products: data.products.length,
      },
    };
  } catch (error: any) {
    console.error("❌ Unexpected error in createChatbotOrder:", error);
    return {
      success: false,
      error: error.message || "Lỗi không xác định",
      orderSummary: null,
    };
  }
}

// ✅ Thêm error handling cho updateProductStock
async function updateProductStock(
  supabase: any,
  productId: string,
  size: string,
  quantity: number,
) {
  try {
    // Update main product stock
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single();

    if (fetchError) {
      console.warn("⚠️ Product not found for stock update:", productId);
      return; // Non-blocking
    }

    if (product) {
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: Math.max(0, product.stock - quantity) })
        .eq("id", productId);

      if (updateError) {
        console.error("❌ Failed to update product stock:", updateError);
      }
    }

    // Update size-specific stock
    if (size && size !== "One Size") {
      const { data: sizeData, error: sizeFetchError } = await supabase
        .from("product_sizes")
        .select("stock")
        .eq("product_id", productId)
        .eq("size", size)
        .single();

      if (!sizeFetchError && sizeData) {
        await supabase
          .from("product_sizes")
          .update({ stock: Math.max(0, sizeData.stock - quantity) })
          .eq("product_id", productId)
          .eq("size", size);
      }
    }
  } catch (error: any) {
    console.error("❌ Error in updateProductStock:", error);
    // Don't throw - this is non-blocking
  }
}
