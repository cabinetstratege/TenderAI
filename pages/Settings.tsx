
import React from 'react';
import { userService } from '../services/userService';
import { tenderService } from '../services/tenderService';
import { LogOut, Download, Database, Shield, FileJson } from 'lucide-react';

const Settings: React.FC = () => {
  
  const handleLogout = async () => {
      await userService.resetLocalUser(); 
  };

  const handleExportData = async () => {
      await tenderService.exportUserData();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center border-b border-border pb-6">
        <div>
            <h2 className="text-2xl font-bold text-white">Paramètres du compte</h2>
            <p className="text-slate-400 text-sm mt-1">Gérez vos données personnelles et votre connexion.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-surface p-6 rounded-xl border border-border shadow-lg space-y-4">
              <div className="w-10 h-10 bg-blue-900/30 text-blue-400 rounded-lg flex items-center justify-center">
                  <Database size={20} />
              </div>
              <div>
                  <h3 className="font-bold text-white">Données Personnelles</h3>
                  <p className="text-sm text-slate-400 mt-1">
                      Téléchargez une copie complète de vos données (Profil, Historique d'AO, Chats IA) au format JSON.
                  </p>
              </div>
              <button 
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-slate-700 rounded-lg text-slate-300 font-medium hover:bg-slate-800 transition-colors"
              >
                  <Download size={16} /> Exporter mes données
              </button>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-border shadow-lg space-y-4">
              <div className="w-10 h-10 bg-red-900/30 text-red-500 rounded-lg flex items-center justify-center">
                  <Shield size={20} />
              </div>
              <div>
                  <h3 className="font-bold text-white">Sécurité</h3>
                  <p className="text-sm text-slate-400 mt-1">
                      Déconnectez-vous de votre session actuelle en toute sécurité.
                  </p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 font-medium hover:bg-red-900/50 transition-colors"
              >
                  <LogOut size={16} /> Déconnexion
              </button>
          </div>
      </div>

      <div className="bg-slate-800/30 p-6 rounded-xl border border-border flex items-start gap-4">
          <FileJson className="text-slate-500 mt-1" size={24} />
          <div>
              <h4 className="font-bold text-slate-200 text-sm">Conformité RGPD</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Le Compagnon des Marchés s'engage à protéger vos données. Vos informations de profil et vos interactions ne sont utilisées que pour personnaliser votre expérience.
              </p>
          </div>
      </div>
    </div>
  );
};

export default Settings;
