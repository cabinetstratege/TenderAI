"use client";

import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import LayoutNext from '../../../components/LayoutNext';
import TenderDetailScreen from '../../../components/TenderDetailScreen';
import { useAuth } from '../../../context/AuthContext';

export default function TenderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tenderId = Array.isArray(params?.id) ? params.id[0] : params?.id;
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

  if (!tenderId) {
    router.replace('/');
    return null;
  }

  return (
    <LayoutNext>
      <TenderDetailScreen tenderId={tenderId} onBack={() => router.back()} />
    </LayoutNext>
  );
}
