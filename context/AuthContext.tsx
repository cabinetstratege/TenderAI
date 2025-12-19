
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

  const fetchProfile = async () => {
    try {
      const p = await userService.getCurrentProfile();
      setProfile(p);
    } catch (e) {
      console.error("Error fetching profile in context", e);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const signOut = async () => {
    await userService.resetLocalUser();
    setSession(null);
    setProfile(null);
    setIsSuperAdmin(false);
  };

  useEffect(() => {
    // 1. Check for DEMO Mode first
    if (userService.isDemoMode()) {
        setSession({ user: { id: 'demo-user', email: 'demo@compagnon.fr' } });
        fetchProfile().then(() => setLoading(false));
        return;
    }

    // 2. Normal Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkRole(session);
      if (session) {
          fetchProfile().then(() => setLoading(false));
      } else {
          setLoading(false);
      }
    });

    // Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkRole(session);
      if (!session) {
        if (!userService.isDemoMode()) {
            setProfile(null);
        }
        setLoading(false);
      } else {
        fetchProfile().then(() => setLoading(false));
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
