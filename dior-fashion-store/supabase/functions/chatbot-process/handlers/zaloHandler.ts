// ============================================
// ZALO ZNS HANDLER
// File: handlers/zaloHandler.ts
// Bao gồm logic cập nhật Zalo Consent vào customer_profiles
// ============================================

import {
  formatDateForZNS,
  getOrderStatusVN,
  saveZaloConsent, // Vẫn giữ lại hàm này cho các trường hợp chỉ lưu consent
  sendZaloZNS,
} from "../services/zaloZnsService.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Handle SEND_ZNS action
 * Gửi ZNS notification với đầy đủ data được cung cấp.
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
 * Chỉ lưu thông tin đồng ý nhận ZNS của khách (sử dụng riêng)
 */
export async function handleSaveZaloConsent(payload: any): Promise<any> {
  try {
    console.log("[ZNS Handler] Saving Zalo consent:", payload.customer_phone);

    const { customer_phone, zalo_user_id } = payload;

    if (!customer_phone || !zalo_user_id) {
      throw new Error("Missing required fields: customer_phone, zalo_user_id");
    }

    // Hàm saveZaloConsent được import từ zaloZnsService
    // Giả định hàm này thực hiện logic upsert vào customer_profiles
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
 * Lấy thông tin order từ database và gửi ZNS
 */
export async function handleSendOrderZNS(payload: any): Promise<any> {
  try {
    const { order_number, zalo_user_id: newZaloUserId } = payload;

    console.log(`[ZNS Handler] Processing SEND_ORDER_ZNS for: ${order_number}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Lấy thông tin đơn hàng
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("customer_name, customer_phone, created_at, status")
      .eq("order_number", order_number)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${order_number}`);
    }

    // 2. Kiểm tra Zalo User ID từ payload (từ trang OrderSuccess)
    if (!newZaloUserId) {
      console.warn(
        "No Zalo user ID provided in payload, cannot send ZNS or save consent."
      );
      return {
        success: false,
        message: "No Zalo User ID provided from frontend.",
      };
    }

    // 3. [LOGIC MỚI] Lưu hoặc cập nhật thông tin Zalo vào customer_profiles
    // Sử dụng upsert để tạo mới nếu chưa có profile hoặc cập nhật nếu đã có
    const { error: profileUpdateError } = await supabase
      .from("customer_profiles")
      .upsert(
        {
          phone: order.customer_phone, // Khóa để tìm kiếm (cần đảm bảo SĐT là unique)
          full_name: order.customer_name, // Cập nhật tên nếu là người dùng mới
          zalo_user_id: newZaloUserId,
          zalo_consent_date: new Date().toISOString(),
          zalo_consent_active: true,
        },
        {
          onConflict: "phone", // Nếu SĐT đã tồn tại, cập nhật các trường khác
        }
      );

    if (profileUpdateError) {
      console.error("Failed to save Zalo consent:", profileUpdateError.message);
      // Không dừng lại, vẫn cố gắng gửi ZNS
    } else {
      console.log(
        "✅ Zalo consent saved successfully for phone:",
        order.customer_phone
      );
    }

    // 4. Gửi ZNS như bình thường
    const result = await sendZaloZNS({
      order_number: order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      zalo_user_id: newZaloUserId, // Dùng ID mới nhất từ payload
      order_date: formatDateForZNS(order.created_at),
      order_status: getOrderStatusVN(order.status),
    });

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
