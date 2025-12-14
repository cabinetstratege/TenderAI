
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { userService } from '../services/userService';
import { UserProfile } from '../types';

interface AuthContextType {
  session: any;
  profile: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  isSuperAdmin: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const checkRole = (currentSession: any) => {
      if (currentSession?.user?.app_metadata) {
          const role = currentSession.user.app_metadata.role;
          // Check for various role names to be robust
          const superRoles = ['superuser', 'super_user', 'super_admin'];
          setIsSuperAdmin(superRoles.includes(role));
      } else {
          setIsSuperAdmin(false);
      }
  };

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
    await fetchProfile(session);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setIsSuperAdmin(false);
  };

  useEffect(() => {
    // Initial Load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkRole(session);
      fetchProfile(session).then(() => setLoading(false));
    });

    // Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkRole(session);
      if (!session) {
        setProfile(null);
        setLoading(false);
      } else {
        fetchProfile(session).then(() => setLoading(false));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, isSuperAdmin, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
