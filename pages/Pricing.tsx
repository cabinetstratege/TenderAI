
import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const Pricing: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12">
      
      <div className="text-center space-y-8">
        <h2 className="text-3xl font-bold text-white">Un tarif simple et transparent</h2>
        <p className="text-slate-400 max-w-lg mx-auto">Accédez à toute la puissance de l'IA pour remporter vos marchés publics, sans engagement de durée.</p>

        <div className="flex justify-center mt-8">
            <div className="bg-surface rounded-2xl shadow-2xl border border-slate-700 overflow-hidden w-full max-w-md relative">
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-lg">
                POPULAIRE
            </div>
            
            <div className="p-8 border-b border-slate-700">
                <h3 className="text-xl font-bold text-white mb-2">Abonnement Mensuel Pro</h3>
                <div className="flex items-baseline justify-center gap-1 my-6">
                <span className="text-5xl font-extrabold text-white">95€</span>
                <span className="text-slate-400">/mois</span>
                </div>
                <p className="text-slate-400 text-sm">HT, facturé mensuellement</p>
            </div>

            <div className="p-8 bg-slate-900">
                <ul className="space-y-4 text-left">
                {[
                    "Accès illimité aux appels d'offres",
                    "Filtrage IA personnalisé",
                    "Score de compatibilité",
                    "Analyse stratégique Gemini (50/mois)",
                    "Support prioritaire"
                ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                    <div className="bg-emerald-900/50 text-emerald-400 rounded-full p-1 border border-emerald-900">
                        <Check size={14} />
                    </div>
                    <span className="text-slate-300 text-sm font-medium">{feature}</span>
                    </li>
                ))}
                </ul>

                <button className="w-full mt-8 bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20">
                Commencer maintenant
                </button>
            </div>
            </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6 pt-8 border-t border-border">
        <h3 className="text-2xl font-bold text-white text-center">Questions Fréquentes</h3>
        
        <div className="space-y-4">
            <FAQItem 
                question="Comment fonctionne le score de compatibilité ?" 
                answer="Notre IA analyse votre profil (mots-clés, spécialisation) et le compare sémantiquement au contenu complet de l'AO pour vous donner un score précis." 
            />
            <FAQItem 
                question="Puis-je changer mon périmètre géographique ?" 
                answer="Oui, vous pouvez basculer entre France, Europe ou une sélection personnalisée de départements à tout moment dans votre profil." 
            />
            <FAQItem 
                question="Quelles sources utilisez-vous ?" 
                answer="Nous nous connectons principalement à l'API du BOAMP et du JOUE pour garantir l'exhaustivité des marchés publics français." 
            />
        </div>
      </div>
    </div>
  );
};

const FAQItem: React.FC<{question: string, answer: string}> = ({question, answer}) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-slate-700 rounded-lg bg-surface overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left font-medium text-slate-200 hover:bg-slate-800 transition-colors"
            >
                {question}
                {isOpen ? <ChevronUp size={20} className="text-slate-500"/> : <ChevronDown size={20} className="text-slate-500"/>}
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-sm text-slate-400 leading-relaxed border-t border-slate-800">
                    {answer}
                </div>
            )}
        </div>
    )
}

export default Pricing;
