"use client";

import WelcomeScreen from '../../components/WelcomeScreen';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  return <WelcomeScreen onComplete={() => router.push('/')} />;
}
