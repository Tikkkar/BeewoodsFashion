// ============================================
// index.ts - Main entry point (UPGRADED WITH ZALO ZNS)
// ============================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { handleMessage } from "./handlers/messageHandler.ts";

// === CART SERVICES ===
import {
  addToCart,
  getCartSummary,
  removeFromCart,
  updateCartItem,
} from "./services/cartService.ts";

// === CUSTOMER SERVICES ===
import { saveCustomerProfile } from "./services/customerProfileService.ts";
import { saveAddressStandardized } from "./services/addressService.ts";

// === ORDER SERVICES ===
import { handleOrderCreation } from "./handlers/orderHandler.ts";

// === MESSAGING SERVICES ===
import { sendFacebookMessage } from "./services/facebookService.ts";
import { sendZaloMessage } from "./services/zaloService.ts";

// === 🆕 ZALO ZNS SERVICES ===
import {
  handleSendZNS,
  handleSaveZaloConsent,
  handleSendOrderZNS,
  handleGetZNSLogs,
} from "./handlers/zaloHandler.ts";

// =========================================================
// MAIN SERVER LOGIC
// =========================================================
serve(async (req: Request) => {
  // Handle CORS Preflight
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
        // ==========================================
        // CART ACTIONS
        // ==========================================
        case "ADD_TO_CART":
          result = await addToCart(payload.conversationId, payload.productData);
          break;

        case "GET_CART_SUMMARY":
          result = await getCartSummary(payload.conversationId);
          break;

        case "REMOVE_FROM_CART":
          result = await removeFromCart(
            payload.conversationId,
            payload.productId
          );
          break;

        case "UPDATE_CART_ITEM":
          result = await updateCartItem(
            payload.conversationId,
            payload.productId,
            payload.updates
          );
          break;

        // ==========================================
        // CUSTOMER PROFILE ACTIONS
        // ==========================================
        case "SAVE_PROFILE":
          result = await saveCustomerProfile(
            payload.conversationId,
            payload.profileData
          );
          break;

        case "SAVE_ADDRESS":
          result = await saveAddressStandardized(
            payload.conversationId,
            payload.addressData
          );
          break;

        // ==========================================
        // ORDER ACTIONS
        // ==========================================
        case "CREATE_ORDER":
          result = await handleOrderCreation({
            conversationId: payload.conversationId,
            message_text: "Tạo đơn hàng qua API",
            aiResponse: {},
          });
          break;

        // ==========================================
        // MESSAGING ACTIONS
        // ==========================================
        case "SEND_FACEBOOK_MESSAGE":
          result = await sendFacebookMessage(
            payload.recipientId,
            payload.text,
            payload.accessToken,
            payload.products
          );
          break;

        case "SEND_ZALO_MESSAGE":
          result = await sendZaloMessage(
            payload.recipientId,
            payload.text,
            payload.accessToken,
            payload.products
          );
          break;

        // ==========================================
        // 🆕 ZALO ZNS ACTIONS
        // ==========================================

        /**
         * SEND_ZNS - Gửi ZNS notification
         * Payload: {
         *   order_number: string,
         *   customer_name: string,
         *   customer_phone: string,
         *   zalo_user_id: string,
         *   order_date?: string,
         *   order_status?: string
         * }
         */
        case "SEND_ZNS":
          result = await handleSendZNS(payload);
          break;

        /**
         * SAVE_ZALO_CONSENT - Lưu đồng ý nhận ZNS
         * Payload: {
         *   customer_phone: string,
         *   zalo_user_id: string
         * }
         */
        case "SAVE_ZALO_CONSENT":
          result = await handleSaveZaloConsent(payload);
          break;

        /**
         * SEND_ORDER_ZNS - Tự động gửi ZNS cho đơn hàng
         * Lấy thông tin từ database và gửi
         * Payload: {
         *   order_number: string,
         *   zalo_user_id?: string (optional, sẽ lấy từ customer_profiles)
         * }
         */
        case "SEND_ORDER_ZNS":
          result = await handleSendOrderZNS(payload);
          break;

        /**
         * GET_ZNS_LOGS - Lấy lịch sử gửi ZNS
         * Payload: {
         *   order_number?: string (optional),
         *   limit?: number (default: 20)
         * }
         */
        case "GET_ZNS_LOGS":
          result = await handleGetZNSLogs(payload);
          break;

        // ==========================================
        // UNKNOWN ACTION
        // ==========================================
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Standard message handling (chat messages)
      console.log(
        "[Router] Received standard message, handing off to messageHandler..."
      );
      const result = await handleMessage(body);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/*
 * ============================================
 * USAGE EXAMPLES
 * ============================================
 *
 * 1. Gửi ZNS cho đơn hàng mới:
 *
 * curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/chatbot-process \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "action": "SEND_ORDER_ZNS",
 *     "payload": {
 *       "order_number": "ORD-001"
 *     }
 *   }'
 *
 * 2. Lưu Zalo consent:
 *
 * curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/chatbot-process \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "action": "SAVE_ZALO_CONSENT",
 *     "payload": {
 *       "customer_phone": "0912345678",
 *       "zalo_user_id": "user_id_from_consent_widget"
 *     }
 *   }'
 *
 * 3. Gửi ZNS với data đầy đủ:
 *
 * curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/chatbot-process \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "action": "SEND_ZNS",
 *     "payload": {
 *       "order_number": "ORD-001",
 *       "customer_name": "Nguyễn Văn A",
 *       "customer_phone": "0912345678",
 *       "zalo_user_id": "user_id_123",
 *       "order_date": "2024-11-01",
 *       "order_status": "pending"
 *     }
 *   }'
 *
 * 4. Xem lịch sử ZNS:
 *
 * curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/chatbot-process \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "action": "GET_ZNS_LOGS",
 *     "payload": {
 *       "order_number": "ORD-001",
 *       "limit": 10
 *     }
 *   }'
 */
