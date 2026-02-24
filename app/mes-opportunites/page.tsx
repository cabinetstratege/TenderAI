"use client";

import LayoutNext from '../../components/LayoutNext';
import MyTendersScreen from '../../components/MyTendersScreen';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function MyTendersPage() {
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
      <MyTendersScreen
        onNavigateTender={(id) => router.push(`/opportunites/${id}`)}
      />
    </LayoutNext>
  );
}
