'use client';

import AuthScreen from '../../components/AuthScreen';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  return <AuthScreen onAuthenticated={() => router.push('/')} />;
}
