import React, { useMemo } from 'react';
import { Tender, UserProfile, TenderStatus } from '../types';
import { Calendar, Building, MapPin, Search, XCircle, BookmarkPlus, Euro, Share2, Tag, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TenderCardProps {
  tender: Tender;
  userProfile: UserProfile;
  onStatusChange: (tender: Tender, status: TenderStatus) => void;
  isVisited?: boolean;
}

const TenderCard: React.FC<TenderCardProps> = ({ tender, userProfile, onStatusChange, isVisited = false }) => {

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50';
    if (score >= 50) return 'text-amber-400 bg-amber-950/40 border-amber-900/50';
    return 'text-red-400 bg-red-950/40 border-red-900/50';
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
        shareUrl = window.location.origin + `/#/tender/${tender.id}`;
      } catch (err) {
        // Fallback for sandboxed environments where origin access might fail
        shareUrl = `/#/tender/${tender.id}`;
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
    <div className={`bg-surface rounded-xl shadow-lg border border-border transition-all flex flex-col h-full group relative ${
        isVisited ? 'opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0' : 'hover:border-slate-600 hover:shadow-blue-900/10'
    }`}>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-2 items-center">
             <span className={`text-[10px] font-bold px-2 py-1 rounded-full border tracking-wide uppercase ${getScoreColor(tender.compatibilityScore)}`}>
                {tender.compatibilityScore}% Match
             </span>
             {isVisited && (
                <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">
                    <Eye size={10} /> Vu
                </span>
             )}
          </div>
          <div className="flex gap-2">
             <button 
                onClick={handleShare}
                className="text-slate-500 hover:text-blue-400 p-1 rounded hover:bg-slate-800 transition-colors"
                title="Partager cet AO"
             >
                 <Share2 size={16} />
             </button>
             <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 self-center">
                {tender.idWeb}
             </span>
          </div>
        </div>

        <Link to={`/tender/${tender.id}`} className="block">
            <h3 className={`font-semibold text-lg leading-snug mb-3 line-clamp-2 transition-colors ${
                isVisited ? 'text-slate-400 group-hover:text-primary' : 'text-slate-100 group-hover:text-primary'
            }`}>
            {tender.title}
            </h3>
        </Link>

        <div className="space-y-2.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Building size={14} className="text-slate-500 shrink-0" />
            <span className="truncate">{tender.buyer}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
             <MapPin size={14} className="text-slate-500 shrink-0" />
             <span className="truncate">Départements: {tender.departments.join(', ')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar size={14} className="text-slate-500 shrink-0" />
            <span>{tender.deadline}</span>
          </div>
          {tender.estimatedBudget && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
              <Euro size={14} className="shrink-0" />
              <span>~{(tender.estimatedBudget / 1000).toFixed(0)}k €</span>
            </div>
          )}
        </div>

        {/* Matched Keywords Indicator */}
        {matchedKeywords.length > 0 && (
            <div className="mb-3 flex items-center gap-2 overflow-hidden">
                <Tag size={12} className="text-primary shrink-0" />
                <div className="flex flex-wrap gap-1">
                    {matchedKeywords.map((kw, i) => (
                        <span key={i} className="text-[10px] font-bold text-blue-200 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-900/50 capitalize">
                            {kw}
                        </span>
                    ))}
                </div>
            </div>
        )}

        <div className="bg-slate-800/50 rounded-lg p-3 mb-4 flex-1 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Search size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contexte Détecté</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-4 italic border-l-2 border-slate-700 pl-2">
            "{tender.aiSummary}"
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tender.descriptors.slice(0, 2).map((desc, i) => (
                <span key={i} className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-400">
                    {desc}
                </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-slate-900/30 rounded-b-xl space-y-3">
        {/* Main Action: Link to Internal Detail (Funnel) */}
        <Link 
          to={`/tender/${tender.id}`}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors group-hover:border-primary/50 group-hover:text-primary"
        >
          <span>Voir l'analyse détaillée</span>
          <ArrowRight size={14} />
        </Link>
        
        {/* Secondary Actions: Reject / Save */}
        <div className="flex gap-2">
          <button 
            onClick={() => onStatusChange(tender, TenderStatus.BLACKLISTED)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-slate-400 bg-slate-800 border border-transparent hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/30 transition-all"
          >
            <XCircle size={16} />
            Rejeter
          </button>
          <button 
            onClick={() => onStatusChange(tender, TenderStatus.SAVED)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white bg-primary hover:bg-blue-600 shadow-lg shadow-blue-900/20 transition-all"
          >
            <BookmarkPlus size={16} />
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenderCard;