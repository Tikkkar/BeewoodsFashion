// ============================================
// utils/supabaseClient.ts - Supabase client factory
// ============================================

// @ts-ignore - This file runs on Deno (Supabase Edge Functions), not Node.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export function createSupabaseClient() {
  // @ts-ignore - Deno.env is available in Deno runtime
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  // @ts-ignore - Deno.env is available in Deno runtime
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }

  return createClient(supabaseUrl, supabaseKey);
}
