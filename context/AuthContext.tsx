import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { userService } from '../services/userService';
import { UserProfile } from '../types';

interface AuthContextType {
  session: any;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentSession: any) => {
    if (currentSession?.user) {
      try {
        const p = await userService.getCurrentProfile();
        setProfile(p);
      } catch (e) {
        console.error("Error fetching profile in context", e);
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    // Don't set full loading to true to avoid flashing white screen, just fetch
    await fetchProfile(session);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  useEffect(() => {
    // Initial Load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchProfile(session).then(() => setLoading(false));
    });

    // Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        setLoading(false);
      } else {
        // If we just logged in, fetch profile
        fetchProfile(session).then(() => setLoading(false));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);