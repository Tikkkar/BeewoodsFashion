// ============================================
// index.ts - Main entry point (UPGRADED WITH ZALO ZNS + AUTO TOKEN REFRESH)
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
// 🔑 ZALO TOKEN MANAGEMENT
// =========================================================

// Cache access token in memory (valid for 1 hour typically)
let cachedAccessToken: string | null = null;
let tokenExpiryTime: number = 0;

/**
 * Refresh Zalo Access Token using Refresh Token
 */
async function refreshZaloAccessToken(): Promise<string | null> {
  const ZALO_APP_ID = Deno.env.get("ZALO_APP_ID") || "2783779431140209468";
  const ZALO_SECRET_KEY = Deno.env.get("ZALO_SECRET_KEY");
  const ZALO_REFRESH_TOKEN = Deno.env.get("ZALO_REFRESH_TOKEN");

  if (!ZALO_SECRET_KEY || !ZALO_REFRESH_TOKEN) {
    console.error("❌ Missing ZALO_SECRET_KEY or ZALO_REFRESH_TOKEN");
    return null;
  }

  try {
    console.log("🔄 Refreshing Zalo access token...");

    const response = await fetch(
      "https://oauth.zaloapp.com/v4/oa/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          secret_key: ZALO_SECRET_KEY,
        },
        body: new URLSearchParams({
          refresh_token: ZALO_REFRESH_TOKEN,
          app_id: ZALO_APP_ID,
          grant_type: "refresh_token",
        }),
      }
    );

    const data = await response.json();

    console.log("📥 Token refresh response:", {
      error: data.error,
      message: data.message,
      hasAccessToken: !!data.access_token,
    });

    if (data.error === 0 && data.access_token) {
      cachedAccessToken = data.access_token;
      // Cache token for 50 minutes (3000 seconds) to be safe
      tokenExpiryTime = Date.now() + 3000 * 1000;

      console.log("✅ Access token refreshed successfully");
      console.log(
        "🔑 New token (first 20 chars):",
        data.access_token.substring(0, 20) + "..."
      );

      return data.access_token;
    } else {
      console.error("❌ Failed to refresh token:", data);
      return null;
    }
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return null;
  }
}

/**
 * Get valid Zalo Access Token (from cache or refresh)
 */
async function getValidZaloAccessToken(): Promise<string | null> {
  // Check if cached token is still valid
  if (cachedAccessToken && Date.now() < tokenExpiryTime) {
    console.log("✅ Using cached access token");
    return cachedAccessToken;
  }

  console.log("⏰ Token expired or not cached, refreshing...");
  return await refreshZaloAccessToken();
}

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
        // 🆕 ZALO ZNS ACTIONS (WITH AUTO TOKEN REFRESH)
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
        case "SEND_ZNS": {
          const accessToken = await getValidZaloAccessToken();
          if (!accessToken) {
            return new Response(
              JSON.stringify({
                success: false,
                error:
                  "Cannot refresh Zalo access token. Check ZALO_SECRET_KEY and ZALO_REFRESH_TOKEN.",
              }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          result = await handleSendZNS(payload, accessToken);
          break;
        }

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
         *   customer_name: string,
         *   customer_phone: string,
         *   zalo_user_id: string,
         *   order_date?: string,
         *   order_status?: string
         * }
         */
        case "SEND_ORDER_ZNS": {
          const accessToken = await getValidZaloAccessToken();
          if (!accessToken) {
            return new Response(
              JSON.stringify({
                success: false,
                error:
                  "Cannot refresh Zalo access token. Check ZALO_SECRET_KEY and ZALO_REFRESH_TOKEN.",
              }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          result = await handleSendOrderZNS(payload, accessToken);
          break;
        }

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

        /**
         * REFRESH_ZALO_TOKEN - Manually refresh token (for testing)
         */
        case "REFRESH_ZALO_TOKEN": {
          const newToken = await refreshZaloAccessToken();
          result = {
            success: !!newToken,
            token: newToken ? newToken.substring(0, 20) + "..." : null,
            expiresAt: new Date(tokenExpiryTime).toISOString(),
          };
          break;
        }

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
 * 1. Gửi ZNS cho đơn hàng mới (auto refresh token):
 *
 * curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/chatbot-process \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
 *   -d '{
 *     "action": "SEND_ORDER_ZNS",
 *     "payload": {
 *       "order_number": "BEWO-2510301988",
 *       "customer_name": "Ducvit12",
 *       "customer_phone": "84868945899",
 *       "zalo_user_id": "7202759495111049759",
 *       "order_date": "30/10/2025",
 *       "order_status": "Đang xử lý"
 *     }
 *   }'
 *
 * 2. Manually refresh token (for testing):
 *
 * curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/chatbot-process \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "action": "REFRESH_ZALO_TOKEN",
 *     "payload": {}
 *   }'
 *
 * 3. Lưu Zalo consent:
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
 * 4. Xem lịch sử ZNS:
 *
 * curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/chatbot-process \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "action": "GET_ZNS_LOGS",
 *     "payload": {
 *       "order_number": "BEWO-2510301988",
 *       "limit": 10
 *     }
 *   }'
 *
 * ============================================
 * REQUIRED ENVIRONMENT VARIABLES
 * ============================================
 *
 * Set these in Supabase Dashboard → Edge Functions → Secrets:
 *
 * ZALO_APP_ID=2783779431140209468
 * ZALO_OA_ID=870752253827008707
 * ZALO_SECRET_KEY=<your_secret_key_from_zalo_developer>
 * ZALO_REFRESH_TOKEN=<your_refresh_token_from_zalo>
 */
