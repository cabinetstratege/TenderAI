
import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { tenderService } from '../services/tenderService';
import { userService } from '../services/userService';
import { generateDashboardReport } from '../services/pdfService';
import { TenderStatus, UserProfile } from '../types';
import { 
  Loader2, TrendingUp, Activity, Target, Award, Calendar, Download, Wallet, MapPin, Filter 
} from 'lucide-react';

const Stats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState<'30d' | '90d' | 'year' | 'all'>('year');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    const profile = await userService.getCurrentProfile();
    setUserProfile(profile);

    const dataRaw = await tenderService.getSavedTenders();
    
    // --- 0. Filtering Logic ---
    const now = new Date();
    const filteredData = dataRaw.filter(({tender}) => {
        if (period === 'all') return true;
        
        const tenderDate = new Date(tender.deadline || new Date()); // Fallback to now if no deadline
        const diffTime = Math.abs(now.getTime() - tenderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (period === '30d') return diffDays <= 30;
        if (period === '90d') return diffDays <= 90;
        if (period === 'year') return diffDays <= 365;
        return true;
    });

    // --- 1. KPI Calculation ---
    const totalOpportunities = filteredData.length;
    const totalBudget = filteredData.reduce((acc, {tender}) => acc + (tender.estimatedBudget || 0), 0);
    
    const avgScore = totalOpportunities > 0 
        ? Math.round(filteredData.reduce((acc, {tender}) => acc + tender.compatibilityScore, 0) / totalOpportunities) 
        : 0;
        
    const winnableCount = filteredData.filter(({tender, interaction}) => 
        tender.compatibilityScore >= 70 || interaction.status === TenderStatus.WON
    ).length;

    // Conversion Rate
    const wonCount = filteredData.filter(i => i.interaction.status === TenderStatus.WON).length;
    const lostCount = filteredData.filter(i => i.interaction.status === TenderStatus.LOST).length;
    const closedCount = wonCount + lostCount;
    const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

    // --- 2. Trend Data (Area Chart) ---
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const trendMap = new Array(12).fill(0);
    
    filteredData.forEach(({tender}) => {
        if(tender.deadline) {
            const date = new Date(tender.deadline);
            // Only count if within current year for simplicity in this chart view, or map differently
            if (period === 'year' || period === 'all' || date.getFullYear() === now.getFullYear()) {
                 const monthIdx = date.getMonth(); 
                 trendMap[monthIdx]++;
            }
        }
    });

    const trendData = months.map((month, index) => ({
        name: month,
        value: trendMap[index]
    }));

    // --- 3. Distribution Data (Donut) ---
    const typeCount: {[key: string]: number} = {};
    filteredData.forEach(({tender}) => {
        const type = tender.procedureType?.split(' ')[0] || "Autre";
        typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    // If procedures empty, use Status
    let donutData: any[] = [];
    if (Object.keys(typeCount).length <= 1) {
         const statusCount: {[key: string]: number} = {};
         filteredData.forEach(({interaction}) => {
             statusCount[interaction.status] = (statusCount[interaction.status] || 0) + 1;
         });
         donutData = Object.keys(statusCount).map(k => ({ name: k, value: statusCount[k] }));
    } else {
         donutData = Object.keys(typeCount).map(k => ({ name: k, value: typeCount[k] }));
    }
    donutData = donutData.sort((a,b) => b.value - a.value).slice(0, 4);

    // --- 4. Geographic Data (Top Departments) ---
    const deptCount: {[key: string]: number} = {};
    filteredData.forEach(({tender}) => {
        tender.departments.forEach(d => {
            deptCount[d] = (deptCount[d] || 0) + 1;
        });
    });
    const topDepts = Object.keys(deptCount)
        .map(k => ({ name: k, value: deptCount[k] }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 5);

    // Identify Top Sector/Region for Report
    const topSector = donutData.length > 0 ? donutData[0].name : 'N/A';
    const topRegion = topDepts.length > 0 ? topDepts[0].name : 'N/A';

    setStats({
        kpi: { totalOpportunities, totalBudget, avgScore, winnableCount },
        conversionRate,
        topSector,
        topRegion,
        trendData,
        donutData,
        topDepts
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const handleExport = () => {
      if(stats && userProfile) {
          const labels = {
              '30d': '30 derniers jours',
              '90d': 'Trimestre en cours',
              'year': 'Année en cours',
              'all': 'Tout l\'historique'
          };
          generateDashboardReport(stats, userProfile, labels[period]);
      }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="animate-spin text-primary mb-4" size={32} />
              <p className="text-slate-500">Analyse de vos données...</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
        <div>
            <h2 className="text-2xl font-bold text-white">Tableau de Bord Exécutif</h2>
            <p className="text-slate-400 text-sm mt-1">Pilotage de l'activité et aide à la décision.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
            {/* Period Selector */}
            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700">
                <button 
                    onClick={() => setPeriod('30d')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === '30d' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    30J
                </button>
                <button 
                    onClick={() => setPeriod('90d')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === '90d' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Trimestre
                </button>
                <button 
                    onClick={() => setPeriod('year')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === 'year' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Année
                </button>
                 <button 
                    onClick={() => setPeriod('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Tout
                </button>
            </div>

            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 shadow-lg shadow-blue-900/20 transition-colors"
            >
                <Download size={16} /> Exporter le rapport (PDF)
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Opportunités" 
            value={stats.kpi.totalOpportunities} 
            icon={Activity} 
            color="bg-blue-500"
            trend={period === '30d' ? "Sur 30 jours" : "Période sélectionnée"}
            trendColor="text-blue-300 bg-blue-900/30"
          />
          <KPICard 
            title="Potentiel Financier" 
            value={(stats.kpi.totalBudget / 1000).toFixed(0) + ' k€'} 
            icon={Wallet} 
            color="bg-amber-500"
            trend="Cumul estimé"
            trendColor="text-amber-300 bg-amber-900/30"
          />
          <KPICard 
            title="Taux Transformation" 
            value={stats.conversionRate + '%'} 
            icon={Target} 
            color="bg-emerald-500"
            trend="Gagnés / Traités"
            trendColor="text-emerald-300 bg-emerald-900/30"
          />
          <KPICard 
            title="Gagnables (>70%)" 
            value={stats.kpi.winnableCount} 
            icon={Award} 
            color="bg-purple-500"
            trend="Haute pertinence"
            trendColor="text-purple-300 bg-purple-900/30"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl shadow-lg border border-border">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <TrendingUp className="text-blue-400" size={20}/> Dynamique des Opportunités
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                />
                <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'}}
                    itemStyle={{color: '#fff'}}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    name="AO Détectés"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Departments (Geographic Focus) */}
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-border flex flex-col">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <MapPin className="text-emerald-400" size={20}/> Top Territoires
          </h3>
          <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={stats.topDepts} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={30} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="Volume AO" />
                  </BarChart>
              </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Distribution */}
        <div className="lg:col-span-3 bg-surface p-6 rounded-2xl shadow-lg border border-border">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-white">Répartition par Typologie</h3>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
             <div className="h-[250px] w-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats.donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                        >
                            {stats.donutData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px'}} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-white">{stats.kpi.totalOpportunities}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest">TOTAL</span>
                </div>
             </div>

             {/* Custom Legend Grid */}
             <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                {stats.donutData.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                        <div>
                            <p className="text-sm font-medium text-slate-200">{entry.name}</p>
                            <p className="text-xs text-slate-500">
                                {Math.round((entry.value / stats.kpi.totalOpportunities) * 100)}% ({entry.value})
                            </p>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color, trend, trendColor }: any) => (
    <div className="bg-surface p-5 rounded-2xl shadow-lg border border-border flex flex-col justify-between h-full relative overflow-hidden group hover:border-slate-600 transition-all">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-500"></div>
        
        <div className="flex justify-between items-start mb-3 relative z-10">
            <div className={`p-2.5 rounded-xl text-white shadow-lg ${color}`}>
                <Icon size={20} />
            </div>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trendColor}`}>
                    {trend}
                </span>
            )}
        </div>
        
        <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white tracking-tight mb-1">{value}</h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{title}</p>
        </div>
    </div>
);

export default Stats;
