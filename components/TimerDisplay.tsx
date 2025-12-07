import React from 'react';
import { clsx } from 'clsx';

interface TimerDisplayProps {
  label: string;
  seconds: number;
  totalSeconds?: number;
  color?: 'default' | 'danger' | 'warning' | 'success';
  size?: 'sm' | 'lg' | 'xl';
  showProgress?: boolean;
}

const formatTime = (totalSeconds: number) => {
  const isNegative = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const minutes = Math.floor(absSeconds / 60);
  const secs = Math.floor(absSeconds % 60);
  return `${isNegative ? '-' : ''}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  label, 
  seconds, 
  totalSeconds, 
  color = 'default', 
  size = 'lg',
  showProgress = false 
}) => {
  
  const textColor = {
    default: 'text-slate-100',
    danger: 'text-red-500',
    warning: 'text-yellow-500',
    success: 'text-green-500'
  }[color];

  const textSize = {
    sm: 'text-2xl',
    lg: 'text-5xl font-bold',
    xl: 'text-8xl font-black'
  }[size];

  let progressPct = 0;
  if (showProgress && totalSeconds && totalSeconds > 0) {
      progressPct = Math.min((seconds / totalSeconds) * 100, 100);
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden">
      <span className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-1">{label}</span>
      <span className={clsx("font-mono tracking-tight tabular-nums relative z-10", textColor, textSize)}>
        {formatTime(seconds)}
      </span>
      {totalSeconds && (
         <span className="text-slate-500 text-xs mt-1 z-10">
            sur {formatTime(totalSeconds)}
         </span>
      )}

      {/* Subtle background progress fill */}
      {showProgress && (
        <div 
            className="absolute bottom-0 left-0 h-1.5 bg-current opacity-30 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%`, color: color === 'danger' ? '#ef4444' : '#3b82f6' }}
        />
      )}
    </div>
  );
};

export default TimerDisplay;
