import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { MOCK_TENDERS, MOCK_INTERACTIONS } from '../services/mockData';
import { TenderStatus } from '../types';

const Stats: React.FC = () => {
  // 1. Prepare Geo Data
  const deptCount: {[key: string]: number} = {};
  MOCK_TENDERS.forEach(t => {
    t.departments.forEach(dept => {
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });
  });
  
  const geoData = Object.keys(deptCount).map(key => ({
    name: `Dept ${key}`,
    value: deptCount[key]
  }));

  // 2. Prepare Status Data
  const statusCount: {[key: string]: number} = {
    [TenderStatus.TODO]: 0,
    [TenderStatus.SAVED]: 0,
    [TenderStatus.WON]: 0,
    [TenderStatus.LOST]: 0,
    [TenderStatus.BLACKLISTED]: 0,
  };

  // Assume tenders without interaction are TODO
  const allIds = MOCK_TENDERS.map(t => t.id);
  const interactedIds = MOCK_INTERACTIONS.map(i => i.tenderId);
  const todoCount = allIds.filter(id => !interactedIds.includes(id)).length;
  
  statusCount[TenderStatus.TODO] = todoCount;
  MOCK_INTERACTIONS.forEach(i => {
    statusCount[i.status] = (statusCount[i.status] || 0) + 1;
  });

  const statusData = [
    { name: 'A traiter', value: statusCount[TenderStatus.TODO] },
    { name: 'Sauvegardé', value: statusCount[TenderStatus.SAVED] },
    { name: 'Gagné', value: statusCount[TenderStatus.WON] },
    { name: 'Rejeté', value: statusCount[TenderStatus.BLACKLISTED] + statusCount[TenderStatus.LOST] },
  ];

  const COLORS = ['#94a3b8', '#2563eb', '#16a34a', '#ef4444'];

  // 3. Prepare Procedure Type Data (Won vs Lost)
  const procedureStats: {[key: string]: {won: number, lost: number}} = {};
  
  MOCK_INTERACTIONS.forEach(interaction => {
      const tender = MOCK_TENDERS.find(t => t.id === interaction.tenderId);
      if (tender) {
          const type = tender.procedureType || 'Autre';
          if (!procedureStats[type]) procedureStats[type] = { won: 0, lost: 0};
          
          if (interaction.status === TenderStatus.WON) procedureStats[type].won++;
          if (interaction.status === TenderStatus.LOST || interaction.status === TenderStatus.BLACKLISTED) procedureStats[type].lost++;
      }
  });

  const procedureData = Object.keys(procedureStats).map(key => ({
      name: key.length > 15 ? key.substring(0, 15) + '...' : key,
      won: procedureStats[key].won,
      lost: procedureStats[key].lost
  }));

  // 4. Mock Time to Response Data
  const timeData = [
      { name: 'Juin', days: 4.5 },
      { name: 'Juil', days: 3.2 },
      { name: 'Aout', days: 2.1 },
      { name: 'Sept', days: 2.8 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Statistiques & Performance</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Geo Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Répartition Géographique (Cibles)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Entonnoir de Conversion (30j)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Success by Procedure */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Taux de Succès par Procédure</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={procedureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="won" name="Gagné" stackId="a" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="lost" name="Perdu/Rejeté" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} barSize={20} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Délai Moyen de Réponse (Jours)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="days" name="Jours Moyens" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Stats;