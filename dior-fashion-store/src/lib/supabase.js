import { createClient } from "@supabase/supabase-js";

// Lấy thông tin từ environment variables
// Vercel tự động inject các biến trong quá trình build
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Kiểm tra xem có thiếu config không
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Available env vars:', {
    url: supabaseUrl ? '✓ Set' : '✗ Missing',
    key: supabaseAnonKey ? '✓ Set' : '✗ Missing',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  });
  
  throw new Error(
    "❌ Missing Supabase credentials! Please check your environment variables."
  );
}

// Tạo Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export default supabase;