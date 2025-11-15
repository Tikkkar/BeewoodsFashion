// hooks/useAuth.js - OPTIMIZED VERSION
import { useState, useEffect, createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);
  const loadingProfile = useRef(false);

  // ⚡ OPTIMIZATION: Memoize loadUserProfile to prevent recreations
  const loadUserProfile = useCallback(async (authUser) => {
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
      
      // Fallback user object
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
  }, []); // Empty deps - function is stable

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          await loadUserProfile(session.user);
        }
        
        initialized.current = true;
      } catch (error) {
        console.error('Init auth error:', error);
        initialized.current = true;
      }
    };

    initAuth();

    // ⚡ Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Skip initial session (already handled in initAuth)
        if (event === 'INITIAL_SESSION') {
          return;
        }

        // Handle sign in
        if (event === 'SIGNED_IN') {
          if (!initialized.current) {
            return;
          }
          
          if (session?.user && !loadingProfile.current) {
            await loadUserProfile(session.user);
          }
        } 
        // Handle sign out
        else if (event === 'SIGNED_OUT') {
          setUser(null);
          loadingProfile.current = false;
        }
        // Token refresh is silent, no action needed
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]); // Include loadUserProfile in deps

  // ⚡ OPTIMIZATION: Memoize logout function
  const logout = useCallback(async () => {
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
  }, []);

  // ⚡ OPTIMIZATION: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    logout,
    isAdmin: user?.profile?.role === 'admin',
    isAuthenticated: !!user
  }), [user, loading, logout]);

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