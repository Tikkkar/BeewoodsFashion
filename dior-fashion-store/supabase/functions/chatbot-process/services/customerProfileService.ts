// ============================================
// services/customerProfileService.ts
// ============================================

import { createSupabaseClient } from "../utils/supabaseClient.ts";

/**
 * Save or update customer profile information
 */
export async function saveCustomerProfile(
  conversationId: string,
  data: {
    full_name?: string;
    preferred_name?: string;
    phone?: string;
    height?: number;
    weight?: number;
    usual_size?: string;
    style_preference?: string[];
  },
): Promise<{ success: boolean; message: string }> {
  const supabase = createSupabaseClient();

  try {
    // Get profile
    const { data: profile, error: fetchError } = await supabase
      .from("customer_profiles")
      .select("id, full_name, phone")
      .eq("conversation_id", conversationId)
      .single();

    if (fetchError || !profile) {
      return {
        success: false,
        message: "Không tìm thấy profile khách hàng",
      };
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.full_name) updates.full_name = data.full_name;
    if (data.preferred_name) updates.preferred_name = data.preferred_name;
    if (data.phone) updates.phone = data.phone;
    if (data.height) updates.height = data.height;
    if (data.weight) updates.weight = data.weight;
    if (data.usual_size) updates.usual_size = data.usual_size;
    if (data.style_preference && data.style_preference.length > 0) {
      updates.style_preference = data.style_preference;
    }

    // Update profile
    const { error: updateError } = await supabase
      .from("customer_profiles")
      .update(updates)
      .eq("id", profile.id);

    if (updateError) throw updateError;

    // Save as memory fact
    const factText = buildFactText(data);
    if (factText) {
      await supabase
        .from("customer_memory_facts")
        .insert({
          customer_profile_id: profile.id,
          fact_type: "personal_info",
          fact_text: factText,
          importance_score: 8,
          source_conversation_id: conversationId,
          metadata: data,
        });
    }

    console.log("✅ Customer profile saved:", updates);

    return {
      success: true,
      message: "Đã lưu thông tin khách hàng",
    };
  } catch (error: any) {
    console.error("❌ Error saving customer profile:", error);
    return {
      success: false,
      message: error.message || "Lỗi khi lưu thông tin",
    };
  }
}

/**
 * Build memory fact text from data
 */
function buildFactText(data: any): string {
  const parts: string[] = [];

  if (data.preferred_name || data.full_name) {
    parts.push(`Tên: ${data.preferred_name || data.full_name}`);
  }
  if (data.phone) {
    parts.push(`SĐT: ${data.phone}`);
  }
  if (data.height && data.weight) {
    parts.push(`Vóc dáng: ${data.height}cm, ${data.weight}kg`);
  }
  if (data.usual_size) {
    parts.push(`Size thường mặc: ${data.usual_size}`);
  }
  if (data.style_preference && data.style_preference.length > 0) {
    parts.push(`Phong cách: ${data.style_preference.join(", ")}`);
  }

  return parts.join(" | ");
}
