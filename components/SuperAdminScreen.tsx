'use client';

import React, { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import { checkApiHealth } from '../services/geminiService';
import { UserProfile } from '../types';
import { ShieldCheck, Users, Search, Activity, Database, AlertTriangle, Loader2 } from 'lucide-react';

type SuperAdminScreenProps = {
  onNavigateHome?: () => void;
};

const SuperAdminScreen: React.FC<SuperAdminScreenProps> = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [geminiStatus, setGeminiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const loadData = async () => {
      const allUsers = await userService.getAllProfiles();
      setUsers(allUsers);
      const isGeminiOk = await checkApiHealth();
      setGeminiStatus(isGeminiOk ? 'online' : 'offline');
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-slate-400">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-textMain">
            <ShieldCheck className="text-emerald-500 dark:text-emerald-400" /> SUPER ADMIN
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Contrôle total du SaaS</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</p>
            <p className="text-xs text-slate-500 uppercase">Utilisateurs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {users.filter((u) => u.subscriptionStatus === 'Active').length}
            </p>
            <p className="text-xs text-slate-500 uppercase">Actifs</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-textMain flex items-center gap-2">
              <Users size={18} /> Gestion Utilisateurs
            </h3>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-8 pr-3 py-1 text-sm bg-background border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary text-textMain"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-medium border-b border-border">
                <tr>
                  <th className="px-4 py-3">ID / Entreprise</th>
                  <th className="px-4 py-3">Spécialisation</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-200">{user.companyName}</div>
                      <div className="text-xs text-slate-500 font-mono truncate w-24">{user.id}</div>
                    </td>
                    <td className="px-4 py-3 truncate max-w-xs text-slate-600 dark:text-slate-400" title={user.specialization}>
                      {user.specialization || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                        {user.scope}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          user.subscriptionStatus === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                            : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                        }`}
                      >
                        {user.subscriptionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-textMain mb-4 flex items-center gap-2">
              <Activity size={18} /> État du Système
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Base de données</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Connecté
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">API Gemini</span>
                {geminiStatus === 'checking' && (
                  <span className="text-amber-500 dark:text-amber-400 font-medium flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Vérification...
                  </span>
                )}
                {geminiStatus === 'online' && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Opérationnel
                  </span>
                )}
                {geminiStatus === 'offline' && (
                  <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Erreur
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Version App</span>
                <span className="text-slate-700 dark:text-slate-200 font-mono">v1.3.0</span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-textMain mb-4 flex items-center gap-2">
              <Database size={18} /> Maintenance
            </h3>
            <div className="space-y-2">
              <button className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors">
                Vider le Cache Serveur
              </button>
              <button className="w-full py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex justify-center items-center gap-2 transition-colors">
                <AlertTriangle size={14} /> Mode Maintenance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminScreen;
