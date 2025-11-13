// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

let supabaseUrl;
let supabaseAnonKey;

// Detect environment
const isVite = typeof import.meta !== 'undefined' && import.meta.env;
const isVercel = process.env.VERCEL === '1';

try {
  if (isVite) {
    // Vite environment (local dev with Vite)
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  } else if (isVercel) {
    // Vercel environment - prioritize VITE_ prefix
    supabaseUrl = 
      process.env.VITE_SUPABASE_URL || 
      process.env.REACT_APP_SUPABASE_URL ||
      process.env.SUPABASE_URL;
    
    supabaseAnonKey = 
      process.env.VITE_SUPABASE_ANON_KEY || 
      process.env.REACT_APP_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;
  } else {
    // CRA or other environments
    supabaseUrl = 
      process.env.REACT_APP_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL;
    
    supabaseAnonKey = 
      process.env.REACT_APP_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;
  }
} catch (err) {
  console.error('Error loading Supabase config:', err);
  
  // Fallback
  supabaseUrl = 
    process.env.VITE_SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  
  supabaseAnonKey = 
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
} 

// Validate
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase Config Error:', {
    url: supabaseUrl ? '✓ Set' : '✗ Missing',
    key: supabaseAnonKey ? '✓ Set' : '✗ Missing',
    isVite,
    isVercel,
    availableEnvKeys: Object.keys(process.env || {})
      .filter(k => /SUPABASE|VITE|REACT_APP/.test(k))
  });

  throw new Error(
    "❌ Missing Supabase credentials! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables."
  );
}

console.log('✅ Supabase initialized:', {
  url: supabaseUrl.substring(0, 30) + '...',
  env: isVite ? 'Vite' : isVercel ? 'Vercel' : 'Other'
});

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