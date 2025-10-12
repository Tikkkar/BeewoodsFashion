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
        // ⚡ THÊM DÒNG NÀY - Không cần confirm email
        emailRedirectTo: window.location.origin
      }
    });

    if (authError) throw authError;

    // ⚡ CHECK NẾU CẦN CONFIRM EMAIL
    if (authData.user && !authData.user.confirmed_at) {
      return { 
        data: authData, 
        error: null,
        needsConfirmation: true 
      };
    }

    // 2. Create user profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: email,
          full_name: fullName,
          role: 'customer'
        }]);

      // ⚡ IGNORE CONFLICT ERROR (user đã tồn tại)
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

    if (error) {
      console.error('Sign in error details:', error); // ⚡ LOG CHI TIẾT
      throw error;
    }

    // ⚡ CHECK USER PROFILE EXISTS
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // ⚡ TẠO PROFILE NẾU CHƯA CÓ
      if (profileError && profileError.code === 'PGRST116') {
        await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || 'User',
            role: 'customer'
          }]);
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    
    // ⚡ BETTER ERROR MESSAGES
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
// GET CURRENT USER
// =============================================
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    if (!user) return { data: null, error: null };

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // ⚡ TẠO PROFILE NẾU CHƯA CÓ
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'User',
          role: 'customer'
        }])
        .select()
        .single();

      return { 
        data: { 
          ...user, 
          profile: newProfile 
        }, 
        error: null 
      };
    }

    if (profileError) throw profileError;

    return { 
      data: { 
        ...user, 
        profile 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return { data: null, error: error.message };
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