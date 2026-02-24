/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  Star,
  Quote,
  ShieldCheck,
  User,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type PricingScreenProps = {
  onSubscribed?: () => void;
};

const PricingScreen: React.FC<PricingScreenProps> = ({ onSubscribed }) => {
  const { refreshProfile, profile, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      setSuccess(true);
      refreshProfile();
    }
    if (params.get("canceled")) {
      setError("Paiement annulé. Vous pouvez réessayer.");
    }
  }, [refreshProfile]);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: profile?.id,
          email: profile?.contactEmail || session?.user?.email,
        }),
      });

      if (!response.ok) {
        const message = await response.json().catch(() => ({}));
        throw new Error(message.error || "Erreur Stripe");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("URL de paiement introuvable");
      }
    } catch (error) {
      console.error("Subscription failed", error);
      setError(
        "Impossible de démarrer le paiement. Réessayez dans un instant.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile?.contactEmail || session?.user?.email,
          userId: profile?.id,
        }),
      });
      if (!response.ok) {
        const message = await response.json().catch(() => ({}));
        throw new Error(message.error || "Erreur portail Stripe");
      }
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("URL portail introuvable");
      }
    } catch (err) {
      console.error("Portal error", err);
      setError("Impossible d'ouvrir la gestion d'abonnement pour le moment.");
    } finally {
      setPortalLoading(false);
    }
  };

  const isAlreadyActive = profile?.subscriptionStatus === "Active";

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-16">
      <div className="text-center space-y-8 animate-fade-in">
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm shadow-sm">
            Paiement confirmé. Votre abonnement va passer en actif dans quelques
            instants.
          </div>
        )}
        <h2 className="text-3xl font-bold text-textMain">
          Un tarif simple et transparent
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Accedez a toute la puissance de l'IA pour remporter vos marches
          publics, sans engagement de duree.
        </p>

        <div className="flex justify-center mt-8">
          <div className="bg-white dark:bg-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden w-full max-w-md relative group hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 bg-blue-500 dark:bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-lg">
              POPULAIRE
            </div>

            <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Abonnement Mensuel Pro
              </h3>
              <div className="flex items-baseline justify-center gap-1 my-6">
                <span className="text-5xl font-extrabold text-slate-900 dark:text-white">
                  95€
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  /mois
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                HT, facturé mensuellement. Annulable à tout moment.
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900">
              <ul className="space-y-4 text-left">
                {[
                  "Accès illimité aux appels d'offres",
                  "Filtrage IA personnalisé",
                  "Score de compatibilité précis",
                  "Analyse stratégique Gemini (50/mois)",
                  "Support prioritaire par email",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full p-1 border border-emerald-200 dark:border-emerald-900 shrink-0">
                      <Check size={14} />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {isAlreadyActive ? (
                <div className="space-y-3 mt-8">
                  <button
                    disabled
                    className="w-full font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 bg-emerald-500 text-white cursor-default"
                  >
                    <Check size={18} /> Abonnement actif
                  </button>
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full text-sm font-semibold py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {portalLoading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      "Gerer l'abonnement"
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full mt-8 font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 transform active:scale-95 duration-150 bg-primary text-white hover:bg-blue-600 shadow-blue-500/20 dark:shadow-blue-900/20"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Commencer maintenant"
                  )}
                </button>
              )}
              {error && (
                <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
              )}
              <p className="text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
                <ShieldCheck size={12} /> Paiement 100% sécurisé via Stripe
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-textMain">
            Ils remportent des marchés avec nous
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Rejoignez les entreprises qui ont modernisé leur réponse aux appels
            d'offres.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TestimonialCard
            name="Marc D."
            role="Directeur BTP"
            text="Grà¢ce au score de compatibilité, nous ne perdons plus de temps à  lire des DCE inutiles. J'ai gagné 2 marchés en 1 mois."
            stars={5}
          />
          <TestimonialCard
            name="Sophie L."
            role="Gérante (Nettoyage)"
            text="L'assistant IA pour rédiger le mémoire technique est bluffant. Il me mâche 80% du travail d'écriture."
            stars={5}
          />
          <TestimonialCard
            name="Karim B."
            role="ESN / IT"
            text="Un outil simple, efficace et sans fioritures. Le support est ultra réactif quand on a une question."
            stars={4}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-2xl font-bold text-textMain text-center">
          Questions Fréquentes
        </h3>

        <div className="space-y-4">
          <FAQItem
            question="Y a-t-il un engagement de durée ?"
            answer="Non, aucune ! Vous àªtes libre d'arrêter votre abonnement à  tout moment d'un simple clic depuis votre espace. Le mois en cours reste dà», mais aucun prélèvement suivant ne sera effectué."
          />
          <FAQItem
            question="Comment fonctionne le score de compatibilité ?"
            answer="Notre IA analyse votre profil (mots-clés, spécialisation, historique) et le compare sémantiquement au contenu complet de l'AO pour vous donner un score de pertinence précis sur 100."
          />
          <FAQItem
            question="Puis-je changer mon périmètre géographique ?"
            answer="Oui, absolument. Vous pouvez basculer entre France entière, Europe ou une sélection précise de départements à  tout moment dans l'onglet Profil, sans surcoà»t."
          />
          <FAQItem
            question="Mes données sont-elles sécurisées ?"
            answer="Oui. Nous utilisons le chiffrement SSL pour toutes les communications. Vos données de profil ne sont jamais revendues à  des tiers et servent uniquement à  calibrer l'algorithme pour votre usage."
          />
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-100 to-blue-50 dark:from-slate-900 dark:to-blue-950/30 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 justify-center md:justify-start">
            <MessageCircle className="text-blue-500 dark:text-blue-400" /> Une
            question avant de vous lancer ?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md">
            Notre équipe est basée en France et répond généralement sous
            quelques heures. N'hésitez pas à  nous solliciter pour une démo ou
            une question technique.
          </p>
        </div>
        <a
          href="mailto:cabinetstratege@gmail.com"
          className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-white text-slate-900 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg border border-slate-200 dark:border-transparent"
        >
          <Mail size={20} />
          Contacter le Support
        </a>
      </div>
    </div>
  );
};

const TestimonialCard: React.FC<{
  name: string;
  role: string;
  text: string;
  stars: number;
}> = ({ name, role, text, stars }) => (
  <div className="bg-surface p-6 rounded-xl border border-slate-200 dark:border-slate-800 relative shadow-sm">
    <Quote
      className="absolute top-4 right-4 text-slate-300 dark:text-slate-700 opacity-50"
      size={24}
    />
    <div className="flex gap-1 mb-3">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < stars
              ? "text-amber-400 fill-amber-400"
              : "text-slate-300 dark:text-slate-700"
          }
        />
      ))}
    </div>
    <p className="text-slate-700 dark:text-slate-300 text-sm italic mb-4 leading-relaxed">
      "{text}"
    </p>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <User size={14} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {name}
        </p>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
    </div>
  </div>
);

const FAQItem: React.FC<{ question: string; answer: string }> = ({
  question,
  answer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-surface overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        {question}
        {isOpen ? (
          <ChevronUp size={20} className="text-slate-500" />
        ) : (
          <ChevronDown size={20} className="text-slate-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          {answer}
        </div>
      )}
    </div>
  );
};

export default PricingScreen;
