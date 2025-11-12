// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

let supabaseUrl;
let supabaseAnonKey;

// An toàn khi truy cập import.meta.env (một số môi trường test không có import.meta.env)
try {
  supabaseUrl =
    process.env.REACT_APP_SUPABASE_URL ||
    // optional chaining an toàn nếu import.meta tồn tại
    (typeof import.meta !== 'undefined' ? import.meta?.env?.VITE_SUPABASE_URL : undefined) ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  supabaseAnonKey =
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    (typeof import.meta !== 'undefined' ? import.meta?.env?.VITE_SUPABASE_ANON_KEY : undefined) ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
} catch (err) {
  // Nếu bất kỳ việc đọc import.meta.* gây lỗi (hiếm), fallback sang process.env
  supabaseUrl =
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  supabaseAnonKey =
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
}

// Kiểm tra xem có thiếu config không
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Available env vars:', {
    url: supabaseUrl ? '✓ Set' : '✗ Missing',
    key: supabaseAnonKey ? '✓ Set' : '✗ Missing',
    // show any SUPABASE related keys in process.env for debugging tests/dev
    allEnvKeys: Object.keys(process.env).filter(k => k.toUpperCase().includes('SUPABASE') || k.toUpperCase().includes('VITE_') || k.toUpperCase().includes('REACT_APP')),
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

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

export default supabase;
