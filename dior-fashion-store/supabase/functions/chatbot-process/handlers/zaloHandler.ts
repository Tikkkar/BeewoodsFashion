// ============================================
// ZALO ZNS HANDLER (FIXED - NO UNIQUE CONSTRAINT NEEDED)
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

    if (!order_number || !customer_name || !zalo_user_id) {
      throw new Error(
        "Missing required fields: order_number, customer_name, zalo_user_id"
      );
    }

    const formattedDate = order_date
      ? formatDateForZNS(order_date)
      : formatDateForZNS(new Date());

    const formattedStatus = order_status
      ? getOrderStatusVN(order_status)
      : "Đang xử lý";

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
 * ✅ FIXED: Properly save consent without requiring unique constraint
 */
export async function handleSendOrderZNS(payload: any): Promise<any> {
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

    if (!order_number) {
      throw new Error("order_number is required");
    }

    if (!zalo_user_id) {
      console.warn("No Zalo user ID provided");
      return {
        success: false,
        message: "No Zalo User ID provided",
      };
    }

    if (!customer_phone) {
      throw new Error("customer_phone is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ✅ FIXED: Check if profile exists first
    console.log(`🔍 Checking for existing profile: ${customer_phone}`);

    const { data: existingProfile, error: checkError } = await supabase
      .from("customer_profiles")
      .select("id, phone, zalo_user_id, zalo_consent_active")
      .eq("phone", customer_phone)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("❌ Error checking profile:", checkError);
      throw checkError;
    }

    let profileUpdateError;

    if (existingProfile) {
      // ✅ Profile exists - UPDATE
      console.log(`📝 Updating existing profile ID: ${existingProfile.id}`);

      const { error: updateError } = await supabase
        .from("customer_profiles")
        .update({
          full_name: customer_name,
          zalo_user_id: zalo_user_id,
          zalo_consent_date: new Date().toISOString(),
          zalo_consent_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProfile.id);

      profileUpdateError = updateError;
    } else {
      // ✅ Profile doesn't exist - INSERT
      console.log(`➕ Creating new profile for: ${customer_phone}`);

      const { error: insertError } = await supabase
        .from("customer_profiles")
        .insert({
          phone: customer_phone,
          full_name: customer_name,
          zalo_user_id: zalo_user_id,
          zalo_consent_date: new Date().toISOString(),
          zalo_consent_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      profileUpdateError = insertError;
    }

    if (profileUpdateError) {
      console.error(
        "❌ Failed to save Zalo consent:",
        profileUpdateError.message
      );
    } else {
      console.log("✅ Zalo consent saved successfully");
    }

    // Send ZNS
    console.log(`📱 Sending ZNS notification...`);

    const result = await sendZaloZNS({
      order_number: order_number,
      customer_name: customer_name,
      customer_phone: customer_phone,
      zalo_user_id: zalo_user_id,
      order_date: order_date || formatDateForZNS(new Date()),
      order_status: order_status || "Đang xử lý",
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
