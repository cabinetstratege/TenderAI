import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: TourStep[] = [
  {
    targetId: 'tour-dashboard-hero',
    title: 'Vue d\'ensemble',
    content: 'Ici, vous voyez en un coup d\'œil les opportunités détectées par l\'IA et le potentiel financier actuel.',
    position: 'bottom'
  },
  {
    targetId: 'tour-search-filters',
    title: 'Filtres Intelligents',
    content: 'Affinez les résultats par budget, score de pertinence ou mots-clés spécifiques. Sauvegardez vos vues préférées.',
    position: 'bottom'
  },
  {
    targetId: 'tour-sidebar-tenders',
    title: 'Votre Pipeline',
    content: 'Gérez vos dossiers dans l\'onglet "Mes Appels d\'Offres". C\'est votre Kanban pour suivre les candidatures (À faire, En cours, Gagné).',
    position: 'right'
  },
  {
    targetId: 'tour-sidebar-profile',
    title: 'Calibrage IA',
    content: 'L\'onglet "Profil" permet d\'ajuster vos mots-clés et votre zone géographique pour améliorer la précision du matching.',
    position: 'right'
  },
  {
    targetId: 'tour-feed-first-card',
    title: 'Analyse Détaillée',
    content: 'Cliquez sur une carte pour voir l\'analyse complète de Gemini, le résumé des lots et discuter avec l\'assistant pour rédiger votre réponse.',
    position: 'top'
  }
];

interface Props {
  isActive: boolean;
  onComplete: () => void;
}

const OnboardingTour: React.FC<Props> = ({ isActive, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [coords, setCoords] = useState<{top: number, left: number, width: number, height: number} | null>(null);

  const updatePosition = useCallback(() => {
        const step = STEPS[currentStepIndex];
        const element = document.getElementById(step.targetId);
        
        if (element) {
            const rect = element.getBoundingClientRect();
            // Since the overlay is 'fixed', we use viewport coordinates (rect), NOT document coordinates (rect + scroll)
            setCoords({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
            return true;
        }
        return false;
  }, [currentStepIndex]);

  useEffect(() => {
    if (!isActive) return;

    let retryCount = 0;
    const maxRetries = 20; // Try for ~10 seconds (20 * 500ms)
    let retryTimer: ReturnType<typeof setTimeout>;

    const initStep = () => {
        const step = STEPS[currentStepIndex];
        const element = document.getElementById(step.targetId);

        if (element) {
            // Scroll to element
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Wait slightly for scroll to happen/settle before capturing coords
            setTimeout(() => {
                updatePosition();
            }, 600); 
        } else {
            // Element not found (async data?), retry
            if (retryCount < maxRetries) {
                retryCount++;
                retryTimer = setTimeout(initStep, 500);
            } else {
                // Timeout: Skip this step if it's not the last one, else finish
                if (currentStepIndex < STEPS.length - 1) {
                    setCurrentStepIndex(prev => prev + 1);
                } else {
                    onComplete(); // Can't find last step, just end
                }
            }
        }
    };

    initStep();

    const handleResizeOrScroll = () => {
        requestAnimationFrame(updatePosition);
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true); // Capture phase for all scrollable elements

    return () => {
        window.removeEventListener('resize', handleResizeOrScroll);
        window.removeEventListener('scroll', handleResizeOrScroll, true);
        clearTimeout(retryTimer);
    };
  }, [isActive, currentStepIndex, onComplete, updatePosition]);

  if (!isActive || !coords) return null;

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = () => {
      if (isLastStep) {
          onComplete();
      } else {
          setCurrentStepIndex(prev => prev + 1);
      }
  };

  const handlePrev = () => {
      if (currentStepIndex > 0) {
          setCurrentStepIndex(prev => prev - 1);
      }
  };

  // Calculate Popover Position
  let popoverStyle: React.CSSProperties = {};
  const spacing = 16;
  const popoverWidth = 384; // max-w-sm roughly

  // Basic boundary checks to keep popover on screen
  let leftPos = coords.left;
  if (currentStep.position === 'top' || currentStep.position === 'bottom') {
      // Center horizontally if possible
      leftPos = coords.left + (coords.width / 2) - (popoverWidth / 2);
      // Clamp to screen edges
      leftPos = Math.max(10, Math.min(window.innerWidth - popoverWidth - 10, leftPos));
  }

  if (currentStep.position === 'bottom') {
      popoverStyle = { top: coords.top + coords.height + spacing, left: leftPos };
  } else if (currentStep.position === 'top') {
      popoverStyle = { bottom: window.innerHeight - coords.top + spacing, left: leftPos };
  } else if (currentStep.position === 'right') {
      popoverStyle = { top: coords.top, left: coords.left + coords.width + spacing };
  } else if (currentStep.position === 'left') {
      popoverStyle = { top: coords.top, right: window.innerWidth - coords.left + spacing };
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
        {/* Backdrop composed of 4 divs around the hole to allow clicking THROUGH the hole if needed, 
            or just use SVG mask. Here using simple big div with clip-path or just opacity layer that BLOCKS interaction everywhere except hole?
            Actually, standard tours block interaction. Let's block everything.
         */}
        <div className="absolute inset-0 bg-slate-950/70 transition-opacity duration-500 pointer-events-auto">
             {/* This is the "hole" visual - it's just a clear div on top of the backdrop with a border */}
             <div 
                className="absolute bg-transparent transition-all duration-300 ease-out border-2 border-primary shadow-[0_0_0_9999px_rgba(2,6,23,0.85)] rounded-lg"
                style={{
                    top: coords.top - 4,
                    left: coords.left - 4,
                    width: coords.width + 8,
                    height: coords.height + 8,
                    boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.80), 0 0 20px rgba(59, 130, 246, 0.4)'
                }}
            />
        </div>

        {/* Popover */}
        <div 
            className="absolute max-w-sm w-full transition-all duration-300 ease-out pointer-events-auto"
            style={popoverStyle}
        >
            <div className="bg-surface border border-slate-700 rounded-xl shadow-2xl p-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-900/50 text-blue-400 rounded-lg">
                            <MapPin size={16} />
                        </div>
                        <h3 className="font-bold text-white text-lg">{currentStep.title}</h3>
                    </div>
                    <button 
                        onClick={onComplete}
                        className="text-slate-500 hover:text-white transition-colors"
                        title="Fermer le tutoriel"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    {currentStep.content}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        {STEPS.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all ${idx === currentStepIndex ? 'w-6 bg-primary' : 'w-1.5 bg-slate-700'}`}
                            />
                        ))}
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={handlePrev}
                            disabled={currentStepIndex === 0}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            onClick={handleNext}
                            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            {isLastStep ? 'Terminer' : 'Suivant'}
                            {!isLastStep && <ChevronRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>,
    document.body
  );
};

export default OnboardingTour;