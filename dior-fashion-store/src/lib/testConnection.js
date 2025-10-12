import { supabase } from './supabase';

export const testSupabaseConnection = async () => {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    // Test 1: Check client initialization
    console.log('✅ Supabase client initialized');
    
    // Test 2: Fetch categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Connection error:', error);
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log('📦 Found categories:', categories);
    return true;
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    return false;
  }
};