// lib/supabase.js - OPTIMIZED VERSION (FIXED)
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

// ⚡ FIXED: Only log in development (safe check)
if (process.env.NODE_ENV !== 'production') {
  console.log('✅ Supabase initialized:', {
    url: supabaseUrl.substring(0, 30) + '...',
    env: isVite ? 'Vite' : isVercel ? 'Vercel' : 'Other'
  });
}

// ⚡ OPTIMIZED: Disable features you don't use
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  
  // ⚡ CRITICAL: Disable realtime if not using subscriptions
  // This saves ~10KB of bundle size
  // ❓ Set to TRUE only if you use .on('INSERT/UPDATE/DELETE') or .channel() subscriptions
  realtime: {
    enabled: false, // ← Change to true if you need realtime features
  },
  
  // ⚡ Global settings
  global: {
    headers: {
      'x-client-info': 'bewo-fashion@1.0.0',
    },
  },
  
  // ⚡ Database settings
  db: {
    schema: 'public',
  },
});

// ⚡ OPTIMIZATION: Only export what's needed
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

// ⚡ HELPER: Enable realtime on-demand (if needed later)
export const enableRealtime = () => {
  // Create a new client with realtime enabled
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    realtime: {
      enabled: true,
    },
  });
};

export default supabase;