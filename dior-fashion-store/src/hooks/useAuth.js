import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // ⚡ GET INITIAL SESSION
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        setSession(currentSession);

        if (currentSession?.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();

          // ⚡ CREATE PROFILE IF NOT EXISTS
          if (!profile) {
            const { data: newProfile } = await supabase
              .from('users')
              .insert([{
                id: currentSession.user.id,
                email: currentSession.user.email,
                full_name: currentSession.user.user_metadata?.full_name || 'User',
                role: 'customer'
              }])
              .select()
              .single();

            setUser({
              ...currentSession.user,
              profile: newProfile
            });
          } else {
            setUser({
              ...currentSession.user,
              profile
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // ⚡ LISTEN FOR AUTH CHANGES
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth event:', event); // Debug

        setSession(newSession);

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Get or create user profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', newSession.user.id)
            .single();

          if (!profile) {
            const { data: newProfile } = await supabase
              .from('users')
              .insert([{
                id: newSession.user.id,
                email: newSession.user.email,
                full_name: newSession.user.user_metadata?.full_name || 'User',
                role: 'customer'
              }])
              .select()
              .single();

            setUser({
              ...newSession.user,
              profile: newProfile
            });
          } else {
            setUser({
              ...newSession.user,
              profile
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED') {
          // ⚡ KHÔNG LÀM GÌ KHI REFRESH TOKEN
          console.log('Token refreshed');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // ⚡ EMPTY DEPENDENCY ARRAY

  const value = {
    user,
    session,
    loading,
    isAdmin: user?.profile?.role === 'admin',
    isAuthenticated: !!user && !!session
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