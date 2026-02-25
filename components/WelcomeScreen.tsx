/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState } from "react";
import { userService } from "../services/userService";
import { generateProfileSuggestions } from "../services/geminiService";
import { useAuth } from "../context/AuthContext";
import { UserProfile } from "../types";
import { ArrowRight, Check, Sparkles, Loader2, Compass } from "lucide-react";

type WelcomeScreenProps = {
  onComplete?: () => void;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const { refreshProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    companyName: "",
    specialization: "",
    cpvCodes: "",
    negativeKeywords: "",
    targetDepartments: "",
    scope: "France",
    subscriptionStatus: "Active",
  });

  const handleAiGeneration = async () => {
    if (!formData.specialization) return;
    setIsGenerating(true);
    const suggestions = await generateProfileSuggestions(
      formData.specialization,
    );
    setFormData((prev) => ({
      ...prev,
      cpvCodes: suggestions.cpvCodes,
      negativeKeywords: suggestions.negativeKeywords,
    }));
    setIsGenerating(false);
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleFinish = async () => {
    setIsFinalizing(true);

    const finalProfile: Partial<UserProfile> = {
      ...formData,
      targetDepartments: formData.targetDepartments || "75, 92, 93, 94",
    };

    try {
      await userService.saveProfile(finalProfile);
      localStorage.setItem("tenderai_show_tutorial", "true");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await refreshProfile();
      onComplete?.();
    } catch (e) {
      console.error("Error saving profile", e);
      setIsFinalizing(false);
      alert("Erreur lors de la sauvegarde du profil.");
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          L'identité de votre entreprise
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Pour personnaliser votre compagnon de veille.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Nom de l'entreprise
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
            placeholder="Ex: TechBuild Solutions"
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Site Web (Optionnel)
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
            placeholder="https://..."
          />
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!formData.companyName}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
      >
        Suivant <ArrowRight size={18} />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Apprenez-moi votre métier
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Je configure les filtres BOAMP automatiquement pour vous.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Votre spécialisation
          </label>
          <textarea
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
            placeholder="Ex: Rénovation énergétique, isolation par l'extérieur, CVC..."
            rows={3}
            value={formData.specialization}
            onChange={(e) =>
              setFormData({ ...formData, specialization: e.target.value })
            }
          />
        </div>

        {!formData.cpvCodes && (
          <button
            onClick={handleAiGeneration}
            disabled={!formData.specialization || isGenerating}
            className="w-full py-4 bg-purple-600 border border-purple-700 text-white rounded-xl font-bold hover:bg-purple-700 flex items-center justify-center gap-2 transition-all"
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles
                size={18}
                className="text-purple-500 dark:text-purple-400"
              />
            )}
            {isGenerating
              ? "Analyse en cours..."
              : "Générer mes mots-clés & CPV"}
          </button>
        )}

        {formData.cpvCodes && (
          <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in">
            <div>
              <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-2">
                <Check size={14} /> Codes CPV détectés
              </label>
              <input
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 text-slate-700 dark:text-slate-300 font-mono"
                value={formData.cpvCodes}
                onChange={(e) =>
                  setFormData({ ...formData, cpvCodes: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Mots-clés Négatifs (Anti-bruit)
              </label>
              <textarea
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 text-slate-700 dark:text-slate-300"
                rows={2}
                value={formData.negativeKeywords}
                onChange={(e) =>
                  setFormData({ ...formData, negativeKeywords: e.target.value })
                }
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleNext}
        disabled={!formData.cpvCodes}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
      >
        Continuer <ArrowRight size={18} />
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Votre terrain de jeu
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Définissez votre zone d'intervention.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {["France", "Europe"].map((s) => (
          <button
            key={s}
            onClick={() => setFormData({ ...formData, scope: s as any })}
            className={`p-6 rounded-2xl border-2 text-center transition-all ${
              formData.scope === s
                ? "border-primary bg-primary text-white font-bold shadow-lg shadow-blue-900/20"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Départements prioritaires (Si France)
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
          placeholder="Ex: 75, 92, 69..."
          value={formData.targetDepartments}
          onChange={(e) =>
            setFormData({ ...formData, targetDepartments: e.target.value })
          }
        />
        <p className="text-xs text-slate-500">
          Laissez vide pour toute la France.
        </p>
      </div>

      <button
        onClick={handleFinish}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
      >
        Accéder aux marchés <Check size={18} />
      </button>
    </div>
  );

  if (isFinalizing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-textMain p-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <Loader2
            size={64}
            className="text-primary animate-spin relative z-10"
          />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-textMain">
          Initialisation du Compagnon...
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md animate-pulse">
          Recherche des opportunités pour{" "}
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            {formData.companyName}
          </span>
          ...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-xl w-full relative z-10">
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Compass className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold text-textMain tracking-tight">
            Le Compagnon
          </span>
        </div>

        <div className="flex justify-center mb-8 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? "w-12 bg-primary shadow-glow" : "w-4 bg-slate-200 dark:bg-slate-800"}`}
            />
          ))}
        </div>

        <div className="bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-600 mt-8">
          © 2026 Le Compagnon des Marchés.
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
