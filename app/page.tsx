'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard';
import LayoutNext from '../components/LayoutNext';

export default function Home() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  const hasProfile = !!profile;

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/auth');
      return;
    }
    if (session && !hasProfile) {
      router.replace('/welcome');
    }
  }, [session, hasProfile, loading, router]);

  if (loading || (!session && !loading) || (session && !hasProfile)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <LayoutNext>
      <Dashboard
        userProfile={profile}
        onOpenTender={(id) => router.push(`/tender/${id}`)}
      />
    </LayoutNext>
  );
}
