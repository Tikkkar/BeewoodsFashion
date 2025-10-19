// ============================================
// services/addressService.ts - FIXED VALIDATION ORDER
// ============================================

import { createSupabaseClient } from '../utils/supabaseClient.ts';

/**
 * Save address to BOTH addresses table AND memory_facts
 * Đảm bảo data consistency
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
  }
): Promise<{ success: boolean; message: string; address_id?: string }> {
  // ========================================
  // ⭐ VALIDATION - KIỂM TRA TRƯỚC (ĐẶT Ở ĐẦU)
  // ========================================
  
  // 1. Reject if address_line is too short
  if (!addressData.address_line || addressData.address_line.length < 5) {
    console.error('❌ Address line too short:', addressData.address_line);
    return {
      success: false,
      message: 'Địa chỉ quá ngắn, vui lòng cung cấp đầy đủ số nhà và tên đường'
    };
  }
  
  // 2. Reject if address_line is only numbers
  if (/^[\d\s]+$/.test(addressData.address_line)) {
    console.error('❌ Address line is only numbers:', addressData.address_line);
    return {
      success: false,
      message: 'Địa chỉ không hợp lệ'
    };
  }
  
  // 3. Reject if address_line doesn't start with number (street number)
  if (!/^\d+/.test(addressData.address_line.trim())) {
    console.error('❌ Address line missing street number:', addressData.address_line);
    
    // Check if it looks like product description
    if (addressData.address_line.includes('cao cấp') || 
        addressData.address_line.includes('lớp') ||
        addressData.address_line.includes('set') ||
        addressData.address_line.includes('vest') ||
        addressData.address_line.includes('quần')) {
      console.error('❌ Address line looks like product description!');
      return {
        success: false,
        message: 'Địa chỉ không hợp lệ - vui lòng cung cấp số nhà và tên đường'
      };
    }
  }
  
  // 4. Check phone format (if provided)
  if (addressData.phone && !/^[0+][\d]{9,11}$/.test(addressData.phone)) {
    console.error('❌ Invalid phone format:', addressData.phone);
    return {
      success: false,
      message: 'Số điện thoại không hợp lệ'
    };
  }
  
  // 5. Check city is required
  if (!addressData.city) {
    console.error('❌ Missing city:', addressData);
    return {
      success: false,
      message: 'Thiếu thông tin thành phố'
    };
  }
  
  console.log('✅ Address validation passed:', addressData);
  
  // ========================================
  // SAU KHI VALIDATION PASS → BẮT ĐẦU LƯU
  // ========================================
  const supabase = createSupabaseClient();
  
  try {
    // ========================================
    // 1. GET PROFILE
    // ========================================
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('id, user_id, full_name, phone')
      .eq('conversation_id', conversationId)
      .single();
    
    if (!profile) {
      return {
        success: false,
        message: 'Không tìm thấy profile khách hàng'
      };
    }
    
    // ========================================
    // 2. SAVE TO addresses TABLE (nếu có user_id)
    // ========================================
    let addressId: string | undefined;
    
    if (profile.user_id) {
      // Check if default address already exists
      const { data: existingAddress } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('is_default', true)
        .single();
      
      const addressPayload = {
        user_id: profile.user_id,
        full_name: addressData.full_name || profile.full_name || 'Khách hàng',
        phone: addressData.phone || profile.phone || '',
        address_line: addressData.address_line,
        city: addressData.city,
        district: addressData.district || '',
        ward: addressData.ward || '',
        is_default: true
      };
      
      if (existingAddress) {
        // UPDATE existing default address
        const { data, error } = await supabase
          .from('addresses')
          .update(addressPayload)
          .eq('id', existingAddress.id)
          .select()
          .single();
        
        if (!error && data) {
          addressId = data.id;
          console.log('✅ Updated existing address:', addressId);
        }
      } else {
        // INSERT new address
        const { data, error } = await supabase
          .from('addresses')
          .insert(addressPayload)
          .select()
          .single();
        
        if (!error && data) {
          addressId = data.id;
          console.log('✅ Created new address:', addressId);
        }
      }
    } else {
      console.log('⚠️ No user_id, skipping addresses table');
    }
    
    // ========================================
    // 3. SAVE TO customer_memory_facts (cho AI)
    // ========================================
    const fullAddress = [
      addressData.address_line,
      addressData.ward,
      addressData.district,
      addressData.city
    ].filter(Boolean).join(', ');
    
    // Deactivate old address facts
    await supabase
      .from('customer_memory_facts')
      .update({ is_active: false })
      .eq('customer_profile_id', profile.id)
      .eq('fact_type', 'personal_info')
      .ilike('fact_text', '%Địa chỉ giao hàng:%');
    
    // Insert new address fact
    await supabase
      .from('customer_memory_facts')
      .insert({
        customer_profile_id: profile.id,
        fact_type: 'personal_info',
        fact_text: `Địa chỉ giao hàng: ${fullAddress}`,
        importance_score: 9,
        source_conversation_id: conversationId,
        metadata: {
          address_line: addressData.address_line,
          ward: addressData.ward,
          district: addressData.district,
          city: addressData.city,
          phone: addressData.phone || profile.phone,
          full_name: addressData.full_name || profile.full_name,
          address_id: addressId // Link to addresses table
        }
      });
    
    console.log('✅ Address saved to memory_facts');
    
    // ========================================
    // 4. UPDATE PROFILE (nếu có phone/name mới)
    // ========================================
    const profileUpdates: any = {};
    
    if (addressData.phone && addressData.phone !== profile.phone) {
      profileUpdates.phone = addressData.phone;
    }
    
    if (addressData.full_name && addressData.full_name !== profile.full_name) {
      profileUpdates.full_name = addressData.full_name;
    }
    
    if (Object.keys(profileUpdates).length > 0) {
      await supabase
        .from('customer_profiles')
        .update(profileUpdates)
        .eq('id', profile.id);
      
      console.log('✅ Profile updated:', profileUpdates);
    }
    
    return {
      success: true,
      message: 'Đã lưu địa chỉ thành công',
      address_id: addressId
    };
    
  } catch (error: any) {
    console.error('❌ Error saving address:', error);
    return {
      success: false,
      message: error.message || 'Lỗi khi lưu địa chỉ'
    };
  }
}

/**
 * Get saved address (ưu tiên từ addresses table)
 */
export async function getStandardizedAddress(conversationId: string): Promise<any> {
  const supabase = createSupabaseClient();
  
  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id, user_id, phone, full_name') // ⭐ Thêm phone, full_name
    .eq('conversation_id', conversationId)
    .single();
  
  if (!profile) return null;
  
  // Try to get from addresses table first
  if (profile.user_id) {
    const { data: address } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('is_default', true)
      .single();
    
    if (address) {
      console.log('📍 Loaded address from addresses table');
      return {
        address_line: address.address_line,
        ward: address.ward || null,
        district: address.district || null,
        city: address.city,
        phone: address.phone,
        full_name: address.full_name
      };
    }
  }
  
  // Fallback: Get from memory_facts
  const { data: addressFact } = await supabase
    .from('customer_memory_facts')
    .select('metadata')
    .eq('customer_profile_id', profile.id)
    .eq('fact_type', 'personal_info')
    .eq('is_active', true)
    .ilike('fact_text', '%Địa chỉ giao hàng:%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (addressFact?.metadata) {
    console.log('📍 Loaded address from memory_facts (fallback)');
    return {
      address_line: addressFact.metadata.address_line,
      ward: addressFact.metadata.ward || null,
      district: addressFact.metadata.district || null,
      city: addressFact.metadata.city,
      phone: addressFact.metadata.phone || profile.phone, // ⭐ Fallback
      full_name: addressFact.metadata.full_name || profile.full_name // ⭐ Fallback
    };
  }
  
  return null;
}