// index.ts - Main entry point (UPGRADED WITH ROUTER & FIXES)
// =========================================================

// Deno standard library
// Kiểu 'Request' được thêm vào để sửa lỗi type
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// CORS and Main Handler
import { corsHeaders } from "./utils/cors.ts";
import { handleMessage } from "./handlers/messageHandler.ts";

// === IMPORT TẤT CẢ CÁC SERVICE MÀ TOOL SẼ GỌI ===
import {
  addToCart,
  getCartSummary,
  removeFromCart,
  updateCartItem,
} from "./services/cartService.ts";
import {
  saveCustomerProfile,
} from "./services/customerProfileService.ts";
import { saveAddressStandardized } from "./services/addressService.ts";
import { handleOrderCreation } from "./handlers/orderHandler.ts";
import { sendFacebookMessage } from "./services/facebookService.ts";

// =========================================================
// MAIN SERVER LOGIC
// =========================================================
// Sửa lỗi: Thêm kiểu 'Request' cho tham số 'req'
serve(async (req: Request) => {
  // Xử lý CORS Preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action) {
      console.log(`[Router] Received action: ${action}`);
      let result: any;

      switch (action) {
        case "ADD_TO_CART":
          result = await addToCart(payload.conversationId, payload.productData);
          break;
        case "GET_CART_SUMMARY":
          result = await getCartSummary(payload.conversationId);
          break;
        case "SAVE_PROFILE":
          result = await saveCustomerProfile(
            payload.conversationId,
            payload.profileData,
          );
          break;
        case "SAVE_ADDRESS":
          result = await saveAddressStandardized(
            payload.conversationId,
            payload.addressData,
          );
          break;
        case "CREATE_ORDER":
          result = await handleOrderCreation({
            conversationId: payload.conversationId,
            message_text: "Tạo đơn hàng qua API",
            aiResponse: {},
          });
          break;
        case "SEND_FACEBOOK_MESSAGE":
          result = await sendFacebookMessage(
            payload.recipientId,
            payload.text,
            payload.accessToken,
            payload.products,
          );
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      console.log(
        "[Router] Received standard message, handing off to messageHandler...",
      );
      const result = await handleMessage(body);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error:", error);
    // Sửa lỗi: Kiểm tra kiểu của 'error' trước khi sử dụng
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
