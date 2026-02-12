
import React from 'react';
import { Lock, Star, CheckCircle, ArrowRight } from 'lucide-react';

interface PaywallModalProps {
    isOpen: boolean;
    onGoToPricing?: () => void;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onGoToPricing }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop Blur */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
      
      {/* Modal Content */}
      <div className="relative bg-surface border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center space-y-6 animate-in fade-in zoom-in duration-300">
          
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/40">
              <Lock size={40} className="text-white" />
          </div>

          <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Période d'essai terminée</h2>
              <p className="text-slate-400">
                  Votre accès gratuit de 24h est expiré. Passez à la version Pro pour continuer à remporter des marchés.
              </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 text-left space-y-4 border border-slate-700">
              <h3 className="font-bold text-white flex items-center gap-2">
                  <Star size={18} className="text-amber-400 fill-amber-400"/> Ce que vous débloquez :
              </h3>
              <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0"/> 
                      Accès illimité aux 50 000+ appels d'offres
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0"/> 
                      Analyse IA & Rédaction automatique de mémoires
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0"/> 
                      Alertes emails temps réel
                  </li>
              </ul>
          </div>

          <button 
            onClick={onGoToPricing}
            className="w-full py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
          >
              Voir les offres <ArrowRight className="group-hover:translate-x-1 transition-transform"/>
          </button>
          
          <p className="text-xs text-slate-500">
              Satisfait ou remboursé sous 14 jours. Sans engagement.
          </p>
      </div>
    </div>
  );
};

export default PaywallModal;
