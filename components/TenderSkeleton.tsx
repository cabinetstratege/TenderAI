
import React from 'react';

const TenderSkeleton: React.FC = () => {
  return (
    <div className="bg-surface rounded-xl shadow-lg border border-border p-5 flex flex-col h-full animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 w-20 bg-slate-800 rounded-full"></div>
        <div className="h-4 w-16 bg-slate-800 rounded"></div>
      </div>

      <div className="h-6 w-3/4 bg-slate-800 rounded mb-2"></div>
      <div className="h-6 w-1/2 bg-slate-800 rounded mb-4"></div>

      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2">
           <div className="w-4 h-4 rounded-full bg-slate-800"></div>
           <div className="h-3 w-1/3 bg-slate-800 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-4 h-4 rounded-full bg-slate-800"></div>
           <div className="h-3 w-1/4 bg-slate-800 rounded"></div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 flex-1 border border-slate-700/50 space-y-2">
         <div className="h-3 w-full bg-slate-800 rounded"></div>
         <div className="h-3 w-full bg-slate-800 rounded"></div>
         <div className="h-3 w-2/3 bg-slate-800 rounded"></div>
      </div>

      <div className="flex gap-2 mt-auto pt-4 border-t border-slate-800">
         <div className="h-9 flex-1 bg-slate-800 rounded-lg"></div>
         <div className="h-9 flex-1 bg-slate-800 rounded-lg"></div>
      </div>
    </div>
  );
};

export default TenderSkeleton;
