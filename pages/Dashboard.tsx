import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_PROFILE } from '../services/mockData';
import { tenderService } from '../services/tenderService';
import TenderCard from '../components/TenderCard';
import { Search, Filter, Save, RotateCcw, SlidersHorizontal, Loader2, X } from 'lucide-react';
import { TenderStatus, DashboardFilters, Tender } from '../types';

const Dashboard: React.FC = () => {
  // State for Data (Layer 1 Output)
  const [authorizedTenders, setAuthorizedTenders] = useState<Tender[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for Frontend Filters (Layer 2)
  const [filters, setFilters] = useState<DashboardFilters>({
    searchTerm: '',
    minScore: 0,
    minBudget: 0,
    selectedRegion: '',
    procedureType: '',
    rawKeywords: ''
  });

  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 1. INITIALIZATION & DATA FETCHING (Backend Layer)
  useEffect(() => {
    const initDashboard = async () => {
      setIsLoading(true);
      try {
        // Load Saved Filters if any
        if (MOCK_PROFILE.savedDashboardFilters) {
          setFilters(MOCK_PROFILE.savedDashboardFilters);
        }

        // Call "API" to get authorized tenders
        const data = await tenderService.getAuthorizedTenders(MOCK_PROFILE);
        setAuthorizedTenders(data);
      } catch (error) {
        console.error("Failed to fetch tenders", error);
      } finally {
        setIsLoading(false);
      }
    };

    initDashboard();
  }, []);

  // 2. ACTION HANDLERS
  const handleStatusChange = async (tender: Tender, status: TenderStatus) => {
    // Optimistic UI Update: Remove item from feed if Blacklisted OR Saved
    if (status === TenderStatus.BLACKLISTED || status === TenderStatus.SAVED) {
      setAuthorizedTenders(prev => prev.filter(t => t.id !== tender.id));
    }
    // Call API (simulated) - Passing full tender to cache it
    await tenderService.updateInteraction(tender.id, status, undefined, tender);
  };

  const handleSaveFilters = () => {
    // Simulate API call to save user profile preferences
    MOCK_PROFILE.savedDashboardFilters = filters;
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      minScore: 0,
      minBudget: 0,
      selectedRegion: '',
      procedureType: '',
      rawKeywords: ''
    });
  };

  // 3. FRONTEND FILTERING (Layer 2 Logic)
  const displayedTenders = useMemo(() => {
    return authorizedTenders.filter(t => {
      // Filter by Search Term (Title, Buyer, Descriptors)
      const term = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        t.title.toLowerCase().includes(term) || 
        t.buyer.toLowerCase().includes(term) ||
        t.descriptors.some(d => d.toLowerCase().includes(term));
      if (!matchesSearch) return false;

      // Filter by Raw Keywords (Advanced)
      if (filters.rawKeywords) {
          const rawTerms = filters.rawKeywords.toLowerCase().split(',').map(s=>s.trim());
          const matchesRaw = rawTerms.some(kw => t.fullDescription?.toLowerCase().includes(kw));
          if (!matchesRaw) return false;
      }

      // Filter by Procedure Type (Advanced)
      if (filters.procedureType && filters.procedureType !== '') {
          if (!t.procedureType.includes(filters.procedureType)) return false;
      }

      // Filter by Score
      if (t.compatibilityScore < filters.minScore) return false;

      // Filter by Budget
      if (filters.minBudget && filters.minBudget > 0) {
        if (!t.estimatedBudget || t.estimatedBudget < filters.minBudget) return false;
      }

      // Filter by Region/Dept
      if (filters.selectedRegion) {
        if (!t.departments.includes(filters.selectedRegion)) return false;
      }
      
      return true;
    });
  }, [authorizedTenders, filters]);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Opportunités Détectées (BOAMP)</h2>
            <p className="text-slate-500 text-sm">
              Périmètre : <span className="font-semibold">{MOCK_PROFILE.companyName}</span> 
              <span className="mx-2">•</span> 
              Source : API BOAMP (Connecté)
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => setShowAdvancedModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <SlidersHorizontal size={16} />
              <span>Filtres Avancés</span>
            </button>
            <button 
              onClick={handleSaveFilters}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${isSaved ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <Save size={16} />
              <span>{isSaved ? 'Sauvegardé !' : 'Sauvegarder Vue'}</span>
            </button>
          </div>
        </div>

        {/* Standard Quick Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Search */}
            <div className="md:col-span-6 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Recherche Rapide</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Ex: Rénovation, Logiciel..." 
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                />
              </div>
            </div>

            {/* Score Slider */}
            <div className="md:col-span-4 space-y-1">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase">Score Min.</label>
                <span className="text-xs font-bold text-primary">{filters.minScore}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: parseInt(e.target.value)})}
              />
            </div>
            
             {/* Reset Button */}
             <div className="md:col-span-2">
               <button 
                onClick={handleResetFilters}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
               >
                 <RotateCcw size={14} />
                 Réinitialiser
               </button>
             </div>
        </div>
      </header>

      {/* Advanced Filters Modal */}
      {showAdvancedModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <SlidersHorizontal size={18}/> Filtres Avancés
                    </h3>
                    <button onClick={() => setShowAdvancedModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    {/* Budget */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Budget Minimum Estimé (€)</label>
                        <input 
                            type="number" 
                            placeholder="Ex: 50000"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            value={filters.minBudget || ''}
                            onChange={(e) => setFilters({...filters, minBudget: parseInt(e.target.value) || 0})}
                        />
                    </div>

                    {/* Procedure Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Type de Procédure</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                            value={filters.procedureType}
                            onChange={(e) => setFilters({...filters, procedureType: e.target.value})}
                        >
                            <option value="">Toutes les procédures</option>
                            <option value="OUVERT">Procédure Ouverte</option>
                            <option value="ADAPTE">Procédure Adaptée (MAPA)</option>
                            <option value="RESTREINT">Procédure Restreinte</option>
                        </select>
                    </div>

                     {/* Region/Dept Specific */}
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Département Spécifique</label>
                        <input 
                            type="text" 
                            placeholder="Ex: 75"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            value={filters.selectedRegion || ''}
                            onChange={(e) => setFilters({...filters, selectedRegion: e.target.value})}
                        />
                    </div>

                    {/* Raw Keywords */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Mots-clés Stricts (Description)</label>
                        <input 
                            type="text" 
                            placeholder="Ex: serveur, licence..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            value={filters.rawKeywords || ''}
                            onChange={(e) => setFilters({...filters, rawKeywords: e.target.value})}
                        />
                        <p className="text-xs text-slate-400">Recherche exacte dans le corps de l'AO.</p>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                    <button 
                        onClick={handleResetFilters}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg"
                    >
                        Réinitialiser
                    </button>
                    <button 
                        onClick={() => setShowAdvancedModal(false)}
                        className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700"
                    >
                        Appliquer
                    </button>
                </div>
            </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-slate-500 font-medium">Récupération des AO (API BOAMP)...</p>
        </div>
      ) : displayedTenders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <Filter className="text-slate-400" size={24} />
          </div>
          <h3 className="text-slate-900 font-medium mb-1">Aucun résultat trouvé</h3>
          <p className="text-slate-500 text-sm">
             {authorizedTenders.length === 0 
               ? "Aucun AO ne correspond à votre Profil (Filtre Backend)." 
               : "Essayez d'ajuster vos filtres de tableau de bord (Recherche, Budget...)."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedTenders.map(tender => (
            <TenderCard 
              key={tender.id} 
              tender={tender} 
              userProfile={MOCK_PROFILE}
              onStatusChange={handleStatusChange} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;