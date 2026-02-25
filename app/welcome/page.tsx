"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import WelcomeScreen from "../../components/WelcomeScreen";
import { useAuth } from "../../context/AuthContext";

export default function WelcomePage() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/auth");
      return;
    }
    if (session && profile) {
      router.replace("/");
    }
  }, [loading, session, profile, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return <WelcomeScreen onComplete={() => router.push("/")} />;
}
