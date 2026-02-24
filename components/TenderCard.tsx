/* eslint-disable react/no-unescaped-entities */

import React, { useMemo } from 'react';
import { Tender, UserProfile, TenderStatus } from '../types';
import { Calendar, Building, MapPin, Search, XCircle, BookmarkPlus, Euro, Share2, Tag, Eye, ArrowRight } from 'lucide-react';

interface TenderCardProps {
  tender: Tender;
  userProfile: UserProfile;
  onStatusChange: (tender: Tender, status: TenderStatus) => void;
  isVisited?: boolean;
  onOpenTender?: (id: string) => void;
}

const TenderCard: React.FC<TenderCardProps> = ({ tender, userProfile, onStatusChange, isVisited = false, onOpenTender }) => {

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/20';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/20';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-500/20';
  };

  // Logique pour trouver les mots-clés qui matchent
  const matchedKeywords = useMemo(() => {
    if (!userProfile.specialization) return [];
    
    const userKeywords = userProfile.specialization.toLowerCase()
        .split(/[\s,]+/)
        .filter(w => w.length > 3); // Ignorer les petits mots
    
    const textToCheck = (tender.title + ' ' + tender.fullDescription).toLowerCase();
    
    // On retourne les mots du profil qui sont présents dans l'AO
    const found = userKeywords.filter(kw => textToCheck.includes(kw));
    // Dédoublonnage et limite à 3
    return Array.from(new Set(found)).slice(0, 3);
  }, [tender, userProfile]);

  const handleShare = (e: React.MouseEvent) => {
      e.preventDefault();
      let shareUrl = "";
      try {
        shareUrl = window.location.origin + `/#/opportunites/${tender.id}`;
      } catch (err) {
        // Fallback for sandboxed environments where origin access might fail
        shareUrl = `/#/opportunites/${tender.id}`;
      }

      const shareData = {
          title: tender.title,
          text: `Regarde cet appel d'offre : ${tender.title} (${tender.buyer})`,
          url: shareUrl
      };
      if (navigator.share) {
          navigator.share(shareData).catch(console.error);
      } else {
          navigator.clipboard.writeText(shareData.url);
          alert("Lien copié dans le presse-papier !");
      }
  };

  return (
    <div className={`bg-surface rounded-2xl border transition-all duration-300 flex flex-col h-full group relative overflow-hidden ${
        isVisited 
        ? 'opacity-80 grayscale-[0.2] border-slate-200 dark:border-slate-700 hover:opacity-100 hover:grayscale-0'
        : 'border-slate-200 dark:border-slate-700 hover:border-primary/30 dark:hover:border-blue-500/30 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10'
    } hover:-translate-y-1`}>
      
      {/* Top Gradient Line on Hover */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="p-5 flex-1 flex flex-col relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-2 items-center">
             <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide uppercase ${getScoreColor(tender.compatibilityScore)}`}>
                {tender.compatibilityScore}% Match
             </span>
             {isVisited && (
                <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/50">
                    <Eye size={10} /> Vu
                </span>
             )}
          </div>
          <div className="flex gap-2">
             <button 
                onClick={handleShare}
                className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Partager cet AO"
             >
                 <Share2 size={16} />
             </button>
             <span className="text-[10px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 self-center">
                {tender.idWeb}
             </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenTender?.(tender.id)}
          className="block text-left w-full group/title"
        >
          <h3
            className={`font-bold text-lg leading-snug mb-3 line-clamp-2 transition-colors ${
              isVisited
                ? 'text-slate-500 dark:text-slate-400 group-hover/title:text-primary'
                : 'text-slate-900 dark:text-slate-100 group-hover/title:text-primary'
            }`}
          >
            {tender.title}
          </h3>
        </button>

        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
            <Building size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate font-medium">{tender.buyer}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
             <MapPin size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
             <span className="truncate">Départements: {tender.departments.join(', ')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
            <Calendar size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span>{tender.deadline}</span>
          </div>
          {tender.estimatedBudget && (
            <div className="flex items-center gap-2.5 text-sm text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/10 w-fit px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-900/30">
              <Euro size={16} className="shrink-0" />
              <span>~{(tender.estimatedBudget / 1000).toFixed(0)}k €</span>
            </div>
          )}
        </div>

        {/* Matched Keywords Indicator */}
        {matchedKeywords.length > 0 && (
            <div className="mb-4 flex items-start gap-2 overflow-hidden">
                <Tag size={14} className="text-blue-500 shrink-0 mt-1" />
                <div className="flex flex-wrap gap-1.5">
                    {matchedKeywords.map((kw, i) => (
                        <span key={i} className="text-[10px] font-bold text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-500/20 capitalize">
                            {kw}
                        </span>
                    ))}
                </div>
            </div>
        )}

        <div className="bg-[var(--color-surface-highlight)] dark:bg-[var(--color-surface)] rounded-xl p-3 mb-4 flex-1 border border-slate-100 dark:border-white/5 relative">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Search size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contexte Détecté</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 italic">
            "{tender.aiSummary}"
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-[color:var(--color-surface-highlight)] dark:bg-[color:var(--color-surface)] space-y-3 relative z-10">
        {/* Main Action: Link to Internal Detail (Funnel) */}
        <button
          type="button"
          onClick={() => onOpenTender?.(tender.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary transition-all group-hover:border-primary/30 shadow-sm"
        >
          <span>Voir l'analyse détaillée</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
        </button>
        
        {/* Secondary Actions: Reject / Save */}
        <div className="flex gap-2">
          <button 
            onClick={() => onStatusChange(tender, TenderStatus.BLACKLISTED)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 bg-transparent border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900/30 transition-all"
          >
            <XCircle size={14} />
            Rejeter
          </button>
          <button 
            onClick={() => onStatusChange(tender, TenderStatus.SAVED)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 shadow-md transition-all cursor-pointer"
          >
            <BookmarkPlus size={14} />
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenderCard;
