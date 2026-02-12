"use client";

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import LayoutNext from '../../components/LayoutNext';
import StatsScreen from '../../components/StatsScreen';
import { useAuth } from '../../context/AuthContext';

export default function StatsPage() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const hasProfile = !!profile;

  if (loading || (!session && !loading) || (session && !hasProfile)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!session) {
    router.replace('/auth');
    return null;
  }

  if (session && !hasProfile) {
    router.replace('/welcome');
    return null;
  }

  return (
    <LayoutNext>
      <StatsScreen onNavigateTender={(id) => router.push(`/tender/${id}`)} />
    </LayoutNext>
  );
}
