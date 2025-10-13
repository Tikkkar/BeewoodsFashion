import { supabase } from '../supabase';

// =============================================
// SIGN UP
// =============================================
export const signUp = async (email, password, fullName) => {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (authError) throw authError;

    // 2. Create user profile (using service role bypass RLS)
   if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: email,
          full_name: fullName,
          role: 'customer'
        }])
        .select();

      // Ignore conflict errors (trigger already created it)
      if (profileError && !profileError.message.includes('duplicate')) {
        console.error('Profile creation error:', profileError);
      }
    }

    return { data: authData, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { data: null, error: error.message };
  }
};

// =============================================
// SIGN IN
// =============================================
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    
    let errorMessage = 'Đăng nhập thất bại';
    
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Email hoặc mật khẩu không đúng';
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = 'Vui lòng xác nhận email trước khi đăng nhập';
    }
    
    return { data: null, error: errorMessage };
  }
};

// =============================================
// SIGN OUT
// =============================================
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: error.message };
  }
};

// =============================================
// GET CURRENT USER - SIMPLIFIED
// =============================================
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    if (!user) return { data: null, error: null };

    // ⚡ TRY TO GET PROFILE, BUT DON'T FAIL IF NOT EXISTS
    let profile = null;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // ⚡ USE maybeSingle() INSTEAD OF single()

      if (!profileError) {
        profile = profileData;
      }
    } catch (err) {
      console.log('Could not fetch profile:', err);
    }

    // ⚡ IF NO PROFILE, USE DEFAULT
    if (!profile) {
      profile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'User',
        role: 'customer'
      };
    }

    return { 
      data: { 
        ...user, 
        profile 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return { data: null, error: null }; // ⚡ RETURN NULL, NOT ERROR
  }
};

// =============================================
// RESET PASSWORD
// =============================================
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Reset password error:', error);
    return { data: null, error: error.message };
  }
};

// =============================================
// UPDATE PASSWORD
// =============================================
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Update password error:', error);
    return { data: null, error: error.message };
  }
};

// =============================================
// UPDATE PROFILE
// =============================================
export const updateProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    return { data: null, error: error.message };
  }
};