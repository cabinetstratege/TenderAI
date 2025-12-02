import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { generateProfileSuggestions } from '../services/geminiService';
import { UserProfile } from '../types';
import { ArrowRight, Check, Sparkles, Building2, Target, Map, Loader2 } from 'lucide-react';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    companyName: '',
    specialization: '',
    cpvCodes: '',
    negativeKeywords: '',
    targetDepartments: '',
    scope: 'France',
    subscriptionStatus: 'Active',
    // savedDashboardFilters will be initialized empty by default in type or logic
  });

  // STEP 2: AI Generation
  const handleAiGeneration = async () => {
      if (!formData.specialization) return;
      setIsGenerating(true);
      const suggestions = await generateProfileSuggestions(formData.specialization);
      setFormData(prev => ({
          ...prev,
          cpvCodes: suggestions.cpvCodes,
          negativeKeywords: suggestions.negativeKeywords
      }));
      setIsGenerating(false);
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleFinish = async () => {
    setIsFinalizing(true);
    
    // 1. Save Profile via Supabase
    const finalProfile: Partial<UserProfile> = {
        ...formData,
        targetDepartments: formData.targetDepartments || '75, 92, 93, 94', // Default IDF if empty
    };
    
    try {
        await userService.saveProfile(finalProfile);
        
        // 2. Simulate "Scanning BOAMP" delay
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Navigate to dashboard. App.tsx will reload the profile.
        // We use window.location.reload to ensure the App component remounts and fetches profile from DB
        // Or we can just navigate and rely on App state update if we were lifting state up.
        // Since App.tsx fetches on mount, simple navigation might not trigger re-fetch if App doesn't unmount.
        // But in our App.tsx, we check profile on mount. Let's force a reload or update state context.
        // For simplicity in this structure:
        window.location.reload(); 
    } catch (e) {
        console.error("Error saving profile", e);
        setIsFinalizing(false);
    }
  };

  // --- RENDERERS ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
        <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Bienvenue sur TenderAI</h2>
            <p className="text-slate-500">Commençons par configurer votre identité pour personnaliser votre veille.</p>
        </div>
        
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom de votre entreprise</label>
                <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: TechBuild Solutions"
                    value={formData.companyName}
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Site Web (Optionnel)</label>
                <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="https://..."
                />
            </div>
        </div>

        <button 
            onClick={handleNext}
            disabled={!formData.companyName}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
            Suivant <ArrowRight size={18} />
        </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
        <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Apprenez à l'IA votre métier</h2>
            <p className="text-slate-500">Décrivez votre activité pour que Gemini configure vos filtres automatiquement.</p>
        </div>
        
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quelle est votre spécialisation ?</label>
                <textarea 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: Nous faisons de la rénovation énergétique pour les bâtiments publics, isolation, CVC..."
                    rows={3}
                    value={formData.specialization}
                    onChange={e => setFormData({...formData, specialization: e.target.value})}
                />
            </div>

            {/* AI Magic Button */}
            {!formData.cpvCodes && (
                <button 
                    onClick={handleAiGeneration}
                    disabled={!formData.specialization || isGenerating}
                    className="w-full py-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-bold hover:bg-purple-100 flex items-center justify-center gap-2"
                >
                    {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles size={18} />}
                    {isGenerating ? "Gemini travaille..." : "Générer mes mots-clés & CPV"}
                </button>
            )}

            {/* Results */}
            {formData.cpvCodes && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 animate-in fade-in zoom-in">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Codes CPV Détectés</label>
                        <input 
                            type="text" 
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm mt-1"
                            value={formData.cpvCodes}
                            onChange={e => setFormData({...formData, cpvCodes: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Mots-clés Négatifs (Anti-bruit)</label>
                        <textarea 
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm mt-1"
                            rows={2}
                            value={formData.negativeKeywords}
                            onChange={e => setFormData({...formData, negativeKeywords: e.target.value})}
                        />
                    </div>
                </div>
            )}
        </div>

        <button 
            onClick={handleNext}
            disabled={!formData.cpvCodes}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
            Continuer <ArrowRight size={18} />
        </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
        <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Où cherchez-vous ?</h2>
            <p className="text-slate-500">Définissez votre zone de chalandise.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
             {['France', 'Europe'].map((s) => (
                 <button
                    key={s}
                    onClick={() => setFormData({...formData, scope: s as any})}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                        formData.scope === s 
                        ? 'border-primary bg-blue-50 text-primary font-bold' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                 >
                     {s}
                 </button>
             ))}
        </div>

        <div className="space-y-2">
             <label className="block text-sm font-medium text-slate-700">Départements prioritaires (Si France)</label>
             <input 
                type="text" 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="Ex: 75, 92, 69..."
                value={formData.targetDepartments}
                onChange={e => setFormData({...formData, targetDepartments: e.target.value})}
             />
             <p className="text-xs text-slate-400">Laissez vide pour toute la France.</p>
        </div>

        <button 
            onClick={handleFinish}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
        >
            Terminer & Lancer TenderAI <Check size={18} />
        </button>
    </div>
  );

  if (isFinalizing) {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
              <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                  <Loader2 size={64} className="text-blue-500 animate-spin relative z-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Configuration de votre espace...</h2>
              <p className="text-slate-400 text-center max-w-md animate-pulse">
                  L'IA scanne le BOAMP pour trouver les opportunités correspondant à <span className="text-blue-400">{formData.companyName}</span>...
              </p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full">
            {/* Header */}
            <div className="flex items-center gap-3 justify-center mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl text-white">T</div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">TenderAI</span>
            </div>

            {/* Stepper */}
            <div className="flex justify-center mb-8 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-2 rounded-full transition-all duration-500 ${step >= i ? 'w-12 bg-primary' : 'w-4 bg-slate-200'}`} />
                ))}
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-8">
                © 2024 TenderAI. Powered by Gemini.
            </p>
        </div>
    </div>
  );
};

export default Welcome;