import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ data: any; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOtpEmail: (email: string) => Promise<{ error: Error | null }>;
  signInWithOtpPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtpPhone: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle token refresh events
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          // Session refreshed or user signed in
          setSession(session);
          setUser(session?.user ?? null);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session and refresh if needed
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (session) {
        // Check if token is expired or about to expire
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        
        if (expiresAt && expiresAt - now < 60) {
          // Token expires soon, refresh it
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session) {
            setSession(refreshData.session);
            setUser(refreshData.session.user);
          } else {
            setSession(session);
            setUser(session.user);
          }
        } else {
          setSession(session);
          setUser(session.user);
        }
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          full_name: fullName,
          phone: phone,
        },
        // Disable email confirmation to avoid rate limiting issues
        captchaToken: undefined,
      }
    });
    
    // If error is about rate limiting, return a more user-friendly error
    if (error && (error.message.includes("48 seconds") || error.message.includes("rate limit") || error.message.includes("security purposes"))) {
      return { 
        data, 
        error: new Error("Please wait a moment before trying again") as any 
      };
    }
    
    // If signup successful but no session (email confirmation required), try to sign in automatically
    if (data && !data.session && !error) {
      // Wait a moment for user to be created, then try to sign in
      await new Promise(resolve => setTimeout(resolve, 500));
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        // If sign in fails, user might need to confirm email
        // Return the original signup data but with a note about email confirmation
        return { 
          data: { ...data, needsEmailConfirmation: true }, 
          error: null 
        };
      }
      
      // Sign in successful - return the session data
      return { data: signInData, error: null };
    }
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signInWithOtpEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    return { error };
  };

  const signInWithOtpPhone = async (phone: string) => {
    const normalized = phone.replace(/\D/g, "");
    const withCountry = normalized.length === 10 ? `+91${normalized}` : normalized.startsWith("+") ? phone : `+91${normalized}`;
    const { error } = await supabase.auth.signInWithOtp({
      phone: withCountry,
      options: { shouldCreateUser: true },
    });
    return { error };
  };

  const verifyOtpPhone = async (phone: string, token: string) => {
    const normalized = phone.replace(/\D/g, "");
    const withCountry = normalized.length === 10 ? `+91${normalized}` : normalized.startsWith("+") ? phone : `+91${normalized}`;
    const { error } = await supabase.auth.verifyOtp({
      phone: withCountry,
      token: token.trim(),
      type: "sms",
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithOtpEmail, signInWithOtpPhone, verifyOtpPhone, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
