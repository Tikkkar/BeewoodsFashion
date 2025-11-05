// ============================================
// services/orderSyncService.ts - SYNC ĐƠN HÀNG
// ============================================

import { createSupabaseClient } from "../utils/supabaseClient.ts";

/**
 * Sync chatbot_orders sang orders + order_items
 * Để quản lý thống nhất trong hệ thống e-commerce
 */
export async function syncChatbotOrderToMainOrders(
  chatbotOrderId: string,
): Promise<{ success: boolean; orderId?: string; orderNumber?: string }> {
  const supabase = createSupabaseClient();

  try {
    // ========================================
    // 1. GET CHATBOT ORDER
    // ========================================
    const { data: chatbotOrder, error: fetchError } = await supabase
      .from("chatbot_orders")
      .select("*")
      .eq("id", chatbotOrderId)
      .single();

    if (fetchError || !chatbotOrder) {
      console.error("❌ Chatbot order not found:", chatbotOrderId);
      return { success: false };
    }

    // Nếu đã sync rồi, skip
    if (chatbotOrder.main_order_id) {
      console.log("⚠️ Order already synced:", chatbotOrder.main_order_id);
      return {
        success: true,
        orderId: chatbotOrder.main_order_id,
      };
    }

    // ========================================
    // 2. GENERATE ORDER NUMBER
    // ========================================
    const timestamp = Date.now();
    const orderNumber = `ORD${timestamp.toString().slice(-8)}`;

    // ========================================
    // 3. GET USER_ID (if available)
    // ========================================
    let userId: string | null = null;

    if (chatbotOrder.profile_id) {
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("user_id")
        .eq("id", chatbotOrder.profile_id)
        .single();

      userId = profile?.user_id || null;
    }

    // ========================================
    // 4. CREATE MAIN ORDER
    // ========================================
    const { data: mainOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        tenant_id: chatbotOrder.tenant_id,
        user_id: userId,
        order_number: orderNumber,
        customer_name: chatbotOrder.customer_name,
        customer_phone: chatbotOrder.customer_phone,
        shipping_address: chatbotOrder.shipping_address,
        shipping_city: chatbotOrder.shipping_city,
        shipping_district: chatbotOrder.shipping_district,
        shipping_ward: chatbotOrder.shipping_ward,
        subtotal: chatbotOrder.subtotal,
        shipping_fee: chatbotOrder.shipping_fee,
        discount_amount: chatbotOrder.discount_amount || 0,
        total_amount: chatbotOrder.total_amount,
        status: "pending",
        payment_method: "cod",
        payment_status: "pending",
        notes: `[Chatbot] Conversation: ${chatbotOrder.conversation_id}${
          chatbotOrder.notes ? "\n" + chatbotOrder.notes : ""
        }`,
      })
      .select()
      .single();

    if (orderError || !mainOrder) {
      console.error("❌ Failed to create main order:", orderError);
      return { success: false };
    }

    console.log("✅ Main order created:", orderNumber);

    // ========================================
    // 5. CREATE ORDER_ITEMS
    // ========================================
    const productDetails = chatbotOrder.product_details as any[];

    if (productDetails && productDetails.length > 0) {
      const orderItems = productDetails.map((item) => ({
        order_id: mainOrder.id,
        product_id: item.product_id || null,
        product_name: item.name,
        product_image: item.image || "",
        size: item.size || "M",
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("❌ Failed to create order items:", itemsError);
        // Rollback main order
        await supabase.from("orders").delete().eq("id", mainOrder.id);
        return { success: false };
      }

      console.log(`✅ Created ${orderItems.length} order items`);
    }

    // ========================================
    // 6. UPDATE CHATBOT_ORDER with main_order_id
    // ========================================
    await supabase
      .from("chatbot_orders")
      .update({
        main_order_id: mainOrder.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatbotOrderId);

    console.log("✅ Order synced successfully");

    return {
      success: true,
      orderId: mainOrder.id,
      orderNumber: orderNumber,
    };
  } catch (error: any) {
    console.error("❌ Order sync error:", error);
    return { success: false };
  }
}

/**
 * Update order status (sync both tables)
 */
export async function updateOrderStatus(
  chatbotOrderId: string,
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled",
  cancelReason?: string,
): Promise<boolean> {
  const supabase = createSupabaseClient();

  try {
    // Update chatbot_orders
    const updates: any = {
      status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === "confirmed") {
      updates.confirmed_at = new Date().toISOString();
    }

    if (status === "cancelled" && cancelReason) {
      updates.cancel_reason = cancelReason;
    }

    await supabase
      .from("chatbot_orders")
      .update(updates)
      .eq("id", chatbotOrderId);

    // Get main_order_id
    const { data: chatbotOrder } = await supabase
      .from("chatbot_orders")
      .select("main_order_id")
      .eq("id", chatbotOrderId)
      .single();

    // Update main orders if synced
    if (chatbotOrder?.main_order_id) {
      const mainOrderUpdates: any = {
        status: status,
        updated_at: new Date().toISOString(),
      };

      if (status === "cancelled" && cancelReason) {
        mainOrderUpdates.cancelled_reason = cancelReason;
      }

      await supabase
        .from("orders")
        .update(mainOrderUpdates)
        .eq("id", chatbotOrder.main_order_id);

      console.log("✅ Both orders updated");
    }

    return true;
  } catch (error) {
    console.error("❌ Update order status error:", error);
    return false;
  }
}
