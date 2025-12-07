import React, { useMemo } from 'react';
import { Slide, PresentationState, AppMode } from '../types';
import Timeline from './Timeline.tsx';
import TimerDisplay from './TimerDisplay.tsx';
import { Pause, Play, SkipBack, SkipForward, Square, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

interface RunningViewProps {
  slides: Slide[];
  state: PresentationState;
  mode: AppMode;
  onTogglePause: () => void;
  onStop: () => void;
  onChangeSlide: (delta: number) => void;
  isAutoAdvance: boolean;
}

const RunningView: React.FC<RunningViewProps> = ({ 
  slides, 
  state, 
  mode, 
  onTogglePause, 
  onStop, 
  onChangeSlide,
  isAutoAdvance
}) => {
  const { currentSlideIndex, elapsedGlobalTime } = state;
  const currentSlide = slides[currentSlideIndex];
  
  // Calculate Totals
  const totalDuration = useMemo(() => slides.reduce((acc, s) => acc + (s?.durationSeconds || 0), 0), [slides]);
  
  // Calculate Planned Timing for Current Slide
  const plannedEndTimeForCurrentSlide = useMemo(() => {
    if (!slides || slides.length === 0) return 0;
    
    let duration = 0;
    // Ensure we don't access out of bounds if index is invalid
    const safeIndex = Math.min(currentSlideIndex, slides.length - 1);
    
    for (let i = 0; i <= safeIndex; i++) {
      if (slides[i]) {
        duration += slides[i].durationSeconds;
      }
    }
    return duration;
  }, [slides, currentSlideIndex]);

  const slideRemainingSeconds = plannedEndTimeForCurrentSlide - elapsedGlobalTime;
  const globalRemainingSeconds = totalDuration - elapsedGlobalTime;
  
  // Drift Calculation (Avance / Retard)
  const idealSlideInfo = useMemo(() => {
    if (!slides || slides.length === 0) return { index: 0, number: 1 };
    
    let accumulated = 0;
    for (let i = 0; i < slides.length; i++) {
      accumulated += slides[i].durationSeconds;
      if (elapsedGlobalTime < accumulated) {
        return { index: i, number: i + 1 };
      }
    }
    return { index: slides.length - 1, number: slides.length };
  }, [slides, elapsedGlobalTime]);

  if (!currentSlide) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400 flex-col gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p>Erreur: Aucune diapositive active ou liste vide.</p>
            <button onClick={onStop} className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700">Retour</button>
        </div>
      );
  }

  // If in Auto Mode, we are technically always "on time" regarding the slide displayed,
  // but the user wants to see the "Theoretical" state. 
  // In Auto Mode, the displayed slide IS the theoretical slide.
  
  const isLate = slideRemainingSeconds < 0; 
  
  return (
    <div className="flex flex-col h-screen p-4 md:p-6 max-w-7xl mx-auto">
      {/* Top: Timeline */}
      <div className="mb-6">
        <Timeline 
          slides={slides} 
          currentSlideIndex={currentSlideIndex} 
          globalElapsedTime={elapsedGlobalTime} 
          totalDuration={totalDuration} 
        />
      </div>

      {/* Main Grid */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Left: Current Slide Info */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
          <span className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">
            {isAutoAdvance ? "Diapositive Théorique" : "Actuellement"}
          </span>
          <h2 className="text-8xl font-black text-slate-100 mb-4">{currentSlide.number}</h2>
          <p className="text-xl md:text-2xl text-slate-300 font-medium max-w-xs leading-tight">
            {currentSlide.title}
          </p>
          <div className="mt-8 flex items-center gap-2 text-slate-500 text-sm">
             <span>Durée prévue: {Math.floor(currentSlide.durationSeconds / 60)}m {currentSlide.durationSeconds % 60}s</span>
          </div>
        </div>

        {/* Center: Slide Timer (The Hero) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <TimerDisplay 
            label={isLate ? "Dépassement" : "Temps restant diapo"}
            seconds={slideRemainingSeconds}
            totalSeconds={currentSlide.durationSeconds}
            size="xl"
            color={isLate ? 'danger' : (slideRemainingSeconds < 30 ? 'warning' : 'default')}
            showProgress={true}
          />
          
          {/* Drift / Status Indicator */}
          <div className={`rounded-xl p-4 border flex items-center justify-between transition-colors ${
            isAutoAdvance
              ? 'bg-blue-900/20 border-blue-500/20 text-blue-300'
              : idealSlideInfo.index === currentSlideIndex 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : idealSlideInfo.index > currentSlideIndex 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}>
             <div className="flex items-center gap-3">
               {isAutoAdvance ? (
                 <Zap className="fill-current w-5 h-5" />
               ) : (
                 idealSlideInfo.index === currentSlideIndex ? <CheckCircle2 /> : <AlertCircle />
               )}
               
               <div>
                 <p className="font-bold">
                   {isAutoAdvance 
                     ? "Mode Automatique" 
                     : idealSlideInfo.index === currentSlideIndex 
                       ? "Vous êtes dans les temps" 
                       : idealSlideInfo.index > currentSlideIndex 
                         ? "Vous êtes en retard" 
                         : "Vous êtes en avance"}
                 </p>
                 {!isAutoAdvance && idealSlideInfo.index !== currentSlideIndex && (
                   <p className="text-xs opacity-80">
                     Devrait être à la diapo {idealSlideInfo.number}
                   </p>
                 )}
                 {isAutoAdvance && (
                   <p className="text-xs opacity-80">
                     Les diapositives suivent le temps théorique.
                   </p>
                 )}
               </div>
             </div>
             {!isAutoAdvance && Math.abs(elapsedGlobalTime - (plannedEndTimeForCurrentSlide - currentSlide.durationSeconds)) > 5 && idealSlideInfo.index !== currentSlideIndex && (
                 <span className="font-mono text-xl font-bold">
                   {elapsedGlobalTime - (plannedEndTimeForCurrentSlide - currentSlide.durationSeconds) > 0 ? '+' : ''}
                   {Math.floor(elapsedGlobalTime - (plannedEndTimeForCurrentSlide - currentSlide.durationSeconds))}s
                 </span>
             )}
          </div>
        </div>

        {/* Right: Global Timer & Stats */}
        <div className="flex flex-col gap-4">
           <TimerDisplay 
            label="Temps Global Restant"
            seconds={globalRemainingSeconds}
            totalSeconds={totalDuration}
            size="lg"
            color={globalRemainingSeconds < 0 ? 'danger' : 'default'}
          />
           <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex-grow flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-slate-400 text-sm">Fin estimée</span>
                 <span className="text-slate-200 font-mono">
                    {new Date(Date.now() + globalRemainingSeconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                 <div 
                   className="bg-blue-500 h-full transition-all duration-1000" 
                   style={{ width: `${Math.min(100, (elapsedGlobalTime / totalDuration) * 100)}%` }}
                 />
              </div>
           </div>
        </div>

      </div>

      {/* Bottom: Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl">
        <button 
          onClick={onStop} 
          className="p-4 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex flex-col items-center gap-1 text-xs font-semibold"
        >
          <Square className="fill-current w-6 h-6" />
          ARRÊTER
        </button>

        <div className="flex items-center gap-6">
           <button 
             onClick={() => onChangeSlide(-1)} 
             disabled={isAutoAdvance || currentSlideIndex === 0}
             className="p-4 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-slate-800 transition-all border border-slate-700"
           >
             <SkipBack className="w-8 h-8" />
           </button>
           
           <button 
             onClick={onTogglePause}
             className={`p-6 rounded-full transition-all transform hover:scale-105 shadow-lg ${
               mode === AppMode.PAUSED 
                 ? 'bg-green-500 hover:bg-green-400 text-white shadow-green-900/30' 
                 : 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-yellow-900/30'
             }`}
           >
             {mode === AppMode.PAUSED ? <Play className="w-8 h-8 fill-current" /> : <Pause className="w-8 h-8 fill-current" />}
           </button>

           <button 
             onClick={() => onChangeSlide(1)} 
             disabled={isAutoAdvance || currentSlideIndex === slides.length - 1}
             className="p-4 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-slate-800 transition-all border border-slate-700"
           >
             <SkipForward className="w-8 h-8" />
           </button>
        </div>

        <div className="w-20 text-right text-xs text-slate-500 font-mono">
           {mode === AppMode.PAUSED ? 'PAUSE' : 'EN COURS'}
        </div>
      </div>
    </div>
  );
};

export default RunningView;