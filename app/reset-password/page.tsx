'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../services/supabaseClient';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    const type = params.get('type');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (type !== 'recovery') {
      setError('Lien de réinitialisation invalide ou expiré.');
      setInitializing(false);
      return;
    }

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) setError(error.message);
        })
        .finally(() => setInitializing(false));
    } else {
      setError('Lien incomplet. Veuillez redemander un email de réinitialisation.');
      setInitializing(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || initializing) return;
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message || 'Impossible de mettre à jour le mot de passe.');
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const isDisabled = loading || initializing || success;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/90 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
            <Lock className="text-white" size={26} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Réinitialiser le mot de passe</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choisissez un nouveau mot de passe pour sécuriser votre compte.
          </p>
        </div>

        {initializing && (
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="animate-spin" size={18} />
            <span>Validation du lien…</span>
          </div>
        )}

        {!initializing && (
          <>
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-200 dark:border-red-900/50">
                {error}
              </div>
            )}

            {success ? (
              <div className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 p-4 rounded-lg border border-green-200 dark:border-green-900/50 flex items-center gap-3">
                <CheckCircle size={22} />
                <div>
                  <p className="font-semibold">Mot de passe mis à jour</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Vous pouvez maintenant vous connecter.</p>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nouveau mot de passe</label>
                  <input
                    type="password"
                    minLength={6}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="•••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    minLength={6}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="•••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isDisabled}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-900/30 disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Mettre à jour le mot de passe'}
                </button>
              </form>
            )}

            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              <Link href="/auth" className="text-primary font-semibold hover:underline">
                Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
