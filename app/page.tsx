'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LayoutNext from '../components/LayoutNext';
import DashboardScreen from '../components/DashboardScreen';

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
      <DashboardScreen
        userProfile={profile}
        onOpenTender={(id) => router.push(`/tender/${id}`)}
      />
    </LayoutNext>
  );
}
