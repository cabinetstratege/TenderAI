import React, { useState, useMemo, useEffect } from 'react';
import { tenderService } from '../services/tenderService';
import { userService } from '../services/userService';
import TenderCard from '../components/TenderCard';
import TenderSkeleton from '../components/TenderSkeleton';
import { Search, Filter, Save, RotateCcw, SlidersHorizontal, Loader2, X, Calendar, ChevronDown, Compass, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { TenderStatus, DashboardFilters, Tender, UserProfile } from '../types';

interface DashboardProps {
    userProfile: UserProfile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const [authorizedTenders, setAuthorizedTenders] = useState<Tender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);

  const [filters, setFilters] = useState<DashboardFilters>({
    searchTerm: '',
    minScore: 0,
    minBudget: 0,
    selectedRegion: '',
    procedureType: '',
    publicationDate: '',
    rawKeywords: ''
  });

  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Stats for Hero Banner
  const [heroStats, setHeroStats] = useState({
      highMatchCount: 0,
      totalBudget: 0,
      avgScore: 0
  });

  // Load visited status on mount
  useEffect(() => {
     setVisitedIds(tenderService.getVisitedIds());
  }, []);

  const fetchTenders = async (currentOffset: number, isNewSearch: boolean) => {
    if (!userProfile) return;
    
    if (isNewSearch) {
        setIsLoading(true);
    } else {
        setIsLoadingMore(true);
    }

    try {
      const data = await tenderService.getAuthorizedTenders(userProfile, currentOffset);
      
      if (isNewSearch) {
          setAuthorizedTenders(data);
          
          // Calculate Hero Stats only on fresh load
          const highMatch = data.filter(t => t.compatibilityScore > 75).length;
          const totalB = data.reduce((acc, curr) => acc + (curr.estimatedBudget || 0), 0);
          const avg = data.length > 0 ? Math.round(data.reduce((acc, c) => acc + c.compatibilityScore, 0) / data.length) : 0;
          
          setHeroStats({
              highMatchCount: highMatch,
              totalBudget: totalB,
              avgScore: avg
          });

      } else {
          setAuthorizedTenders(prev => {
              const existingIds = new Set(prev.map(t => t.id));
              const newUnique = data.filter(t => !existingIds.has(t.id));
              return [...prev, ...newUnique];
          });
      }

      if (data.length < 20) {
          setHasMore(false);
      } else {
          setHasMore(true);
      }

    } catch (error) {
      console.error("Failed to fetch tenders", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
        if (userProfile.savedDashboardFilters) {
            setFilters(prev => ({...prev, ...userProfile.savedDashboardFilters}));
        }
        fetchTenders(0, true);
    }
  }, [userProfile]);

  const handleLoadMore = () => {
      const newOffset = offset + 20;
      setOffset(newOffset);
      fetchTenders(newOffset, false);
  };

  const handleStatusChange = async (tender: Tender, status: TenderStatus) => {
    if (status === TenderStatus.BLACKLISTED || status === TenderStatus.SAVED) {
      setAuthorizedTenders(prev => prev.filter(t => t.id !== tender.id));
    }
    await tenderService.updateInteraction(tender.id, status, undefined, tender);
  };

  const handleSaveFilters = async () => {
    try {
        await userService.saveProfile({ savedDashboardFilters: filters });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
        console.error("Error saving filters", e);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      minScore: 0,
      minBudget: 0,
      selectedRegion: '',
      procedureType: '',
      publicationDate: '',
      rawKeywords: ''
    });
  };

  const displayedTenders = useMemo(() => {
    return authorizedTenders.filter(t => {
      const term = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        t.title.toLowerCase().includes(term) || 
        t.buyer.toLowerCase().includes(term) ||
        t.descriptors.some(d => d.toLowerCase().includes(term));
      if (!matchesSearch) return false;

      if (filters.rawKeywords) {
          const rawTerms = filters.rawKeywords.toLowerCase().split(',').map(s=>s.trim());
          const matchesRaw = rawTerms.some(kw => t.fullDescription?.toLowerCase().includes(kw));
          if (!matchesRaw) return false;
      }

      if (filters.procedureType && filters.procedureType !== '') {
          if (!t.procedureType.includes(filters.procedureType)) return false;
      }

      if (filters.publicationDate) {
          if (t.deadline < filters.publicationDate) return false;
      }

      if (t.compatibilityScore < filters.minScore) return false;

      if (filters.minBudget && filters.minBudget > 0) {
        if (!t.estimatedBudget || t.estimatedBudget < filters.minBudget) return false;
      }

      if (filters.selectedRegion) {
        if (!t.departments.includes(filters.selectedRegion)) return false;
      }
      
      return true;
    });
  }, [authorizedTenders, filters]);

  if (!userProfile) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HERO BANNER */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
          {/* Dynamic Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-1000"></div>
          
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-300 mb-1">
                      <Sparkles size={16} className="animate-pulse"/>
                      <span className="text-xs font-bold uppercase tracking-widest">Veille Stratégique</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white">
                      Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">{userProfile.companyName}</span>
                  </h2>
                  <p className="text-blue-200/80 max-w-lg">
                      Nous avons analysé le BOAMP pour vous aujourd'hui. Voici les opportunités qui correspondent à votre expertise en <span className="text-white font-medium">{userProfile.specialization}</span>.
                  </p>
              </div>

              {/* KPI Cards */}
              <div className="flex gap-4">
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 min-w-[140px] hover:bg-white/15 transition-colors">
                      <div className="flex items-center gap-2 text-emerald-300 mb-2">
                          <TrendingUp size={18}/>
                          <span className="text-xs font-bold uppercase">Pertinence</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{heroStats.highMatchCount}</p>
                      <p className="text-xs text-blue-200">AO > 75% Match</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 min-w-[140px] hover:bg-white/15 transition-colors">
                      <div className="flex items-center gap-2 text-amber-300 mb-2">
                          <Wallet size={18}/>
                          <span className="text-xs font-bold uppercase">Potentiel</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{(heroStats.totalBudget / 1000000).toFixed(1)}M€</p>
                      <p className="text-xs text-blue-200">Budget Détecté</p>
                  </div>
              </div>
          </div>
      </div>

      <header className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Compass className="text-primary" size={20}/> Flux d'opportunités
            </h3>
            <div className="flex gap-2">
                <button 
                onClick={() => setShowAdvancedModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-surface/50 backdrop-blur-sm border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors shadow-sm hover:border-slate-600"
                >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Filtres</span>
                </button>
                <button 
                onClick={handleSaveFilters}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors backdrop-blur-sm ${isSaved ? 'bg-green-950/30 border-green-900 text-green-400' : 'bg-surface/50 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                >
                <Save size={16} />
                <span className="hidden sm:inline">{isSaved ? 'Sauvegardé' : 'Vue'}</span>
                </button>
            </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="glass-panel p-4 rounded-xl border border-white/5 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Recherche Rapide</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Ex: Rénovation, Logiciel..." 
                  className="pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg w-full text-sm text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder-slate-600 transition-all"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-4 space-y-1">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Score Min.</label>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{filters.minScore}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: parseInt(e.target.value)})}
              />
            </div>
            
             <div className="md:col-span-2">
               <button 
                onClick={handleResetFilters}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-slate-700"
               >
                 <RotateCcw size={14} />
                 Reset
               </button>
             </div>
        </div>
      </header>

      {/* Advanced Filters Modal */}
      {showAdvancedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <SlidersHorizontal size={18} className="text-primary"/> Filtres Avancés
                    </h3>
                    <button onClick={() => setShowAdvancedModal(false)} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Budget Minimum Estimé (€)</label>
                        <input 
                            type="number" 
                            placeholder="Ex: 50000"
                            className="w-full px-3 py-2 bg-background border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder-slate-600"
                            value={filters.minBudget || ''}
                            onChange={(e) => setFilters({...filters, minBudget: parseInt(e.target.value) || 0})}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Type de Procédure</label>
                        <select 
                            className="w-full px-3 py-2 bg-background border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-white"
                            value={filters.procedureType}
                            onChange={(e) => setFilters({...filters, procedureType: e.target.value})}
                        >
                            <option value="">Toutes les procédures</option>
                            <option value="OUVERT">Procédure Ouverte</option>
                            <option value="ADAPTE">Procédure Adaptée (MAPA)</option>
                            <option value="RESTREINT">Procédure Restreinte</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Date Limite minimum</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="date"
                                className="w-full pl-10 pr-3 py-2 bg-background border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-white [color-scheme:dark]"
                                value={filters.publicationDate || ''}
                                onChange={(e) => setFilters({...filters, publicationDate: e.target.value})}
                            />
                        </div>
                    </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Département Spécifique</label>
                        <input 
                            type="text" 
                            placeholder="Ex: 75"
                            className="w-full px-3 py-2 bg-background border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder-slate-600"
                            value={filters.selectedRegion || ''}
                            onChange={(e) => setFilters({...filters, selectedRegion: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Mots-clés Stricts (Description)</label>
                        <input 
                            type="text" 
                            placeholder="Ex: serveur, licence..."
                            className="w-full px-3 py-2 bg-background border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder-slate-600"
                            value={filters.rawKeywords || ''}
                            onChange={(e) => setFilters({...filters, rawKeywords: e.target.value})}
                        />
                    </div>
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-2">
                    <button 
                        onClick={handleResetFilters}
                        className="px-4 py-2 text-slate-400 font-medium hover:text-white hover:bg-slate-700 rounded-lg"
                    >
                        Réinitialiser
                    </button>
                    <button 
                        onClick={() => setShowAdvancedModal(false)}
                        className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 shadow-lg shadow-blue-900/20"
                    >
                        Appliquer
                    </button>
                </div>
            </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <TenderSkeleton key={i} />
            ))}
        </div>
      ) : displayedTenders.length === 0 ? (
        <div className="text-center py-20 bg-surface/50 rounded-xl border border-dashed border-slate-700 backdrop-blur-sm">
          <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-inner">
             <Filter className="text-slate-500" size={24} />
          </div>
          <h3 className="text-white font-bold mb-1 text-lg">Aucun résultat trouvé</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
             {authorizedTenders.length === 0 
               ? "Aucun AO ne correspond à votre Profil dans la limite de 50 résultats." 
               : "Vos filtres actuels sont trop restrictifs."}
          </p>
          <button onClick={handleResetFilters} className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium shadow-lg">
              Réinitialiser tous les filtres
          </button>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedTenders.map(tender => (
                <TenderCard 
                key={tender.id} 
                tender={tender} 
                userProfile={userProfile}
                onStatusChange={handleStatusChange} 
                isVisited={visitedIds.includes(tender.id)}
                />
            ))}
            </div>

            {hasMore && (
                <div className="flex justify-center py-8">
                    <button 
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="flex items-center gap-2 px-8 py-3 bg-surface border border-slate-700 rounded-full text-slate-300 font-medium hover:bg-slate-800 hover:text-white transition-all shadow-lg hover:shadow-blue-900/10 disabled:opacity-50 group"
                    >
                        {isLoadingMore ? <Loader2 className="animate-spin" size={18}/> : <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform"/>}
                        {isLoadingMore ? 'Recherche en cours...' : 'Charger plus d\'opportunités'}
                    </button>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default Dashboard;