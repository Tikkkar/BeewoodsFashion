// ============================================
// ZALO ZNS HANDLER
// File: handlers/zaloHandler.ts
// ============================================

import {
  formatDateForZNS,
  getOrderStatusVN,
  saveZaloConsent,
  sendZaloZNS,
} from "../services/zaloZnsService.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Handle SEND_ZNS action
 * Gửi ZNS notification cho đơn hàng
 */
export async function handleSendZNS(payload: any): Promise<any> {
  try {
    console.log("[ZNS Handler] Sending ZNS for order:", payload.order_number);

    const {
      order_number,
      customer_name,
      customer_phone,
      zalo_user_id,
      order_date,
      order_status,
    } = payload;

    // Validate required fields
    if (!order_number || !customer_name || !zalo_user_id) {
      throw new Error(
        "Missing required fields: order_number, customer_name, zalo_user_id"
      );
    }

    // Format date
    const formattedDate = order_date
      ? formatDateForZNS(order_date)
      : formatDateForZNS(new Date());

    // Format status
    const formattedStatus = order_status
      ? getOrderStatusVN(order_status)
      : "Đang xử lý";

    // Send ZNS
    const result = await sendZaloZNS({
      order_number,
      customer_name,
      customer_phone: customer_phone || "",
      zalo_user_id,
      order_date: formattedDate,
      order_status: formattedStatus,
    });

    return {
      success: true,
      message: "ZNS sent successfully",
      data: result,
    };
  } catch (error) {
    console.error("[ZNS Handler] Error:", error);
    throw error;
  }
}

/**
 * Handle SAVE_ZALO_CONSENT action
 * Lưu thông tin đồng ý nhận ZNS của khách
 */
export async function handleSaveZaloConsent(payload: any): Promise<any> {
  try {
    console.log("[ZNS Handler] Saving Zalo consent:", payload.customer_phone);

    const { customer_phone, zalo_user_id } = payload;

    if (!customer_phone || !zalo_user_id) {
      throw new Error("Missing required fields: customer_phone, zalo_user_id");
    }

    const result = await saveZaloConsent(customer_phone, zalo_user_id);

    return {
      success: true,
      message: "Zalo consent saved",
      data: result,
    };
  } catch (error) {
    console.error("[ZNS Handler] Error:", error);
    throw error;
  }
}

/**
 * Handle SEND_ORDER_ZNS action
 * Tự động gửi ZNS khi tạo đơn hàng
 * Lấy thông tin order từ database và gửi ZNS
 */
export async function handleSendOrderZNS(payload: any): Promise<any> {
  try {
    console.log("[ZNS Handler] Sending ZNS for order:", payload.order_number);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get order info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", payload.order_number)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${payload.order_number}`);
    }

    // Get customer profile with Zalo info
    const { data: profile, error: profileError } = await supabase
      .from("customer_profiles")
      .select("*")
      .eq("phone", order.customer_phone)
      .single();

    if (profileError || !profile) {
      console.warn("Customer profile not found, using order info only");
    }

    // Check if customer has Zalo consent
    const zalo_user_id = profile?.zalo_user_id || payload.zalo_user_id;

    if (!zalo_user_id) {
      console.warn("No Zalo user ID found, cannot send ZNS");
      return {
        success: false,
        message: "Customer has not consented to receive ZNS",
      };
    }

    // Send ZNS
    const result = await sendZaloZNS({
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      zalo_user_id: zalo_user_id,
      order_date: formatDateForZNS(order.created_at),
      order_status: getOrderStatusVN(order.status),
    });

    return {
      success: true,
      message: "ZNS sent successfully",
      data: result,
    };
  } catch (error) {
    console.error("[ZNS Handler] Error:", error);
    throw error;
  }
}

/**
 * Handle GET_ZNS_LOGS action
 * Lấy lịch sử gửi ZNS
 */
export async function handleGetZNSLogs(payload: any): Promise<any> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { order_number, limit = 20 } = payload;

    let query = supabase
      .from("zalo_zns_logs")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (order_number) {
      query = query.eq("order_number", order_number);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("[ZNS Handler] Error:", error);
    throw error;
  }
}
