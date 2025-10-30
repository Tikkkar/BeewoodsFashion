// ============================================
// ZALO ZNS HANDLER (UPDATED WITH ACCESS TOKEN SUPPORT)
// File: handlers/zaloHandler.ts
// Bao gồm logic cập nhật Zalo Consent vào customer_profiles
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
 * Gửi ZNS notification với đầy đủ data được cung cấp.
 * @param payload - Order data
 * @param accessToken - Dynamic Zalo access token from index.ts
 */
export async function handleSendZNS(
  payload: any,
  accessToken: string
): Promise<any> {
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

    // Send ZNS with dynamic access token
    const result = await sendZaloZNS(
      {
        order_number,
        customer_name,
        customer_phone: customer_phone || "",
        zalo_user_id,
        order_date: formattedDate,
        order_status: formattedStatus,
      },
      accessToken
    );

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
 * Chỉ lưu thông tin đồng ý nhận ZNS của khách (sử dụng riêng)
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
 * [ĐÃ CẬP NHẬT]
 * Tự động gửi ZNS khi tạo đơn VÀ LƯU ZALO CONSENT
 * @param payload - Contains order_number, customer info, and zalo_user_id
 * @param accessToken - Dynamic Zalo access token from index.ts
 */
export async function handleSendOrderZNS(
  payload: any,
  accessToken: string
): Promise<any> {
  try {
    const {
      order_number,
      customer_name,
      customer_phone,
      zalo_user_id,
      order_date,
      order_status,
    } = payload;

    console.log(`[ZNS Handler] Processing SEND_ORDER_ZNS for: ${order_number}`);

    // Validate required fields from payload
    if (!order_number) {
      throw new Error("order_number is required");
    }

    if (!zalo_user_id) {
      console.warn(
        "No Zalo user ID provided in payload, cannot send ZNS or save consent."
      );
      return {
        success: false,
        message: "No Zalo User ID provided from frontend.",
      };
    }

    if (!customer_phone) {
      throw new Error("customer_phone is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // [LOGIC MỚI] Lưu hoặc cập nhật thông tin Zalo vào customer_profiles
    console.log(`💾 Saving Zalo consent for phone: ${customer_phone}`);
    const { error: profileUpdateError } = await supabase
      .from("customer_profiles")
      .upsert(
        {
          phone: customer_phone,
          full_name: customer_name,
          zalo_user_id: zalo_user_id,
          zalo_consent_date: new Date().toISOString(),
          zalo_consent_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "phone",
        }
      );

    if (profileUpdateError) {
      console.error(
        "❌ Failed to save Zalo consent:",
        profileUpdateError.message
      );
      // Không dừng lại, vẫn cố gắng gửi ZNS
    } else {
      console.log(
        "✅ Zalo consent saved successfully for phone:",
        customer_phone
      );
    }

    // Gửi ZNS với access token động
    const result = await sendZaloZNS(
      {
        order_number: order_number,
        customer_name: customer_name,
        customer_phone: customer_phone,
        zalo_user_id: zalo_user_id,
        order_date: order_date || formatDateForZNS(new Date()),
        order_status: order_status || "Đang xử lý",
      },
      accessToken
    );

    return {
      success: true,
      message: "ZNS sent and consent saved successfully",
      data: result,
    };
  } catch (error) {
    console.error("[ZNS Handler] Error in handleSendOrderZNS:", error);
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
