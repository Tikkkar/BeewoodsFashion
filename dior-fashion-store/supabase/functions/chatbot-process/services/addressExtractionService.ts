// ============================================
// services/addressExtractionService.ts - SIMPLIFIED (LLM ONLY)
// ============================================

import { createSupabaseClient } from "../utils/supabaseClient.ts";
import { getStandardizedAddress } from "./addressService.ts";
import { saveAddressStandardized } from "./addressService.ts";

/**
 * Get saved address (STANDARDIZED)
 * Ưu tiên: addresses table → memory_facts (fallback)
 */
export async function getSavedAddress(conversationId: string): Promise<any> {
  console.warn(
    "⚠️ getSavedAddress() is deprecated. Use getStandardizedAddress() from addressService.ts",
  );
  // ✅ Delegate to the correct function
  return await getStandardizedAddress(conversationId);
}

/**
 * ⚠️ DEPRECATED - Không dùng function này nữa
 * Địa chỉ giờ được xử lý bởi LLM qua function calling
 * Giữ lại function này chỉ để backward compatibility
 */
export async function extractAndSaveAddress(
  conversationId: string,
  messageText: string,
): Promise<boolean> {
  console.log(
    "⚠️ extractAndSaveAddress is deprecated. Use LLM function calling instead.",
  );
  return false;
}
