
import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, Funnel, FunnelChart, LabelList
} from 'recharts';
import { tenderService } from '../services/tenderService';
import { userService } from '../services/userService';
import { generateDashboardReport } from '../services/pdfService';
import { TenderStatus, UserProfile, MarketAnalysis } from '../types';
import { 
  Loader2, TrendingUp, Activity, Target, Award, Calendar, Download, Wallet, MapPin, Filter, Trophy, Swords, Building
} from 'lucide-react';

const Stats: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'internal' | 'market'>('internal');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [marketStats, setMarketStats] = useState<MarketAnalysis | null>(null);
  const [period, setPeriod] = useState<'30d' | '90d' | 'year' | 'all'>('year');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    const profile = await userService.getCurrentProfile();
    setUserProfile(profile);

    // 1. Fetch Internal Stats (Pipeline)
    const dataRaw = await tenderService.getSavedTenders();
    const visitedIds = tenderService.getVisitedIds();
    
    // --- Filtering Logic ---
    const now = new Date();
    const filteredData = dataRaw.filter(({tender}) => {
        if (period === 'all') return true;
        
        const tenderDate = new Date(tender.deadline || new Date()); 
        const diffTime = Math.abs(now.getTime() - tenderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (period === '30d') return diffDays <= 30;
        if (period === '90d') return diffDays <= 90;
        if (period === 'year') return diffDays <= 365;
        return true;
    });

    // --- KPI Calculation ---
    // Funnel Data
    const totalReceived = 200; // Mocked base potential or total relevant in BOAMP this month
    const totalConsulted = visitedIds.length; // From localStorage "Seen"
    const totalSaved = filteredData.length;
    
    const totalBudget = filteredData.reduce((acc, {tender}) => acc + (tender.estimatedBudget || 0), 0);
    const avgScore = totalSaved > 0 
        ? Math.round(filteredData.reduce((acc, {tender}) => acc + tender.compatibilityScore, 0) / totalSaved) 
        : 0;
        
    const winnableCount = filteredData.filter(({tender, interaction}) => 
        tender.compatibilityScore >= 70 || interaction.status === TenderStatus.WON
    ).length;

    // Conversion Rate
    const wonCount = filteredData.filter(i => i.interaction.status === TenderStatus.WON).length;
    const lostCount = filteredData.filter(i => i.interaction.status === TenderStatus.LOST).length;
    const closedCount = wonCount + lostCount;
    const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

    // --- Trend Data ---
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const trendMap = new Array(12).fill(0);
    
    filteredData.forEach(({tender}) => {
        if(tender.deadline) {
            const date = new Date(tender.deadline);
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

    // --- Geographic Data ---
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

    setStats({
        kpi: { totalSaved, totalConsulted, totalBudget, avgScore, winnableCount },
        conversionRate,
        trendData,
        topDepts,
        funnelData: [
            { name: "Consultés", value: totalConsulted, fill: '#3b82f6' },
            { name: "Sauvegardés", value: totalSaved, fill: '#8b5cf6' },
            { name: "Gagnés", value: wonCount, fill: '#10b981' }
        ]
    });

    // 2. Fetch Market Stats (If Profile Exists)
    if (profile) {
        const marketData = await tenderService.getCompetitorStats(profile);
        setMarketStats(marketData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const handleExport = () => {
      // PDF export logic here
      alert("Export PDF généré !");
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
      
      {/* Header with Tabs */}
      <div className="bg-surface/50 p-2 rounded-2xl border border-white/5 backdrop-blur-sm flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex p-1 bg-slate-900 rounded-xl">
             <button 
                onClick={() => setActiveTab('internal')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'internal' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
             >
                 <Activity size={18} /> Ma Performance
             </button>
             <button 
                onClick={() => setActiveTab('market')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'market' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
             >
                 <Swords size={18} /> Concurrence
             </button>
         </div>

         <div className="flex gap-2">
            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700">
                <button onClick={() => setPeriod('30d')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === '30d' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>30J</button>
                <button onClick={() => setPeriod('year')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === 'year' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Année</button>
                <button onClick={() => setPeriod('all')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Tout</button>
            </div>
         </div>
      </div>

      {activeTab === 'internal' && stats && (
         <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
             {/* KPI Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Opportunités Traitées" value={stats.kpi.totalSaved} icon={Activity} color="bg-blue-500" trend="Sauvegardés" trendColor="text-blue-300 bg-blue-900/30"/>
                <KPICard title="Potentiel Pipeline" value={(stats.kpi.totalBudget / 1000).toFixed(0) + ' k€'} icon={Wallet} color="bg-amber-500" trend="Cumul estimé" trendColor="text-amber-300 bg-amber-900/30"/>
                <KPICard title="Taux Transformation" value={stats.conversionRate + '%'} icon={Target} color="bg-emerald-500" trend="Gagnés / Clos" trendColor="text-emerald-300 bg-emerald-900/30"/>
                <KPICard title="Dossiers Gagnables" value={stats.kpi.winnableCount} icon={Award} color="bg-purple-500" trend="Score > 70%" trendColor="text-purple-300 bg-purple-900/30"/>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Trend Chart */}
                 <div className="lg:col-span-2 bg-surface p-6 rounded-2xl shadow-lg border border-border">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="text-blue-400" size={20}/> Dynamique des Opportunités</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10}/>
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="AO Détectés"/>
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Funnel Chart */}
                 <div className="bg-surface p-6 rounded-2xl shadow-lg border border-border flex flex-col">
                     <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Filter className="text-purple-400" size={20}/> Entonnoir</h3>
                     <p className="text-xs text-slate-400 mb-6">De la consultation à la victoire</p>
                     
                     <div className="flex-1 flex flex-col justify-center space-y-4">
                         {stats.funnelData.map((step: any, idx: number) => (
                             <div key={idx} className="relative">
                                 <div className="flex justify-between text-sm font-medium mb-1 text-slate-300">
                                     <span>{step.name}</span>
                                     <span>{step.value}</span>
                                 </div>
                                 <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full rounded-full transition-all duration-1000" 
                                        style={{ width: `${(step.value / stats.kpi.totalConsulted) * 100}%`, backgroundColor: step.fill }}
                                     ></div>
                                 </div>
                             </div>
                         ))}
                         <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400 text-center">
                             Vous transformez <strong>{stats.conversionRate}%</strong> des dossiers traités.
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      )}

      {activeTab === 'market' && marketStats && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-gradient-to-r from-slate-900 to-indigo-900/30 p-6 rounded-2xl border border-indigo-500/30 flex items-center justify-between">
                  <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Trophy className="text-yellow-400" size={24}/> Analyse des Gagnants
                      </h3>
                      <p className="text-indigo-200 text-sm mt-1">
                          Basé sur {marketStats.totalAwardsAnalyzed} avis d'attribution récents liés à "{userProfile?.specialization}"
                      </p>
                  </div>
                  <div className="text-right">
                      <p className="text-3xl font-bold text-white">{(marketStats.avgAwardAmount / 1000).toFixed(0)} k€</p>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wide">Montant Moyen Attribué</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Competitor Leaderboard */}
                  <div className="bg-surface p-6 rounded-2xl shadow-lg border border-border">
                      <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                          <Swords className="text-red-400" size={18}/> Top Concurrents (Fréquence)
                      </h4>
                      <div className="space-y-4">
                          {marketStats.topCompetitors.map((comp, idx) => (
                              <div key={idx} className="flex items-center gap-4 group">
                                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">
                                      {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-end mb-1">
                                          <h5 className="font-bold text-slate-200 truncate pr-2 group-hover:text-primary transition-colors">{comp.name}</h5>
                                          <span className="text-xs font-bold text-emerald-400">{comp.winCount} victoires</span>
                                      </div>
                                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                          <div className="h-full bg-slate-600 group-hover:bg-primary transition-colors" style={{width: `${(comp.winCount / marketStats.topCompetitors[0].winCount) * 100}%`}}></div>
                                      </div>
                                      <div className="flex justify-between mt-1">
                                          <span className="text-[10px] text-slate-500 flex items-center gap-1"><Building size={10}/> Client Principal: {comp.topBuyer}</span>
                                          <span className="text-[10px] text-slate-500">Vol: {(comp.totalAmount/1000).toFixed(0)}k€</span>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Market Share Chart */}
                  <div className="bg-surface p-6 rounded-2xl shadow-lg border border-border flex flex-col">
                      <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                          <Wallet className="text-green-400" size={18}/> Parts de Marché (Volume Financier)
                      </h4>
                      <div className="flex-1 w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={marketStats.topCompetitors.slice(0, 5)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="totalAmount"
                                    nameKey="name"
                                >
                                    {marketStats.topCompetitors.slice(0, 5).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} formatter={(val: number) => (val/1000).toFixed(0) + ' k€'}/>
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px', color: '#94a3b8'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-center text-xs text-slate-500 mt-4 italic">
                          Données basées sur les montants attribués déclarés publiquement.
                      </p>
                  </div>
              </div>
          </div>
      )}
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
