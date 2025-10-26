// services/addressService.ts

import { createSupabaseClient } from "../utils/supabaseClient.ts";

/**
 * Get saved address - Works for both logged users and guests
 * Priority: customer_profiles (structured fields) → addresses table
 */
// services/addressService.ts

export async function getStandardizedAddress(
  conversationId: string,
  retries: number = 2,
): Promise<any> {
  const supabase = createSupabaseClient();

  console.log("🔍 Getting address for conversation:", conversationId);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // ========================================
      // 1. Get profile first
      // ========================================
      const { data: profile, error: profileError } = await supabase
        .from("customer_profiles")
        .select(`
          id, 
          user_id, 
          phone, 
          full_name,
          preferred_name,
          shipping_address_line,
          shipping_ward,
          shipping_district,
          shipping_city
        `)
        .eq("conversation_id", conversationId)
        .maybeSingle();

      if (profileError) {
        console.error("❌ Error fetching profile:", profileError);

        // ✅ Retry if first attempt
        if (attempt < retries) {
          console.log(`⏳ Retry ${attempt}/${retries} in 100ms...`);
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }
        return null;
      }

      if (!profile) {
        console.log("⚠️ No profile found");
        return null;
      }

      console.log("📋 Profile found:", {
        id: profile.id,
        has_shipping_address: !!profile.shipping_address_line,
        has_city: !!profile.shipping_city,
        attempt: attempt,
      });

      // ========================================
      // 2. Try customer_profiles structured fields FIRST
      // ========================================
      if (profile.shipping_address_line && profile.shipping_city) {
        console.log("✅ Loaded address from customer_profiles (structured)");

        const address = {
          address_line: profile.shipping_address_line,
          ward: profile.shipping_ward || null,
          district: profile.shipping_district || null,
          city: profile.shipping_city,
          phone: profile.phone || null,
          full_name: profile.preferred_name || profile.full_name || null,
        };

        console.log("📍 Address data:", address);
        return address;
      }

      // ========================================
      // 3. Fallback: addresses table (for logged users)
      // ========================================
      if (profile.user_id) {
        console.log(
          "🔍 Checking addresses table for user_id:",
          profile.user_id,
        );

        const { data: address, error: addressError } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", profile.user_id)
          .eq("is_default", true)
          .maybeSingle();

        if (addressError) {
          console.error("❌ Error fetching address:", addressError);
        }

        if (address) {
          console.log("✅ Loaded address from addresses table (fallback)");

          // Sync to customer_profiles for faster access next time
          await supabase
            .from("customer_profiles")
            .update({
              shipping_address_line: address.address_line,
              shipping_ward: address.ward,
              shipping_district: address.district,
              shipping_city: address.city,
            })
            .eq("id", profile.id);

          return {
            address_line: address.address_line,
            ward: address.ward || null,
            district: address.district || null,
            city: address.city,
            phone: address.phone || profile.phone,
            full_name: address.full_name || profile.preferred_name ||
              profile.full_name,
          };
        }
      }

      // ✅ No address found, retry if first attempt
      if (attempt < retries) {
        console.log(
          `⏳ No address found, retry ${attempt}/${retries} in 100ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      console.log("⚠️ No saved address found after all retries");
      return null;
    } catch (error: any) {
      console.error(
        `❌ Error in getStandardizedAddress (attempt ${attempt}):`,
        error,
      );

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }
      return null;
    }
  }

  return null;
}

/**
 * Save address - Works for both logged users AND guest/Facebook users
 */
export async function saveAddressStandardized(
  conversationId: string,
  addressData: {
    full_name?: string;
    phone?: string;
    address_line: string;
    ward?: string;
    district?: string;
    city: string;
  },
): Promise<{ success: boolean; message: string; address_id?: string }> {
  // ========================================
  // VALIDATION
  // ========================================

  if (!addressData.address_line || addressData.address_line.length < 5) {
    return {
      success: false,
      message: "Địa chỉ quá ngắn, vui lòng cung cấp đầy đủ số nhà và tên đường",
    };
  }

  if (/^[\d\s]+$/.test(addressData.address_line)) {
    return {
      success: false,
      message: "Địa chỉ không hợp lệ",
    };
  }

  if (!/^\d+/.test(addressData.address_line.trim())) {
    const productKeywords = ["cao cấp", "lớp", "set", "vest", "quần", "áo"];
    if (
      productKeywords.some((k) =>
        addressData.address_line.toLowerCase().includes(k)
      )
    ) {
      return {
        success: false,
        message: "Địa chỉ không hợp lệ - vui lòng cung cấp số nhà và tên đường",
      };
    }
  }

  if (addressData.phone && !/^[0+][\d]{9,11}$/.test(addressData.phone)) {
    return {
      success: false,
      message: "Số điện thoại không hợp lệ",
    };
  }

  if (!addressData.city) {
    return {
      success: false,
      message: "Thiếu thông tin thành phố",
    };
  }

  console.log("✅ Address validation passed:", addressData);

  const supabase = createSupabaseClient();

  try {
    // ========================================
    // 1. GET PROFILE
    // ========================================
    const { data: profile, error: profileError } = await supabase
      .from("customer_profiles")
      .select("id, user_id, conversation_id, full_name, phone")
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("❌ Profile error:", profileError);
      return {
        success: false,
        message: "Không tìm thấy profile khách hàng",
      };
    }

    let addressId: string | undefined;

    // ========================================
    // 2. LOGGED USER → Save to addresses table
    // ========================================
    if (profile.user_id) {
      console.log("✅ Logged user, saving to addresses table");

      const { data: existingAddress } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("is_default", true)
        .maybeSingle();

      const addressPayload = {
        user_id: profile.user_id,
        full_name: addressData.full_name || profile.full_name || "Khách hàng",
        phone: addressData.phone || profile.phone || "",
        address_line: addressData.address_line,
        city: addressData.city,
        district: addressData.district || "",
        ward: addressData.ward || "",
        is_default: true,
      };

      if (existingAddress) {
        const { data, error } = await supabase
          .from("addresses")
          .update(addressPayload)
          .eq("id", existingAddress.id)
          .select()
          .single();

        if (!error && data) {
          addressId = data.id;
          console.log("✅ Updated address in addresses table:", addressId);
        }
      } else {
        const { data, error } = await supabase
          .from("addresses")
          .insert(addressPayload)
          .select()
          .single();

        if (!error && data) {
          addressId = data.id;
          console.log("✅ Created address in addresses table:", addressId);
        }
      }
    }

    // ========================================
    // 3. ALWAYS save to customer_profiles (for both guest and logged users)
    // ========================================
    console.log("💾 Saving to customer_profiles structured fields");

    const { error: updateError } = await supabase
      .from("customer_profiles")
      .update({
        shipping_address_line: addressData.address_line,
        shipping_ward: addressData.ward || null,
        shipping_district: addressData.district || null,
        shipping_city: addressData.city,
        // ✅ Also update phone if provided
        ...(addressData.phone && { phone: addressData.phone }),
        // ✅ Also update name if provided
        ...(addressData.full_name && { full_name: addressData.full_name }),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("❌ Error updating customer_profiles:", updateError);
      return {
        success: false,
        message: "Lỗi khi lưu địa chỉ",
      };
    }

    console.log("✅ Saved address to customer_profiles (structured fields)");

    // ========================================
    // 4. VERIFY SAVE ✅ THÊM BƯỚC NÀY
    // ========================================
    const { data: verifyProfile } = await supabase
      .from("customer_profiles")
      .select("shipping_address_line, shipping_city, phone")
      .eq("id", profile.id)
      .single();

    console.log("🔍 Verify saved data:", {
      shipping_address_line: verifyProfile?.shipping_address_line,
      shipping_city: verifyProfile?.shipping_city,
      phone: verifyProfile?.phone,
    });

    return {
      success: true,
      message: "Đã lưu địa chỉ thành công",
      address_id: addressId,
    };
  } catch (error: any) {
    console.error("❌ Error saving address:", error);
    return {
      success: false,
      message: error.message || "Lỗi khi lưu địa chỉ",
    };
  }
}
