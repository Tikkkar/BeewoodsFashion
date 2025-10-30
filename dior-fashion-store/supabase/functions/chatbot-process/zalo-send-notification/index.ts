// ============================================
// ZALO ZNS NOTIFICATION EDGE FUNCTION
// File: supabase/functions/zalo-send-notification/index.ts
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Zalo API Configuration
const ZALO_API_URL = "https://business.openapi.zalo.me/message/template";
const ZALO_ACCESS_TOKEN = Deno.env.get("ZALO_ACCESS_TOKEN") || "";
const ZALO_TEMPLATE_ID = Deno.env.get("ZALO_TEMPLATE_ID") || "";

interface ZNSOrderData {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  zalo_user_id: string;
  order_date: string; // Format: DD/MM/YYYY
  order_status: string;
}

interface ZaloAPIResponse {
  error: number;
  message: string;
  data?: {
    msg_id: string;
    sent_time: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    // Validate request method
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    // Parse request body
    const body: ZNSOrderData = await req.json();
    console.log("📱 Received ZNS request:", {
      order_number: body.order_number,
      customer_name: body.customer_name,
      zalo_user_id: body.zalo_user_id,
    });

    // Validate required fields
    if (!body.order_number || !body.zalo_user_id || !body.customer_name) {
      throw new Error(
        "Missing required fields: order_number, zalo_user_id, customer_name"
      );
    }

    // Validate environment variables
    if (!ZALO_ACCESS_TOKEN) {
      throw new Error("ZALO_ACCESS_TOKEN not configured");
    }
    if (!ZALO_TEMPLATE_ID) {
      throw new Error("ZALO_TEMPLATE_ID not configured");
    }

    // Prepare ZNS payload according to Zalo API spec
    const znsPayload = {
      phone: body.zalo_user_id, // user_id_by_app from consent
      template_id: ZALO_TEMPLATE_ID,
      template_data: {
        date: body.order_date || new Date().toLocaleDateString("vi-VN"),
        order_code: body.order_number,
        name: body.customer_name,
        status: body.order_status || "Đang xử lý",
      },
      tracking_id: `ORDER_${body.order_number}_${Date.now()}`,
    };

    console.log("📤 Sending ZNS with payload:", znsPayload);

    // Call Zalo ZNS API
    const zaloResponse = await fetch(ZALO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ZALO_ACCESS_TOKEN,
      },
      body: JSON.stringify(znsPayload),
    });

    const result: ZaloAPIResponse = await zaloResponse.json();
    console.log("📥 Zalo API response:", result);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Log ZNS attempt to database
    const logData = {
      order_number: body.order_number,
      zalo_user_id: body.zalo_user_id,
      customer_phone: body.customer_phone,
      template_id: ZALO_TEMPLATE_ID,
      status: result.error === 0 ? "sent" : "failed",
      response: result,
      error_message: result.error !== 0 ? result.message : null,
      sent_at: new Date().toISOString(),
    };

    await supabase.from("zalo_zns_logs").insert(logData);

    // Handle Zalo API response
    if (result.error === 0) {
      console.log("✅ ZNS sent successfully:", result.data);

      // Update customer profile with zalo_user_id if not exists
      if (body.customer_phone) {
        await supabase
          .from("customer_profiles")
          .update({
            zalo_user_id: body.zalo_user_id,
            zalo_consent_date: new Date().toISOString(),
            zalo_consent_active: true,
          })
          .eq("phone", body.customer_phone);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "ZNS notification sent successfully",
          data: {
            msg_id: result.data?.msg_id,
            sent_time: result.data?.sent_time,
            order_number: body.order_number,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } else {
      // Zalo API returned error
      console.error("❌ Zalo API error:", result);

      // Map common Zalo error codes
      const errorMessages: { [key: number]: string } = {
        [-124]: "Invalid or expired access token",
        [-216]: "Invalid template ID",
        [-218]: "User has not followed the Official Account",
        [-220]: "Invalid template data format",
        [-201]: "Rate limit exceeded",
      };

      const userMessage = errorMessages[result.error] || result.message;

      return new Response(
        JSON.stringify({
          success: false,
          error: "zalo_api_error",
          message: userMessage,
          error_code: result.error,
          details: result.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  } catch (error) {
    console.error("❌ Error in ZNS function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "internal_error",
        message: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

/* 
DEPLOYMENT INSTRUCTIONS:
========================

1. Deploy this function:
   supabase functions deploy zalo-send-notification

2. Set environment variables:
   supabase secrets set ZALO_ACCESS_TOKEN=your_access_token_here
   supabase secrets set ZALO_TEMPLATE_ID=your_template_id_here

3. Test the function:
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/zalo-send-notification \
     -H "Content-Type: application/json" \
     -d '{
       "order_number": "ORD-001",
       "customer_name": "Nguyễn Văn A",
       "customer_phone": "0912345678",
       "zalo_user_id": "user_id_from_consent",
       "order_date": "01/11/2024",
       "order_status": "Đang xử lý"
     }'

4. Create the logs table:
   Run the SQL from ZALO_ZNS_INTEGRATION_GUIDE.md

5. Monitor logs:
   supabase functions logs zalo-send-notification

ERROR CODES REFERENCE:
======================
-124: Invalid access token (refresh token required)
-201: Rate limit exceeded (max 50 requests/second)
-216: Invalid template_id
-218: User hasn't followed OA (must follow first)
-220: Template data format mismatch
-222: Template not approved yet

TESTING TIPS:
=============
1. Use Zalo Developer's test user feature
2. Check template status is "approved"
3. Verify user has followed your Official Account
4. Use correct date format: DD/MM/YYYY
5. Check access token expiration (refresh every 90 days)
*/
