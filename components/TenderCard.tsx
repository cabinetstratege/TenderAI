import React from 'react';
import { Tender, UserProfile } from '../types';
import { Calendar, Building, MapPin, ExternalLink, BrainCircuit, XCircle, BookmarkPlus, Euro } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TenderCardProps {
  tender: Tender;
  userProfile: UserProfile;
  onStatusChange: (tender: Tender, status: any) => void;
}

const TenderCard: React.FC<TenderCardProps> = ({ tender, userProfile, onStatusChange }) => {

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col h-full group">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getScoreColor(tender.compatibilityScore)}`}>
            {tender.compatibilityScore}% Match
          </span>
          <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1 rounded">
             {tender.idWeb}
          </span>
        </div>

        <Link to={`/tender/${tender.id}`} className="block">
            <h3 className="font-semibold text-lg text-slate-800 leading-tight mb-3 line-clamp-2 group-hover:text-primary transition-colors hover:underline">
            {tender.title}
            </h3>
        </Link>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{tender.buyer}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
             <MapPin size={14} className="text-slate-400 shrink-0" />
             <span className="truncate">Dépts: {tender.departments.join(', ')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <span>{tender.deadline}</span>
          </div>
          {tender.estimatedBudget && (
            <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
              <Euro size={14} className="text-emerald-500 shrink-0" />
              <span>~{(tender.estimatedBudget / 1000).toFixed(0)}k €</span>
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-4 flex-1">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <BrainCircuit size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Analyse Rapide</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
            {tender.aiSummary}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {tender.descriptors.slice(0, 2).map((desc, i) => (
                <span key={i} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-500">
                    {desc}
                </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl space-y-3">
        {/* Main Action: Link to DCE */}
        <a 
          href={tender.linkDCE} 
          target="_blank" 
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ExternalLink size={14} />
          Voir sur BOAMP
        </a>
        
        {/* Secondary Actions: Reject / Save */}
        <div className="flex gap-2">
          <button 
            onClick={() => onStatusChange(tender, 'Blacklisté')}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors"
          >
            <XCircle size={16} />
            Rejeter
          </button>
          <button 
            onClick={() => onStatusChange(tender, 'Sauvegardé')}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white bg-primary hover:bg-blue-700 shadow-sm transition-colors"
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