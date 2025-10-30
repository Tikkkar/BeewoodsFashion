// ============================================
// ZALO ZNS SERVICE
// File: services/zaloZnsService.ts
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Prepare payload
    const znsPayload = {
      phone: orderData.zalo_user_id,
      template_id: ZALO_TEMPLATE_ID,
      template_data: {
        date: orderData.order_date,
        order_code: orderData.order_number,
        name: orderData.customer_name,
        status: orderData.order_status,
      },
      tracking_id: `ORDER_${orderData.order_number}_${Date.now()}`,
    };

    console.log("📤 ZNS Payload:", znsPayload);

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
    console.log("📥 Zalo API response:", result);

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
      template_id: ZALO_TEMPLATE_ID,
      status: result.error === 0 ? "sent" : "failed",
      response: result,
      error_message: result.error !== 0 ? result.message : null,
      sent_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("zalo_zns_logs").insert(logData);

    if (error) {
      console.error("Failed to log ZNS:", error);
    }
  } catch (error) {
    console.error("Error logging ZNS:", error);
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
      .update({
        zalo_user_id: zalo_user_id,
        zalo_consent_date: new Date().toISOString(),
        zalo_consent_active: true,
      })
      .eq("phone", customer_phone)
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Zalo consent saved for:", customer_phone);
    return data;
  } catch (error) {
    console.error("Error saving Zalo consent:", error);
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
