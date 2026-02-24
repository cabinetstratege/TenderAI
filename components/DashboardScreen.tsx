"use client";

/* eslint-disable react/no-unescaped-entities */
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { tenderService, calculateLocalScore } from "../services/tenderService";
import { userService } from "../services/userService";
import { getDashboardInsights, getAIScores } from "../services/geminiService";
import TenderCard from "./TenderCard";
import TenderSkeleton from "./TenderSkeleton";
import RefreshButton from "./RefreshButton";
import {
  Search,
  Filter,
  Save,
  RotateCcw,
  SlidersHorizontal,
  Loader2,
  X,
  Calendar,
  ChevronDown,
  Compass,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { TenderStatus, DashboardFilters, Tender, UserProfile } from "../types";

interface DashboardProps {
  userProfile: UserProfile | null;
  onOpenTender: (id: string) => void;
}

const DashboardScreen: React.FC<DashboardProps> = ({
  userProfile,
  onOpenTender,
}) => {
  const [authorizedTenders, setAuthorizedTenders] = useState<Tender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);

  const [filters, setFilters] = useState<DashboardFilters>({
    searchTerm: "",
    minScore: 0,
    minBudget: 0,
    selectedRegion: "",
    procedureType: "",
    publicationDate: "",
    rawKeywords: "",
  });

  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  // Debounce state for search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Stats for Hero Banner
  const [heroStats, setHeroStats] = useState({
    highMatchCount: 0,
    totalBudget: 0,
    avgScore: 0,
  });
  const [insights, setInsights] = useState<{
    summary: string;
    top3: { idWeb: string; reason: string }[];
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const insightsAbortRef = useRef<AbortController | null>(null);
  const insightsCacheRef = useRef<{
    key: string;
    data: { summary: string; top3: { idWeb: string; reason: string }[] };
  } | null>(null);
  const [aiScores, setAiScores] = useState<Record<string, number>>({});
  const aiScoresAbortRef = useRef<AbortController | null>(null);
  const aiScoresCacheRef = useRef<Map<string, number>>(new Map());
  const hasAdvancedFilters = useMemo(() => {
    return (
      Boolean(filters.selectedRegion) ||
      Boolean(filters.procedureType) ||
      Boolean(filters.publicationDate) ||
      Boolean(filters.rawKeywords) ||
      Boolean(filters.minBudget && filters.minBudget > 0)
    );
  }, [
    filters.selectedRegion,
    filters.procedureType,
    filters.publicationDate,
    filters.rawKeywords,
    filters.minBudget,
  ]);

  // Load visited status on mount
  useEffect(() => {
    setVisitedIds(tenderService.getVisitedIds());
  }, []);

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.searchTerm]);

  const fetchTenders = useCallback(
    async (currentOffset: number, isNewSearch: boolean) => {
      if (!userProfile) return;

      if (isNewSearch) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        // We pass the current filters state to the service for server-side filtering
        const data = await tenderService.getAuthorizedTenders(
          userProfile,
          currentOffset,
          {
            ...filters,
            searchTerm: debouncedSearchTerm, // Use debounced value
          },
        );

        if (isNewSearch) {
          setAuthorizedTenders(data);

          // Calculate Hero Stats only on fresh load of unfiltered data (conceptually)
          // Or just stats of current view
          const highMatch = data.filter(
            (t) => t.compatibilityScore > 75,
          ).length;
          const totalB = data.reduce(
            (acc, curr) => acc + (curr.estimatedBudget || 0),
            0,
          );
          const avg =
            data.length > 0
              ? Math.round(
                  data.reduce((acc, c) => acc + c.compatibilityScore, 0) /
                    data.length,
                )
              : 0;

          setHeroStats({
            highMatchCount: highMatch,
            totalBudget: totalB,
            avgScore: avg,
          });
        } else {
          setAuthorizedTenders((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const newUnique = data.filter((t) => !existingIds.has(t.id));
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
    },
    [debouncedSearchTerm, filters, userProfile],
  );

  // Re-fetch when major filters change (Search, Region, Procedure)
  // We use debouncedSearchTerm to avoid hammering API
  useEffect(() => {
    if (userProfile) {
      setOffset(0);
      fetchTenders(0, true);
    }
  }, [
    userProfile,
    debouncedSearchTerm,
    filters.selectedRegion,
    filters.procedureType,
    filters.publicationDate,
    filters.rawKeywords,
    fetchTenders,
  ]);

  const buildInsightsPayload = useCallback(() => {
    if (!userProfile) return null;
    const base = authorizedTenders.slice(0, 12).map((t) => ({
      idWeb: t.idWeb,
      title: t.title,
      buyer: t.buyer,
      procedureType: t.procedureType,
      compatibilityScore: t.compatibilityScore,
      estimatedBudget: t.estimatedBudget,
      aiSummary: (t.aiSummary || "").slice(0, 240),
    }));
    return {
      tenders: base,
      profile: {
        companyName: userProfile.companyName,
        specialization: userProfile.specialization,
        negativeKeywords: userProfile.negativeKeywords,
      },
    };
  }, [authorizedTenders, userProfile]);

  const makeInsightsKey = useCallback(
    (payload: ReturnType<typeof buildInsightsPayload>) => {
      if (!payload) return "";
      const ids = payload.tenders.map((t) => t.idWeb).join(",");
      const prof = `${payload.profile.companyName}|${payload.profile.specialization}|${payload.profile.negativeKeywords}`;
      return `${ids}::${prof}`;
    },
    [],
  );

  const loadInsights = useCallback(async () => {
    const payload = buildInsightsPayload();
    if (!payload || payload.tenders.length === 0) return;

    const key = makeInsightsKey(payload);
    if (insightsCacheRef.current?.key === key) {
      setInsights(insightsCacheRef.current.data);
      return;
    }

    insightsAbortRef.current?.abort();
    const controller = new AbortController();
    insightsAbortRef.current = controller;

    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const data = await getDashboardInsights(
        payload.tenders,
        payload.profile,
        controller.signal,
      );
      const safeData = {
        summary: data?.summary || "",
        top3: Array.isArray(data?.top3) ? data.top3.slice(0, 3) : [],
      };
      insightsCacheRef.current = { key, data: safeData };
      setInsights(safeData);
    } catch (e: any) {
      setInsightsError(e?.message || "Erreur IA");
    } finally {
      setInsightsLoading(false);
    }
  }, [buildInsightsPayload, makeInsightsKey]);

  useEffect(() => {
    loadInsights();
    return () => {
      insightsAbortRef.current?.abort();
    };
  }, [loadInsights]);

  useEffect(() => {
    if (!userProfile || authorizedTenders.length === 0) return;

    const ids = authorizedTenders.map((t) => t.idWeb).filter(Boolean);
    const cached = tenderService.getCachedAIScores(userProfile.id, ids);
    if (Object.keys(cached).length > 0) {
      Object.entries(cached).forEach(([idWeb, score]) => {
        aiScoresCacheRef.current.set(idWeb, score);
      });
      setAiScores((prev) => ({ ...cached, ...prev }));
    }

    const pending = authorizedTenders
      .filter((t) => t.idWeb && !aiScoresCacheRef.current.has(t.idWeb))
      .slice(0, 12);

    if (pending.length === 0) return;

    aiScoresAbortRef.current?.abort();
    const controller = new AbortController();
    aiScoresAbortRef.current = controller;

    const payload = pending.map((t) => ({
      idWeb: t.idWeb,
      title: t.title,
      buyer: t.buyer,
      procedureType: t.procedureType,
      estimatedBudget: t.estimatedBudget,
      fullDescription: t.fullDescription,
      descriptors: t.descriptors,
      cpv: t.lots?.flatMap((l) => l.cpv || []) || [],
    }));

    getAIScores(
      payload,
      {
        companyName: userProfile.companyName,
        specialization: userProfile.specialization,
        cpvCodes: userProfile.cpvCodes,
        negativeKeywords: userProfile.negativeKeywords,
      },
      controller.signal,
    )
      .then((data) => {
        const updates: Record<string, number> = {};
        data.scores.forEach((s) => {
          if (!s.idWeb || Number.isNaN(s.score)) return;
          aiScoresCacheRef.current.set(s.idWeb, s.score);
          tenderService.setCachedAIScore(userProfile.id, s.idWeb, s.score);
          updates[s.idWeb] = s.score;
        });
        if (Object.keys(updates).length > 0) {
          setAiScores((prev) => ({ ...prev, ...updates }));
        }
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        console.error("AI score error", e);
      });

    return () => {
      controller.abort();
    };
  }, [authorizedTenders, userProfile]);

  // Load saved filters on mount
  useEffect(() => {
    if (userProfile && userProfile.savedDashboardFilters) {
      setFilters((prev) => ({ ...prev, ...userProfile.savedDashboardFilters }));
    }
  }, [userProfile]);

  const handleManualRefresh = async () => {
    if (userProfile) {
      const ids = authorizedTenders.map((t) => t.idWeb).filter(Boolean);
      tenderService.clearCachedAIScores(userProfile.id, ids);
      aiScoresCacheRef.current.clear();
      setAiScores({});
    }
    setOffset(0);
    await fetchTenders(0, true);
  };

  const handleLoadMore = () => {
    const newOffset = offset + 20;
    setOffset(newOffset);
    fetchTenders(newOffset, false);
  };

  const handleStatusChange = async (tender: Tender, status: TenderStatus) => {
    if (status === TenderStatus.BLACKLISTED || status === TenderStatus.SAVED) {
      setAuthorizedTenders((prev) => prev.filter((t) => t.id !== tender.id));
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
      searchTerm: "",
      minScore: 0,
      minBudget: 0,
      selectedRegion: "",
      procedureType: "",
      publicationDate: "",
      rawKeywords: "",
    });
    setDebouncedSearchTerm("");
  };

  // Client-side filtering for things API can't handle well (like our calculated Score or Budget specific range)
  const scoredTenders = useMemo(() => {
    if (!userProfile) return authorizedTenders;
    return authorizedTenders.map((t) => {
      const text = `${t.title} ${t.fullDescription || ""} ${t.descriptors?.join(" ") || ""}`;
      const lotCpvs = t.lots?.flatMap((l) => l.cpv || []) || [];
      const { score, matchCount } = calculateLocalScore(
        text,
        userProfile,
        lotCpvs,
      );
      const aiScore = aiScores[t.idWeb];
      const finalScore = typeof aiScore === "number" ? aiScore : score;
      if (finalScore === t.compatibilityScore && matchCount === t.matchCount)
        return t;
      return { ...t, compatibilityScore: finalScore, matchCount };
    });
  }, [authorizedTenders, userProfile, aiScores]);

  const displayedTenders = useMemo(() => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    return scoredTenders
      .filter((t) => {
        if (t.deadline && /^\d{4}-\d{2}-\d{2}$/.test(t.deadline)) {
          if (t.deadline < todayIso) return false;
        }
        // Min Score (Calculated locally, so must allow filtering locally)
        if (t.compatibilityScore < filters.minScore) return false;

        // Min Budget
        if (filters.minBudget && filters.minBudget > 0) {
          if (!t.estimatedBudget || t.estimatedBudget < filters.minBudget)
            return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (b.compatibilityScore !== a.compatibilityScore) {
          return b.compatibilityScore - a.compatibilityScore;
        }
        if (
          a.deadline &&
          b.deadline &&
          /^\d{4}-\d{2}-\d{2}$/.test(a.deadline) &&
          /^\d{4}-\d{2}-\d{2}$/.test(b.deadline)
        ) {
          return a.deadline.localeCompare(b.deadline);
        }
        return 0;
      });
  }, [scoredTenders, filters.minScore, filters.minBudget]);

  if (!userProfile) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HERO BANNER - ALWAYS DARK THEMED for contrast */}
      <div
        id="tour-dashboard-hero"
        className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group"
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.5),transparent_25%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.4),transparent_25%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.4),transparent_25%),radial-gradient(circle_at_80%_80%,rgba(248,113,113,0.4),transparent_25%)]" />
        </div>

        {/* Content */}
        <div className="relative p-8 sm:p-10 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 text-white/80 rounded-full text-xs font-semibold w-fit">
                <Sparkles size={14} /> IA Tenderscope · Mise à  jour en temps
                réel
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Bonjour {userProfile.companyName || "à  vous"} !
              </h1>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                Voici votre flux personnalisé d&apos;appels d&apos;offres.
                Filtrez, sauvegardez et laissez l&apos;IA identifier les
                opportunités à  plus fort potentiel.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  icon={<TrendingUp size={16} />}
                  label="AO à  fort potentiel"
                  value={heroStats.highMatchCount}
                  accent="from-blue-500/80 to-indigo-500/80"
                />
                <StatCard
                  icon={<Wallet size={16} />}
                  label="Budget cumulé"
                  value={`${heroStats.totalBudget.toLocaleString("fr-FR")} €`}
                  accent="from-emerald-500/80 to-green-500/80"
                />
                <StatCard
                  icon={<Compass size={16} />}
                  label="Score moyen"
                  value={`${heroStats.avgScore}%`}
                  accent="from-amber-500/80 to-orange-500/80"
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 text-white shadow-2xl max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-white/70 font-semibold">
                    Aide IA
                  </p>
                  <h3 className="text-lg font-bold leading-snug">
                    Optimisez vos chances
                  </h3>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />
                  Analyse automatique des risques et atouts de chaque AO.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                  Génère des trames de réponses adaptées à  votre profil.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
                  Explorez rapidement les lots, critères et contacts clés.
                </li>
              </ul>
              <div className="mt-6">
                <RefreshButton
                  onRefresh={handleManualRefresh}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS + CONTENT */}
      <header className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Filtrage intelligent
            </div>
            <h2 className="text-xl font-bold text-textMain">
              Flux d&apos;opportunités
            </h2>
            <p className="text-textMuted text-sm">
              Ajustez les filtres pour affiner les appels d&apos;offres
              recommandés. Vos préférences sont sauvegardées automatiquement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAdvancedModal(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-surface border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-textMain hover:bg-surfaceHighlight transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Filtres avancés"
            >
              <SlidersHorizontal size={16} />
              Filtres avancés
              {hasAdvancedFilters && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
            <button
              onClick={handleSaveFilters}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors backdrop-blur-sm ${
                isSaved
                  ? "bg-green-100 dark:bg-green-950/30 border-green-500/50 text-green-600 dark:text-green-400"
                  : "bg-surface border-slate-200 dark:border-slate-700 text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
              }`}
            >
              <Save size={16} />
              <span className="hidden sm:inline">
                {isSaved ? "Filtres sauvegardés" : "Sauvegarder les filtres"}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div
          id="tour-search-filters"
          className="bg-surface p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
        >
          <div className="md:col-span-6 space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Recherche Rapide
            </label>
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Ex: Rénovation, Logiciel..."
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg w-full text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder-slate-400 transition-all"
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters({ ...filters, searchTerm: e.target.value })
                }
              />
            </div>
          </div>

          <div className="md:col-span-4 space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Score Min.
              </label>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {filters.minScore}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
              value={filters.minScore}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minScore: parseInt(e.target.value, 10),
                })
              }
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={handleResetFilters}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-slate-500 hover:text-textMain hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Advanced Filters Modal */}
      {showAdvancedModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-textMain flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-primary" /> Filtres
                Avancés
              </h3>
              <button
                onClick={() => setShowAdvancedModal(false)}
                className="text-slate-500 hover:text-textMain"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-textMain">
                  Budget Minimum Estimé (€)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 50000"
                  className="w-full px-3 py-2 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-textMain placeholder-slate-500"
                  value={filters.minBudget || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      minBudget: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-textMain">
                  Type de Procédure
                </label>
                <select
                  className="w-full px-3 py-2 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-textMain"
                  value={filters.procedureType}
                  onChange={(e) =>
                    setFilters({ ...filters, procedureType: e.target.value })
                  }
                >
                  <option value="">Toutes les procédures</option>
                  <option value="Ouvert">Procédure Ouverte</option>
                  <option value="Adapté">Procédure Adaptée (MAPA)</option>
                  <option value="Restreint">Procédure Restreinte</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-textMain">
                  Date Limite minimum
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={16}
                  />
                  <input
                    type="date"
                    className="w-full pl-10 pr-3 py-2 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-textMain dark:[color-scheme:dark]"
                    value={filters.publicationDate || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        publicationDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-textMain">
                  Département Spécifique
                </label>
                <input
                  type="text"
                  placeholder="Ex: 75"
                  className="w-full px-3 py-2 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-textMain placeholder-slate-500"
                  value={filters.selectedRegion || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, selectedRegion: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-textMain">
                  Mots-clés Stricts (Description)
                </label>
                <input
                  type="text"
                  placeholder="Ex: serveur, licence..."
                  className="w-full px-3 py-2 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-textMain placeholder-slate-500"
                  value={filters.rawKeywords || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, rawKeywords: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-slate-500 font-medium hover:text-textMain hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setShowAdvancedModal(false)}
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20"
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
        <div className="text-center py-20 bg-surface/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 backdrop-blur-sm">
          <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700 shadow-inner">
            <Filter className="text-slate-400" size={24} />
          </div>
          <h3 className="text-textMain font-bold mb-1 text-lg">
            Aucun résultat trouvé
          </h3>
          <p className="text-textMuted text-sm max-w-xs mx-auto">
            {authorizedTenders.length === 0
              ? "Aucun AO ne correspond à  votre recherche via l'API BOAMP."
              : "Vos filtres locaux (Score/Budget) sont trop restrictifs sur les résultats retournés."}
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = "/profile")}
            className="mt-6 mx-auto max-w-md text-xs text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            Complétez votre profil entreprise (spécialisation, CPV, mots-clés
            négatifs) pour augmenter vos chances d'avoir des matchs pertinents.
          </button>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-textMain rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium shadow-lg"
          >
            Réinitialiser tous les filtres
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedTenders.map((tender, index) => (
              <div
                key={tender.id}
                id={index === 0 ? "tour-feed-first-card" : undefined}
              >
                <TenderCard
                  tender={tender}
                  userProfile={userProfile}
                  onStatusChange={handleStatusChange}
                  isVisited={visitedIds.includes(tender.id)}
                  onOpenTender={(id) => onOpenTender(id)}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center py-8">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-8 py-3 bg-surface border border-slate-200 dark:border-slate-700 rounded-full text-textMuted font-medium hover:bg-surfaceHighlight hover:text-textMain transition-all shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-900/10 disabled:opacity-50 group"
              >
                {isLoadingMore ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <ChevronDown
                    size={18}
                    className="group-hover:translate-y-0.5 transition-transform"
                  />
                )}
                {isLoadingMore
                  ? "Recherche en cours..."
                  : "Charger plus d'opportunités"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardScreen;

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
};

const StatCard = ({ icon, label, value, accent }: StatCardProps) => (
  <div className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 text-white shadow-xl">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
        {label}
      </span>
      <div className={`p-2 rounded-lg bg-gradient-to-br ${accent}`}>{icon}</div>
    </div>
    <div className="text-2xl font-black">{value}</div>
  </div>
);
