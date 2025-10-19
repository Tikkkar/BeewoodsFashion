// ============================================
// services/addressExtractionService.ts - COMPLETE FIX
// ============================================

import { createSupabaseClient } from '../utils/supabaseClient.ts';
import { saveAddressStandardized } from './addressService.ts';

/**
 * Normalize Vietnamese address (capitalize words)
 */
function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract address from message and save (STANDARDIZED)
 */
export async function extractAndSaveAddress(
  conversationId: string,
  messageText: string
): Promise<boolean> {
  const supabase = createSupabaseClient();
  
  console.log('🔍 Extracting address from:', messageText);
  
  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id, full_name, phone')
    .eq('conversation_id', conversationId)
    .single();
  
  if (!profile) {
    console.log('⚠️ No profile found');
    return false;
  }
  
  const extracted = extractAddressComponents(messageText, profile);
  
  if (!extracted.address_line || !extracted.city) {
    console.log('⚠️ No valid address found');
    return false;
  }
  
  const result = await saveAddressStandardized(conversationId, {
    full_name: extracted.full_name,
    phone: extracted.phone,
    address_line: extracted.address_line,
    ward: extracted.ward,
    district: extracted.district,
    city: extracted.city
  });
  
  if (result.success) {
    console.log('✅ Address saved (standardized):', result.address_id);
    return true;
  } else {
    console.error('❌ Failed to save address:', result.message);
    return false;
  }
}

/**
 * Get saved address (STANDARDIZED)
 */
export async function getSavedAddress(conversationId: string): Promise<any> {
  const supabase = createSupabaseClient();
  
  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id, user_id, phone, full_name')
    .eq('conversation_id', conversationId)
    .single();
  
  if (!profile) return null;
  
  // Try addresses table first
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
  
  // Fallback: memory_facts
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
      phone: addressFact.metadata.phone || profile.phone,
      full_name: addressFact.metadata.full_name || profile.full_name
    };
  }
  
  return null;
}

/**
 * Extract address components - IMPROVED ALGORITHM
 */
function extractAddressComponents(text: string, profile: any) {
  const result: any = {
    full_name: null,
    phone: null,
    address_line: null,
    ward: null,
    district: null,
    city: null
  };
  
  console.log('🔍 Input text:', text);
  
  let workingText = text;
  
  // ========================================
  // 1. EXTRACT & REMOVE PHONE
  // ========================================
  const phoneMatch = workingText.match(/(?:sdt|số điện thoại|phone|đt)?[:\s]*([0+][\d]{9,10})/i);
  if (phoneMatch) {
    result.phone = phoneMatch[1];
    workingText = workingText.replace(phoneMatch[0], '').trim();
    console.log('📞 Phone:', result.phone);
  }
  
  // ========================================
  // 2. EXTRACT & REMOVE CITY
  // ========================================
  const cities = [
    'Hà Nội', 'TP.HCM', 'TP HCM', 'Hồ Chí Minh', 'Đà Nẵng', 
    'Hải Phòng', 'Cần Thơ', 'Biên Hòa', 'Nha Trang', 'Huế', 'Vũng Tàu'
  ];
  
  for (const city of cities) {
    const regex = new RegExp(city, 'i');
    if (regex.test(workingText)) {
      result.city = city;
      workingText = workingText.replace(regex, '').trim();
      console.log('🏙️ City:', city);
      break;
    }
  }
  
  // ========================================
  // 3. EXTRACT & REMOVE DISTRICT
  // ========================================
  const hanoiDistricts = [
    'Ba Đình', 'Hoàn Kiếm', 'Đống Đa', 'Hai Bà Trưng', 
    'Cầu Giấy', 'Thanh Xuân', 'Tây Hồ', 'Long Biên',
    'Hoàng Mai', 'Hà Đông', 'Nam Từ Liêm', 'Bắc Từ Liêm'
  ];
  
  const hcmDistricts = [
    'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5',
    'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10',
    'Quận 11', 'Quận 12', 'Bình Thạnh', 'Tân Bình', 'Tân Phú'
  ];
  
  const allDistricts = [...hanoiDistricts, ...hcmDistricts];
  
  for (const dist of allDistricts) {
    const regex = new RegExp(`\\b${dist}\\b`, 'i');
    if (regex.test(workingText)) {
      result.district = dist;
      workingText = workingText.replace(regex, '').trim();
      console.log('🏘️ District:', dist);
      break;
    }
  }
  
  // ========================================
  // 4. EXTRACT ADDRESS LINE
  // ========================================
  workingText = workingText.replace(/[,\s]+/g, ' ').trim();
  
  const addressPattern = /^(\d+[A-Z]?\s+[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ\s]+)/i;
  
  const addressMatch = workingText.match(addressPattern);
  if (addressMatch) {
    result.address_line = normalizeVietnamese(addressMatch[1].trim());
  } else if (workingText.length > 5 && /^\d+/.test(workingText)) {
    result.address_line = normalizeVietnamese(workingText);
  }
  
  console.log('✅ Final:', JSON.stringify(result, null, 2));
  
  return result;
}