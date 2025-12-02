import React, { useState } from 'react';
import { MOCK_TENDERS, ADMIN_STATS } from '../services/mockData';
import { userService } from '../services/userService';
import { Edit, Trash, Users, Activity, FileText, TrendingUp, RefreshCw } from 'lucide-react';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ao' | 'users' | 'analytics'>('ao');

  const handleReset = () => {
      userService.resetLocalUser();
      window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Administration SaaS</h2>
        <div className="flex bg-slate-100 rounded-lg p-1">
             <button 
                onClick={() => setActiveTab('ao')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'ao' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
             >
                 Gestion AO
             </button>
             <button 
                onClick={() => setActiveTab('users')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
             >
                 Utilisateurs
             </button>
             <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
             >
                 Analytics Globaux
             </button>
        </div>
      </div>

      {activeTab === 'ao' && (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
                    title="Efface le profil local et relance le Wizard"
                >
                    <RefreshCw size={16}/> Reset Demo (Onboarding)
                </button>
                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
                + Injecter AO Brut
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                    <th className="px-4 py-3 font-semibold text-slate-900">ID</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Titre</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Acheteur</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Score IA</th>
                    <th className="px-4 py-3 font-semibold text-slate-900 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {MOCK_TENDERS.map(tender => (
                    <tr key={tender.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs">{tender.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-xs">{tender.title}</td>
                        <td className="px-4 py-3">{tender.buyer}</td>
                        <td className="px-4 py-3">{tender.compatibilityScore}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                        <button className="text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
                        <button className="text-slate-400 hover:text-red-600"><Trash size={16} /></button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Appels d'Offres Total" value={ADMIN_STATS.totalTenders.toLocaleString()} icon={FileText} color="blue" />
              <StatCard label="Utilisateurs Actifs" value={ADMIN_STATS.activeUsers.toString()} icon={Users} color="green" />
              <StatCard label="Analyses IA (Mois)" value={ADMIN_STATS.aiAnalysesPerformed.toLocaleString()} icon={Activity} color="purple" />
              <StatCard label="Taux Conversion" value={`${ADMIN_STATS.conversionRate}%`} icon={TrendingUp} color="orange" />
          </div>
      )}
      
      {activeTab === 'users' && (
          <div className="bg-white p-12 rounded-xl text-center border border-dashed border-slate-300">
              <Users className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500">Module de gestion des utilisateurs en cours de développement.</p>
          </div>
      )}

    </div>
  );
};

const StatCard: React.FC<{label: string, value: string, icon: any, color: string}> = ({label, value, icon: Icon, color}) => {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600'
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colors[color]}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    )
}

export default Admin;