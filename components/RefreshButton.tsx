import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  cooldownSeconds?: number;
  className?: string;
}

const STORAGE_KEY = 'tenderai_last_refresh_timestamp';

const RefreshButton: React.FC<RefreshButtonProps> = ({ 
    onRefresh, 
    isLoading, 
    cooldownSeconds = 60,
    className = ""
}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
        try {
            const lastRefresh = localStorage.getItem(STORAGE_KEY);
            if (lastRefresh) {
                const now = Date.now();
                const elapsed = Math.floor((now - parseInt(lastRefresh)) / 1000);
                const remaining = cooldownSeconds - elapsed;
                return remaining > 0 ? remaining : 0;
            }
        } catch(e) {
            // Ignore storage errors
        }
        return 0;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleClick = async () => {
      if (timeLeft > 0 || isLoading) return;

      try {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      } catch(e) { /* ignore */ }
      
      setTimeLeft(cooldownSeconds);

      try {
          await onRefresh();
      } catch (error) {
          console.error("Refresh failed", error);
      }
  };

  if (timeLeft > 0) {
      return (
          <button 
            disabled 
            className={`flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-500 text-sm font-medium cursor-not-allowed transition-all ${className}`}
            title={`Veuillez patienter ${timeLeft}s avant de rafraîchir`}
          >
              <Clock size={16} className="animate-pulse" />
              <span className="font-mono">{timeLeft}s</span>
          </button>
      );
  }

  return (
      <button 
        onClick={handleClick}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-lg text-slate-300 text-sm font-medium transition-all active:scale-95 ${isLoading ? 'opacity-70 cursor-wait' : ''} ${className}`}
      >
          <RefreshCw size={16} className={`${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoading ? 'Chargement...' : 'Actualiser'}</span>
      </button>
  );
};

export default RefreshButton;