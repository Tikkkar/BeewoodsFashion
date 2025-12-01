// hooks/useAuth.js - FINAL VERSION WITH ALL FIXES
import { useState, useEffect, createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading immediately
  const initialized = useRef(false);
  const loadingProfile = useRef(false);

  const loadUserProfile = useCallback(async (authUser) => {
    if (loadingProfile.current) {
      console.log('⚠️ Already loading profile, skipping...');
      return;
    }

    loadingProfile.current = true;
    // Don't set loading(true) here because we might be in the middle of a session refresh
    // and we don't want to flash a loading screen if we already have a user.

    console.log('🔍 Loading profile for:', authUser.email, 'ID:', authUser.id);

    try {
      // ===== DEBUG: Check session trước khi fetch =====
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📝 Session exists:', !!session);
      console.log('📝 Access token:', session?.access_token?.substring(0, 20) + '...');

      // ===== Fetch role via RPC first (bypass recursion) =====
      let role = 'customer';
      try {
        const { data: rpcRole } = await supabase.rpc('get_current_user_role');
        if (rpcRole) role = rpcRole;
      } catch (rpcError) {
        console.warn('RPC role fetch failed:', rpcError);
      }

      // ===== Try profile with specific fields =====
      let profile;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, role, employee_code, department, is_active')
          .eq('id', authUser.id)
          .maybeSingle();

        profile = data;
        if (error) console.warn('Profile fetch failed, using RPC + metadata:', error);
      } catch (fetchError) {
        console.warn('Profile fetch error:', fetchError);
      }

      // ===== Fallback profile =====
      const finalProfile = profile || {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: role
      };

      console.log('✅ Final profile with RPC role:', finalProfile);

      console.log('✅ Final profile:', finalProfile);
      console.log('✅ Role:', finalProfile.role);

      setUser({
        ...authUser,
        profile: finalProfile
      });

    } catch (error) {
      console.error('💥 Load profile exception:', error);

      // Fallback với metadata từ auth
      const role = authUser.user_metadata?.role
        || authUser.raw_user_meta_data?.role
        || 'customer';

      console.log('🔄 Using fallback profile with role:', role);

      setUser({
        ...authUser,
        profile: {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          role: role
        }
      });
    } finally {
      loadingProfile.current = false;
      console.log('✅ Profile loading complete');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log('🚀 Initializing auth...');
      setLoading(true); // Ensure loading is true at start

      try {
        const { data: { session } } = await supabase.auth.getSession();

        console.log('Session found:', !!session);
        console.log('Session user:', session?.user?.email);
        console.log('User metadata:', session?.user?.user_metadata);
        console.log('Raw metadata:', session?.user?.raw_user_meta_data);

        if (mounted && session?.user) {
          await loadUserProfile(session.user);
        } else {
          console.log('ℹ️ No session, user not logged in');
        }

        initialized.current = true;
      } catch (error) {
        console.error('❌ Init auth error:', error);
        initialized.current = true;
      } finally {
        if (mounted) {
          setLoading(false); // Only set loading to false when EVERYTHING is done
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔔 Auth state change:', event);

        if (event === 'INITIAL_SESSION') {
          return;
        }

        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in:', session?.user?.email);

          if (!initialized.current) {
            return;
          }

          if (session?.user && !loadingProfile.current) {
            // If we are already initialized, we might want to show loading state 
            // while we fetch the new profile, but it depends on UX preference.
            // For now, let's keep it simple and just fetch.
            await loadUserProfile(session.user);
          }
        }
        else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          loadingProfile.current = false;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // ===== FIX: Logout với error handling =====
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Logging out...');

      // Clear state immediately
      setUser(null);
      loadingProfile.current = false;

      // Try to sign out from Supabase
      try {
        const { error } = await supabase.auth.signOut({ scope: 'local' });

        if (error) {
          // Ignore "Auth session missing" error - user is already logged out
          if (error.message?.includes('Auth session missing') ||
            error.message?.includes('session_not_found')) {
            console.log('ℹ️ Session already cleared');
          } else {
            console.warn('Logout warning:', error.message);
          }
        }
      } catch (signOutError) {
        // Ignore session errors during logout
        if (signOutError.message?.includes('Auth session missing') ||
          signOutError.message?.includes('session_not_found')) {
          console.log('ℹ️ Session already cleared');
        } else {
          console.warn('SignOut warning:', signOutError.message);
        }
      }

      // Force clear local storage as backup
      try {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('Storage clear warning:', storageError);
      }

      console.log('✅ Logged out successfully');

    } catch (error) {
      console.error('❌ Logout error:', error);

      // Even if logout fails, clear local state
      setUser(null);
      loadingProfile.current = false;

      try {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      } catch (e) {
        // Ignore storage errors
      }

      console.log('⚠️ Forced logout completed');

      // Don't throw error - logout should always succeed from user perspective
    }
  }, []);

  const value = useMemo(() => {
    // ===== CRITICAL: Lấy role từ nhiều nguồn =====
    const role = user?.profile?.role
      || user?.user_metadata?.role
      || user?.raw_user_meta_data?.role
      || 'customer';

    const isAdmin = role === 'admin';
    const isSale = role === 'sale';
    const isWarehouse = role === 'warehouse';
    const isEmployee = ['admin', 'sale', 'warehouse'].includes(role);

    console.log('🎯 Auth context updated:', {
      userEmail: user?.email,
      role,
      isAdmin,
      isAuthenticated: !!user,
      loading
    });

    return {
      user,
      loading,
      logout,
      // Role checks
      isAdmin,
      isSale,
      isWarehouse,
      isEmployee,
      isCustomer: role === 'customer',
      // Access checks
      canAccessAdmin: ['admin', 'sale', 'warehouse'].includes(role),
      canCreateOrder: ['admin', 'sale'].includes(role),
      canManageEmployees: role === 'admin',
      // User info
      userRole: role,
      userId: user?.id,
      isAuthenticated: !!user
    };
  }, [user, loading, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
