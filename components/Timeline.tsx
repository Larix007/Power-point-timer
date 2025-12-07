import React, { useMemo } from 'react';
import { Slide } from '../types';

interface TimelineProps {
  slides: Slide[];
  globalElapsedTime: number; // in seconds
  totalDuration: number; // in seconds
  currentSlideIndex: number;
}

const Timeline: React.FC<TimelineProps> = ({
  slides,
  globalElapsedTime,
  totalDuration,
  currentSlideIndex,
}) => {
  // Calculate marker positions (cumulative percentage)
  const slideMarkers = useMemo(() => {
    let accumulatedTime = 0;
    return slides.map((slide) => {
      const start = accumulatedTime;
      accumulatedTime += slide.durationSeconds;
      return {
        ...slide,
        startPct: (start / totalDuration) * 100,
        widthPct: (slide.durationSeconds / totalDuration) * 100,
        endPct: (accumulatedTime / totalDuration) * 100,
      };
    });
  }, [slides, totalDuration]);

  // Cap the progress cursor at 100%
  const currentProgressPct = Math.min((globalElapsedTime / totalDuration) * 100, 100);

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>Début</span>
        <span>Fin prévue ({Math.floor(totalDuration / 60)} min)</span>
      </div>
      
      {/* The Bar Container */}
      <div className="relative h-8 bg-slate-700 rounded-full overflow-hidden w-full border border-slate-600">
        
        {/* Render slide segments */}
        {slideMarkers.map((marker, idx) => {
           const isPast = idx < currentSlideIndex;
           const isCurrent = idx === currentSlideIndex;
           
           let bgColor = 'bg-slate-700'; // Future
           if (isPast) bgColor = 'bg-blue-900/40'; // Finished
           if (isCurrent) bgColor = 'bg-blue-600/30'; // Active

           return (
            <div
              key={marker.id}
              className={`absolute top-0 bottom-0 border-r border-slate-500/50 flex items-center justify-center text-[10px] text-slate-300 ${bgColor}`}
              style={{
                left: `${marker.startPct}%`,
                width: `${marker.widthPct}%`,
              }}
              title={`Diapo ${marker.number}: ${marker.title}`}
            >
             {marker.widthPct > 5 && <span className="truncate px-1 opacity-70">{marker.number}</span>}
            </div>
          );
        })}

        {/* Current Time Progress Bar (Overlay) */}
        <div 
           className="absolute top-0 bottom-0 left-0 bg-blue-500/20 pointer-events-none transition-all duration-1000 ease-linear"
           style={{ width: `${currentProgressPct}%` }}
        />

        {/* Current Time Indicator Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(250,204,21,0.8)]"
          style={{ left: `${currentProgressPct}%` }}
        />
        
      </div>
      
      <div className="mt-2 text-center text-xs text-slate-400">
        <span className="text-yellow-400 font-bold">▲ Vous êtes ici</span>
      </div>
    </div>
  );
};

export default Timeline;
