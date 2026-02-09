import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase, User } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  devLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fixed UUID matching the real Supabase user
const DEV_USER: User = {
  id: '895cd28a-37ea-443c-b7bb-eca88c857d05',
  email: 'mausampatel111@gmail.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Session error:', error);
          setUser(null);
        } else if (session?.user) {
          console.log('[Auth] Found Supabase session');
          setUser(session.user);
        } else {
          // No session - show login screen
          console.log('[Auth] No session, showing login');
          setUser(null);
        }
      } catch (err) {
        console.error('[Auth] Unexpected error:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] State change:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const devLogin = useCallback(() => {
    console.log('[Auth] Dev login');
    setUser(DEV_USER);
  }, []);

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    console.log('[Auth] Signing out...');
    setUser(null);
    await supabase.auth.signOut();
  };

  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithOtp,
    signOut,
    refreshSession,
    devLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
