
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowRight, CheckCircle, Compass } from 'lucide-react';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user && data.session) {
           // User created and auto-logged in. 
        } else if (data.user && !data.session) {
           setSuccessMsg("Compte créé avec succès ! Veuillez vérifier votre email pour confirmer.");
           setLoading(false);
           return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    } 
  };

  const toggleMode = () => {
      setIsSignUp(!isSignUp);
      setError(null);
      setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-md w-full bg-surface/50 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 p-8 space-y-8 relative z-10">
        
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40 mx-auto transform rotate-3 hover:rotate-6 transition-transform">
            <Compass className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Le Compagnon</h1>
            <p className="text-blue-400 font-medium">des Marchés Publics</p>
          </div>
          <p className="text-slate-400 text-sm">
            {isSignUp ? "Créez votre compte pour accéder à l'intelligence des marchés." : "Connectez-vous à votre espace de veille."}
          </p>
        </div>

        {error && (
          <div className="bg-red-950/30 text-red-400 p-3 rounded-lg text-sm text-center border border-red-900/50 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-950/30 text-green-400 p-4 rounded-lg text-sm text-center border border-green-900/50 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle size={24} />
            {successMsg}
          </div>
        )}

        {!successMsg && (
            <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email professionnel</label>
                <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                    type="email" 
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-slate-600 transition-all"
                    placeholder="nom@entreprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Mot de passe</label>
                <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                    type="password" 
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-slate-600 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                </div>
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-900/30 disabled:opacity-70 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
            >
                {loading ? <Loader2 className="animate-spin" /> : (
                <>
                    {isSignUp ? "Créer mon compte" : "Se connecter"}
                    <ArrowRight size={18} />
                </>
                )}
            </button>
            </form>
        )}

        <div className="text-center pt-2 border-t border-slate-800">
          <button 
            onClick={toggleMode}
            className="text-sm text-slate-500 hover:text-white font-medium transition-all"
          >
            {isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
