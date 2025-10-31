// ============================================
// ZALO ZNS SERVICE (FIXED - TEMPLATE_ID ALWAYS INCLUDED)
// File: services/zaloZnsService.ts
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ZALO_API_URL = "https://business.openapi.zalo.me/message/template";
const ZALO_ACCESS_TOKEN = Deno.env.get("ZALO_ACCESS_TOKEN") || ""; // ✅ Static token
const ZALO_TEMPLATE_ID = Deno.env.get("ZALO_TEMPLATE_ID") || "501443"; // ✅ Default template ID

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

/**
 * Gửi ZNS notification qua Zalo
 */
export async function sendZaloZNS(orderData: ZNSOrderData): Promise<any> {
  try {
    console.log("📱 Sending ZNS notification:", {
      order_number: orderData.order_number,
      customer_name: orderData.customer_name,
      zalo_user_id: orderData.zalo_user_id,
    });

    // Validate
    if (!ZALO_ACCESS_TOKEN) {
      throw new Error("ZALO_ACCESS_TOKEN not configured");
    }
    if (!ZALO_TEMPLATE_ID) {
      throw new Error("ZALO_TEMPLATE_ID not configured");
    }

    console.log(
      "🔑 Using access token (first 20 chars):",
      ZALO_ACCESS_TOKEN.substring(0, 20) + "..."
    );
    console.log("📋 Using template ID:", ZALO_TEMPLATE_ID); // ✅ Log template ID

    // Format phone number (convert 0xxx to 84xxx)
    const formattedPhone = orderData.customer_phone.replace(/^0/, "84");

    // Prepare payload
    const znsPayload = {
      phone: formattedPhone,
      template_id: ZALO_TEMPLATE_ID,
      template_data: {
        date: orderData.order_date,
        order_code: orderData.order_number,
        name: orderData.customer_name,
        status: orderData.order_status,
      },
      tracking_id: orderData.zalo_user_id,
    };

    console.log("📤 ZNS Payload:", JSON.stringify(znsPayload, null, 2));

    // Call Zalo API
    const response = await fetch(ZALO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ZALO_ACCESS_TOKEN,
      },
      body: JSON.stringify(znsPayload),
    });

    const result: ZaloAPIResponse = await response.json();
    console.log("📥 Zalo API response:", JSON.stringify(result, null, 2));

    // Log to database
    await logZNS(orderData, result);

    if (result.error === 0) {
      console.log("✅ ZNS sent successfully");
      return {
        success: true,
        msg_id: result.data?.msg_id,
        sent_time: result.data?.sent_time,
      };
    } else {
      console.error("❌ Zalo API error:", result);
      throw new Error(`Zalo API error ${result.error}: ${result.message}`);
    }
  } catch (error) {
    console.error("❌ Error sending ZNS:", error);
    throw error;
  }
}

/**
 * Log ZNS attempt to database
 * ✅ FIXED: Always include template_id with fallback
 */
async function logZNS(
  orderData: ZNSOrderData,
  result: ZaloAPIResponse
): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const logData = {
      order_number: orderData.order_number,
      zalo_user_id: orderData.zalo_user_id,
      customer_phone: orderData.customer_phone,
      template_id: ZALO_TEMPLATE_ID || "501443", // ✅ CRITICAL: Always provide template_id
      status: result.error === 0 ? "sent" : "failed",
      response: result,
      error_message: result.error !== 0 ? result.message : null,
      sent_at: new Date().toISOString(),
    };

    console.log("💾 Saving ZNS log with template_id:", logData.template_id);

    const { error } = await supabase.from("zalo_zns_logs").insert(logData);

    if (error) {
      console.error("❌ Failed to log ZNS:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("✅ ZNS log saved successfully");
    }
  } catch (error) {
    console.error("❌ Exception while logging ZNS:", error);
  }
}

/**
 * Save Zalo user consent to customer profile
 */
export async function saveZaloConsent(
  customer_phone: string,
  zalo_user_id: string
): Promise<any> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase
      .from("customer_profiles")
      .upsert(
        {
          phone: customer_phone,
          zalo_user_id: zalo_user_id,
          zalo_consent_date: new Date().toISOString(),
          zalo_consent_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "phone",
        }
      )
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Zalo consent saved for:", customer_phone);
    return data;
  } catch (error) {
    console.error("❌ Error saving Zalo consent:", error);
    throw error;
  }
}

/**
 * Format date for ZNS (DD/MM/YYYY)
 */
export function formatDateForZNS(date: Date | string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get order status in Vietnamese
 */
export function getOrderStatusVN(status: string): string {
  const statusMap: { [key: string]: string } = {
    pending: "Chờ xác nhận",
    processing: "Đang xử lý",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao hàng",
    delivered: "Đã giao hàng",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  return statusMap[status] || "Đang xử lý";
}
