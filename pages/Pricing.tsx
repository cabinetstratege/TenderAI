import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const Pricing: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12">
      
      {/* Pricing Card */}
      <div className="text-center space-y-8">
        <h2 className="text-3xl font-bold text-slate-900">Un tarif simple et transparent</h2>
        <p className="text-slate-500 max-w-lg mx-auto">Accédez à toute la puissance de l'IA pour remporter vos marchés publics, sans engagement de durée.</p>

        <div className="flex justify-center mt-8">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full max-w-md relative">
            <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAIRE
            </div>
            
            <div className="p-8 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Abonnement Mensuel Pro</h3>
                <div className="flex items-baseline justify-center gap-1 my-6">
                <span className="text-5xl font-extrabold text-slate-900">95€</span>
                <span className="text-slate-500">/mois</span>
                </div>
                <p className="text-slate-500 text-sm">HT, facturé mensuellement</p>
            </div>

            <div className="p-8 bg-slate-50">
                <ul className="space-y-4 text-left">
                {[
                    "Accès illimité aux appels d'offres",
                    "Filtrage IA personnalisé",
                    "Score de compatibilité",
                    "Analyse stratégique Gemini (50/mois)",
                    "Support prioritaire"
                ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full p-1">
                        <Check size={14} />
                    </div>
                    <span className="text-slate-700 text-sm font-medium">{feature}</span>
                    </li>
                ))}
                </ul>

                <button className="w-full mt-8 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
                Commencer maintenant
                </button>
            </div>
            </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-2xl mx-auto space-y-6 pt-8 border-t border-slate-200">
        <h3 className="text-2xl font-bold text-slate-900 text-center">Questions Fréquentes</h3>
        
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
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left font-medium text-slate-800 hover:bg-slate-50"
            >
                {question}
                {isOpen ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {answer}
                </div>
            )}
        </div>
    )
}

export default Pricing;