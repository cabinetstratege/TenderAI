
import React, { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import { UserProfile } from '../types';
import { ShieldCheck, Users, Search, Activity, Database, AlertTriangle } from 'lucide-react';

const SuperAdmin: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadUsers = async () => {
            const allUsers = await userService.getAllProfiles();
            setUsers(allUsers);
            setLoading(false);
        };
        loadUsers();
    }, []);

    const filteredUsers = users.filter(u => 
        u.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8">Chargement du Backoffice Admin...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="text-green-400"/> SUPER ADMIN
                    </h1>
                    <p className="text-slate-400 text-sm">Contrôle total du SaaS TenderAI</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold">{users.length}</p>
                        <p className="text-xs text-slate-400 uppercase">Utilisateurs</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">
                            {users.filter(u => u.subscriptionStatus === 'Active').length}
                        </p>
                        <p className="text-xs text-slate-400 uppercase">Actifs</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Management Panel */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Users size={18}/> Gestion Utilisateurs
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                            <input 
                                type="text" 
                                placeholder="Rechercher..." 
                                className="pl-8 pr-3 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">ID / Entreprise</th>
                                    <th className="px-4 py-3">Spécialisation</th>
                                    <th className="px-4 py-3">Scope</th>
                                    <th className="px-4 py-3">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{user.companyName}</div>
                                            <div className="text-xs text-slate-400 font-mono truncate w-24">{user.id}</div>
                                        </td>
                                        <td className="px-4 py-3 truncate max-w-xs" title={user.specialization}>
                                            {user.specialization || "N/A"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{user.scope}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                user.subscriptionStatus === 'Active' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {user.subscriptionStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Status & Actions */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity size={18}/> État du Système
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Base de données</span>
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Connecté
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">API Gemini</span>
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Opérationnel
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Version App</span>
                                <span className="text-slate-900 font-mono">v1.2.0</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Database size={18}/> Maintenance
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Actions sensibles pour faire évoluer la plateforme.
                        </p>
                        <div className="space-y-2">
                            <button className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 border border-slate-200">
                                Vider le Cache Serveur
                            </button>
                            <button className="w-full py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 border border-red-200 flex justify-center items-center gap-2">
                                <AlertTriangle size={14}/> Mode Maintenance
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdmin;
