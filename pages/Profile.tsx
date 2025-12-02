import React, { useState, useEffect } from 'react';
import { getUserProfile, saveUserProfile } from '../services/mockData';
import { suggestCPVCodes } from '../services/geminiService';
import { Save, Server, Shield, CheckCircle, Map, Globe, Sparkles, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSuggestingCPV, setIsSuggestingCPV] = useState(false);

  useEffect(() => {
    setProfile(getUserProfile());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (profile) {
      setProfile({ ...profile, [e.target.name]: e.target.value });
    }
  };

  const handleScopeChange = (scope: 'France' | 'Europe' | 'Custom') => {
      if(profile) setProfile({...profile, scope});
  };

  const handleSave = () => {
    if (profile) {
      saveUserProfile(profile);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleSuggestCPV = async () => {
      if(!profile?.specialization) return;
      setIsSuggestingCPV(true);
      const suggestions = await suggestCPVCodes(profile.specialization);
      
      if(suggestions.length > 0) {
          const currentCodes = profile.cpvCodes ? profile.cpvCodes.split(',').map(s=>s.trim()) : [];
          // Merge unique codes
          const newCodes = Array.from(new Set([...currentCodes, ...suggestions])).join(', ');
          setProfile({...profile, cpvCodes: newCodes});
      }
      setIsSuggestingCPV(false);
  };

  // Simulated visual map selector
  const toggleRegion = (code: string) => {
      if(!profile) return;
      let depts = profile.targetDepartments.split(',').map(d => d.trim()).filter(d=>d);
      if(depts.includes(code)) {
          depts = depts.filter(d => d !== code);
      } else {
          depts.push(code);
      }
      setProfile({...profile, targetDepartments: depts.join(', ')});
  };

  if (!profile) return <div>Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Paramètres de Filtrage Permanent (Backend)</h2>
        <p className="text-slate-500">
            Ces critères définissent le périmètre strict des AO injectés dans votre compte depuis le BOAMP.
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">
        
        {/* Identity Section */}
        <div className="space-y-4">
             <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Shield size={20} className="text-slate-400"/>
                <h3 className="font-semibold text-slate-800">Identité & Abonnement</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nom de l'entreprise</label>
                    <input 
                    type="text" 
                    name="companyName" 
                    value={profile.companyName} 
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Statut Abonnement</label>
                    <div className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium inline-block w-full text-center">
                    {profile.subscriptionStatus}
                    </div>
                </div>
            </div>
        </div>

        {/* AI & Context */}
        <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="text-lg">🤖</span>
                <h3 className="font-semibold text-slate-800">Configuration IA & Spécialisation</h3>
             </div>
             
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Spécialisation (Contexte Métier)</label>
                <textarea 
                    name="specialization"
                    value={profile.specialization}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Décrivez votre activité principale pour l'IA..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Codes CPV Cibles</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        name="cpvCodes" 
                        value={profile.cpvCodes} 
                        onChange={handleChange}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                    />
                    <button 
                        onClick={handleSuggestCPV}
                        disabled={isSuggestingCPV}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                        {isSuggestingCPV ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} />}
                        Suggestion IA
                    </button>
                </div>
            </div>
        </div>

        {/* Scope & Geography */}
        <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Map size={20} className="text-slate-400"/>
                <h3 className="font-semibold text-slate-800">Périmètre Géographique</h3>
             </div>

            <div className="flex items-center gap-4">
                {['France', 'Europe', 'Custom'].map((scope) => (
                    <button
                        key={scope}
                        onClick={() => handleScopeChange(scope as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg border font-medium transition-all ${
                            profile.scope === scope 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                    >
                        {scope === 'France' && <span className="text-lg">🇫🇷</span>}
                        {scope === 'Europe' && <Globe size={18}/>}
                        {scope === 'Custom' && <Map size={18}/>}
                        {scope === 'Custom' ? 'Personnalisé' : scope}
                    </button>
                ))}
            </div>

            {profile.scope === 'Custom' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-sm font-medium text-slate-700 block mb-3">Sélectionnez vos départements (Simulation Carte)</label>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {['75', '92', '93', '94', '77', '78', '91', '95', '69', '33', '13', '59', '44', '35', '31', '06'].map(code => (
                            <button
                                key={code}
                                onClick={() => toggleRegion(code)}
                                className={`text-xs font-mono py-1 rounded border ${
                                    profile.targetDepartments.includes(code)
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                }`}
                            >
                                {code}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                        Liste actuelle: {profile.targetDepartments}
                    </div>
                </div>
            )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-300 ${showSuccess ? 'bg-green-600 text-white' : 'bg-primary text-white hover:bg-blue-700'}`}
          >
            {showSuccess ? <CheckCircle size={18} /> : <Save size={18} />}
            {showSuccess ? 'Profil Mis à jour !' : 'Mettre à jour le Profil'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;