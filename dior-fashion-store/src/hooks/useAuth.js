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
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          await loadUserProfile(session.user);
        } else {
        }
        
        initialized.current = true; 
      } catch (error) {
        console.error('Init auth error:', error);
        initialized.current = true;
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        if (!mounted) return;

        // ⚡ IGNORE INITIAL_SESSION - ĐÃ XỬ LÝ Ở initAuth
        if (event === 'INITIAL_SESSION') {
          return;
        }

        // ⚡ CHỈ XỬ LÝ SIGNED_IN NẾU ĐÃ INITIALIZED
        if (event === 'SIGNED_IN') {
          if (!initialized.current) {
            return;
          }
          
          if (session?.user && !loadingProfile.current) {
            await loadUserProfile(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          loadingProfile.current = false;
        } else if (event === 'TOKEN_REFRESHED') {
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
      return;
    }

    loadingProfile.current = true;

    try {

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

 
   // ✅ THÊM HÀM LOGOUT
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      setUser(null);
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  };
 const value = {
    user,
    loading,
    logout,
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