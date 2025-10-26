// deno-lint-ignore-file
// ============================================
// handlers/orderHandler.ts - FIXED ALL TYPESCRIPT ERRORS
// ============================================

import { createSupabaseClient } from "../utils/supabaseClient.ts";
import { createChatbotOrder } from "../services/chatbotOrderService.ts";
// ✅ FIX ERROR #1: Import đúng function
import { getStandardizedAddress } from "../services/addressService.ts";
import { syncChatbotOrderToMainOrders } from "../services/orderSyncService.ts";
import {
  addToCart,
  clearCart,
  getCartSummary,
  getOrCreateCart,
} from "../services/cartService.ts";

/**
 * Check if user wants to add to cart
 */
export function isAddToCartIntent(message: string): boolean {
  const addKeywords = [
    "thêm",
    "lấy thêm",
    "cho thêm",
    "nữa",
    "cùng mẫu",
    "mẫu này",
    "cái này",
    /\d+\s*(?:bộ|cái|chiếc)/, // "2 bộ", "3 cái"
  ];

  const lowerMessage = message.toLowerCase();
  return addKeywords.some((keyword) => {
    if (typeof keyword === "string") {
      return lowerMessage.includes(keyword);
    } else {
      return keyword.test(lowerMessage);
    }
  });
}

export function isOrderIntent(message: string): boolean {
  const orderKeywords = [
    "đặt hàng",
    "mua",
    "order",
    "đặt mua",
    "đặt luôn",
    "lấy luôn",
    "chốt đơn",
    "em muốn mua",
    "cho em",
    "giao hàng",
  ];

  const lowerMessage = message.toLowerCase();
  return orderKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Check if customer confirmed the address/order
 */
export function isConfirmation(message: string): boolean {
  const trimmed = message.trim().toLowerCase();

  // Exact matches
  const exactMatches = ["được", "ok", "ừ", "vâng", "có", "yes"];
  if (exactMatches.includes(trimmed)) {
    return true;
  }

  // Pattern matches
  const patterns = [
    /^đúng/i,
    /^chốt/i,
    /^đồng ý/i,
    /phải rồi/i,
    /đúng rồi/i,
    /ok luôn/i,
  ];

  return patterns.some((pattern) => pattern.test(trimmed));
}

/**
 * Handle order creation
 */
export async function handleOrderCreation(body: any) {
  const { conversationId, message_text, aiResponse } = body;

  const supabase = createSupabaseClient();

  console.log("🛒 Processing order creation...");
  console.log("📋 Conversation ID:", conversationId);

  try {
    // ========================================
    // 1. GET CUSTOMER PROFILE
    // ========================================
    const { data: profile, error: profileError } = await supabase
      .from("customer_profiles")
      .select("id, full_name, preferred_name, phone, customer_fb_id")
      .eq("conversation_id", conversationId)
      .single();

    if (profileError || !profile) {
      console.error("❌ Profile not found:", profileError);
      return {
        success: false,
        message:
          "Dạ em chưa lưu được thông tin của chị. Chị vui lòng cho em tên và số điện thoại nhé 💕",
      };
    }

    // Check if profile has required info
    if (!profile.full_name && !profile.preferred_name) {
      return {
        success: false,
        message: "Dạ chị cho em xin tên của chị ạ 😊",
      };
    }

    if (!profile.phone) {
      return {
        success: false,
        message: "Dạ chị cho em xin số điện thoại ạ 📞",
      };
    }

    // ========================================
    // 2. GET SAVED ADDRESS - ✅ With DEBUG
    // ========================================
    console.log("🔍 Step 1: Calling getStandardizedAddress...");
    const savedAddress = await getStandardizedAddress(conversationId);
    console.log("🔍 Step 2: Address result:", {
      hasAddress: !!savedAddress,
      address_line: savedAddress?.address_line || "null",
      city: savedAddress?.city || "null",
      ward: savedAddress?.ward || "null",
      district: savedAddress?.district || "null",
      phone: savedAddress?.phone || "null",
    });
    console.log("📍 Retrieved address:", savedAddress);

    if (!savedAddress || !savedAddress.address_line) {
      console.error("❌ Address validation failed:", {
        savedAddress_is_null: savedAddress === null,
        savedAddress_is_undefined: savedAddress === undefined,
        address_line_missing: !savedAddress?.address_line,
      });
      return {
        success: false,
        needAddress: true,
        message:
          "Dạ chị cho em xin địa chỉ nhận hàng đầy đủ (số nhà, tên đường, quận/huyện, thành phố) để em tạo đơn ạ 💌",
      };
    }

    // Validate city is provided
    if (!savedAddress.city) {
      return {
        success: false,
        needAddress: true,
        message:
          "Dạ em cần biết thành phố giao hàng ạ. Chị cho em biết địa chỉ đầy đủ nhé 💌",
      };
    }
    console.log("✅ Address validation passed");
    // ========================================
    // 3. GET PRODUCTS FROM CART
    // ========================================
    const cart = await getOrCreateCart(conversationId);

    if (cart.length === 0) {
      return {
        success: false,
        needProducts: true,
        message:
          "Dạ giỏ hàng của chị đang trống. Chị muốn đặt sản phẩm nào ạ? Em gợi ý chị vài mẫu đẹp nhé 🌸",
      };
    }

    console.log("🛒 Cart items:", cart.length);

    // Use cart items as products
    const products = cart;

    // ========================================
    // 4. CREATE ORDER
    // ========================================
    const orderData = {
      conversationId: conversationId,
      profileId: profile.id,
      customerName: profile.preferred_name || profile.full_name || "Khách hàng",
      customerPhone: savedAddress.phone || profile.phone || "",
      customerFbId: profile.customer_fb_id,
      shippingAddress: savedAddress.address_line,
      shippingWard: savedAddress.ward || "",
      shippingDistrict: savedAddress.district || "",
      shippingCity: savedAddress.city,
      products: products,
      notes: message_text,
    };

    console.log("📦 Order data prepared:", {
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      shippingCity: orderData.shippingCity,
      productCount: orderData.products.length,
    });

    const result = await createChatbotOrder(orderData);

    // Handle error from createChatbotOrder
    if (!result.success) {
      console.error("❌ Order creation failed:", result.error);
      return {
        success: false,
        message: `Dạ em xin lỗi chị, có lỗi khi tạo đơn: ${
          result.error || "Lỗi không xác định"
        }. Chị cho em thử lại nhé 🙏`,
      };
    }

    console.log("✅ Order created successfully:", result.order.id);

    // ========================================
    // 4.5. CLEAR CART AFTER SUCCESSFUL ORDER
    // ========================================
    await clearCart(conversationId);
    console.log("✅ Cart cleared after order creation");

    // ========================================
    // 4.6. SYNC TO MAIN ORDERS (NON-BLOCKING)
    // ========================================
    syncChatbotOrderToMainOrders(result.order.id)
      .then((syncResult) => {
        if (syncResult.success) {
          console.log(
            "✅ Order synced to main system:",
            syncResult.orderNumber,
          );
        } else {
          console.error("⚠️ Order sync failed (non-blocking)");
        }
      })
      .catch((err) => {
        console.error("⚠️ Order sync error (non-blocking):", err);
      });

    // ========================================
    // 5. FORMAT SUCCESS MESSAGE - ✅ FIX ERROR #2
    // ========================================
    const summary = result.orderSummary;

    // ✅ FIX: Handle null summary
    if (!summary) {
      console.error("❌ Order summary is null");
      return {
        success: false,
        message:
          "Dạ em xin lỗi chị, có lỗi khi tạo tóm tắt đơn hàng. Chị thử lại nhé 🙏",
      };
    }

    const productList = products.map((p) =>
      `• ${p.name} - Size ${p.size} x${p.quantity}`
    ).join("\n");

    // Build full address
    const fullAddress = [
      savedAddress.address_line,
      savedAddress.ward,
      savedAddress.district,
      savedAddress.city,
    ].filter(Boolean).join(", ");

    const successMessage = `
Dạ em đã ghi nhận đơn hàng của chị! 📝

📦 SẢN PHẨM:
${productList}

💰 TỔNG TIỀN:
- Tiền hàng: ${formatPrice(summary.subtotal)}
- Phí ship: ${formatPrice(summary.shippingFee)}
${
      summary.discountAmount > 0
        ? `• Giảm giá: -${formatPrice(summary.discountAmount)}\n`
        : ""
    }• TỔNG: ${formatPrice(summary.total)}

📍 GIAO ĐẾN:
${fullAddress}

📞 SĐT: ${savedAddress.phone || profile.phone}

🚚 Bộ phận kho sẽ liên hệ chị trong hôm nay để xác nhận và giao hàng ạ.

Chị cần em hỗ trợ thêm gì không ạ? 💕
    `.trim();

    return {
      success: true,
      orderId: result.order.id,
      message: successMessage,
    };
  } catch (error: any) {
    console.error("❌ Order creation error:", error);
    return {
      success: false,
      message: "Dạ em xin lỗi chị, có lỗi xảy ra. Chị thử lại sau nhé 🙏",
    };
  }
}

/**
 * Get products from recent conversation
 * @deprecated - Use getOrCreateCart() instead
 */
async function getProductsFromConversation(
  supabase: any,
  conversationId: string,
): Promise<any[]> {
  // Get recent messages with products
  const { data: messages } = await supabase
    .from("chatbot_messages")
    .select("content")
    .eq("conversation_id", conversationId)
    .eq("sender_type", "bot")
    .order("created_at", { ascending: false })
    .limit(5);

  const products: any[] = [];
  const seenProductIds = new Set<string>();

  for (const msg of messages || []) {
    const content = msg.content;
    if (content.products && Array.isArray(content.products)) {
      for (const product of content.products) {
        if (!seenProductIds.has(product.id)) {
          // Get product details with images
          const { data: fullProduct } = await supabase
            .from("products")
            .select(`
              id, name, price,
              images:product_images(image_url, is_primary)
            `)
            .eq("id", product.id)
            .single();

          if (fullProduct) {
            const primaryImage = fullProduct.images?.find((img: any) =>
              img.is_primary
            );

            products.push({
              product_id: fullProduct.id,
              name: fullProduct.name,
              price: fullProduct.price,
              size: "M", // Default size, TODO: get from conversation
              quantity: 1,
              image: primaryImage?.image_url ||
                fullProduct.images?.[0]?.image_url || "",
            });

            seenProductIds.add(product.id);
          }
        }
      }
    }
  }

  return products;
}

/**
 * Format price to VND
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}
