
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TrialTimerProps {
  startDate: string; // ISO string
  onExpire?: () => void;
}

const TrialTimer: React.FC<TrialTimerProps> = ({ startDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(startDate).getTime();
      const now = new Date().getTime();
      const end = start + (24 * 60 * 60 * 1000); // 24 hours later
      const diff = end - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft(null);
        if (onExpire) onExpire();
        return;
      }

      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ h, m, s });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [startDate, onExpire]);

  if (expired) {
      return (
          <div className="mx-4 mt-2 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
              <div>
                  <p className="text-xs font-bold text-red-500 uppercase">Essai terminé</p>
                  <p className="text-[10px] text-red-400">Accès restreint</p>
              </div>
          </div>
      );
  }

  if (!timeLeft) return null;

  return (
    <div className="mx-4 mt-2 mb-4 p-3 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
            <Clock className="text-blue-400 shrink-0 animate-pulse" size={14} />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">Essai Gratuit</span>
        </div>
        <div className="flex justify-between items-end">
            <div className="flex gap-1 text-sm font-mono font-bold text-slate-200">
                <span className="bg-slate-800 px-1.5 rounded">{String(timeLeft.h).padStart(2, '0')}</span>:
                <span className="bg-slate-800 px-1.5 rounded">{String(timeLeft.m).padStart(2, '0')}</span>:
                <span className="bg-slate-800 px-1.5 rounded text-slate-400">{String(timeLeft.s).padStart(2, '0')}</span>
            </div>
        </div>
        <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
            <div 
                className="h-full bg-blue-500 transition-all duration-1000"
                style={{ width: `${(timeLeft.h / 24) * 100}%` }}
            ></div>
        </div>
    </div>
  );
};

export default TrialTimer;
