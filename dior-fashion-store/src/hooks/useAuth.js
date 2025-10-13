import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false); // ⚡ TRACK ĐÃ INIT CHƯA
  const loadingProfile = useRef(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          console.log('✅ Found existing session:', session.user.email);
          await loadUserProfile(session.user);
        } else {
          console.log('ℹ️ No existing session');
        }
        
        initialized.current = true; // ⚡ ĐÁNH DẤU ĐÃ INIT
      } catch (error) {
        console.error('Init auth error:', error);
        initialized.current = true;
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event);

        if (!mounted) return;

        // ⚡ IGNORE INITIAL_SESSION - ĐÃ XỬ LÝ Ở initAuth
        if (event === 'INITIAL_SESSION') {
          console.log('ℹ️ Ignoring INITIAL_SESSION (already handled)');
          return;
        }

        // ⚡ CHỈ XỬ LÝ SIGNED_IN NẾU ĐÃ INITIALIZED
        if (event === 'SIGNED_IN') {
          if (!initialized.current) {
            console.log('ℹ️ Ignoring SIGNED_IN during initialization');
            return;
          }
          
          if (session?.user && !loadingProfile.current) {
            console.log('👤 New sign in detected');
            await loadUserProfile(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          loadingProfile.current = false;
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed silently');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // ⚡ EMPTY DEPS - CHỈ CHẠY 1 LẦN

  const loadUserProfile = async (authUser) => {
    if (loadingProfile.current) {
      console.log('⏳ Profile already loading, skip...');
      return;
    }

    loadingProfile.current = true;

    try {
      console.log('👤 Loading profile for:', authUser.email);

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error);
      }

      const finalProfile = profile || {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || 'User',
        role: 'customer'
      };

      console.log('✅ Profile loaded:', finalProfile.email, 'Role:', finalProfile.role);

      setUser({
        ...authUser,
        profile: finalProfile
      });

    } catch (error) {
      console.error('❌ Load profile error:', error);
      
      setUser({
        ...authUser,
        profile: {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || 'User',
          role: 'customer'
        }
      });
    } finally {
      loadingProfile.current = false;
    }
  };

  const value = {
    user,
    loading,
    isAdmin: user?.profile?.role === 'admin',
    isAuthenticated: !!user
  };

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