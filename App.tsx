import React, { useState, useEffect, useRef } from 'react';
import { Slide, AppMode, PresentationState } from './types';
import SetupView from './components/SetupView';
import RunningView from './components/RunningView';
import { DEFAULT_SLIDE_COUNT, DEFAULT_TOTAL_TIME_MINUTES } from './constants';

const App = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SETUP);
  const [slides, setSlides] = useState<Slide[]>([]);
  
  // Initialize default slides for setup if none exist
  useEffect(() => {
    const initialSlides = Array.from({ length: DEFAULT_SLIDE_COUNT }).map((_, i) => ({
      id: crypto.randomUUID(),
      number: i + 1,
      title: `Diapositive ${i + 1}`,
      durationSeconds: (DEFAULT_TOTAL_TIME_MINUTES * 60) / DEFAULT_SLIDE_COUNT
    }));
    setSlides(initialSlides);
  }, []);

  const [state, setState] = useState<PresentationState>({
    currentSlideIndex: 0,
    startTime: null,
    pausedAt: null,
    totalPausedTime: 0,
    elapsedGlobalTime: 0
  });

  const timerRef = useRef<number | null>(null);

  const startPresentation = (configuredSlides: Slide[]) => {
    setSlides(configuredSlides);
    setMode(AppMode.RUNNING);
    setState({
      currentSlideIndex: 0,
      startTime: Date.now(),
      pausedAt: null,
      totalPausedTime: 0,
      elapsedGlobalTime: 0
    });
  };

  const togglePause = () => {
    if (mode === AppMode.RUNNING) {
      setMode(AppMode.PAUSED);
      setState(prev => ({ ...prev, pausedAt: Date.now() }));
    } else if (mode === AppMode.PAUSED) {
      setMode(AppMode.RUNNING);
      const pauseDuration = Date.now() - (state.pausedAt || Date.now());
      setState(prev => ({
        ...prev,
        pausedAt: null,
        totalPausedTime: prev.totalPausedTime + pauseDuration
      }));
    }
  };

  const stopPresentation = () => {
    setMode(AppMode.SETUP);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const changeSlide = (delta: number) => {
    setState(prev => {
      const newIndex = Math.max(0, Math.min(slides.length - 1, prev.currentSlideIndex + delta));
      return { ...prev, currentSlideIndex: newIndex };
    });
  };

  // Timer loop
  useEffect(() => {
    if (mode === AppMode.RUNNING) {
      timerRef.current = window.setInterval(() => {
        setState(prev => {
          if (!prev.startTime) return prev;
          const now = Date.now();
          const elapsedMS = now - prev.startTime - prev.totalPausedTime;
          return {
            ...prev,
            elapsedGlobalTime: elapsedMS / 1000
          };
        });
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {mode === AppMode.SETUP && (
        <SetupView initialSlides={slides} onStart={startPresentation} />
      )}
      {(mode === AppMode.RUNNING || mode === AppMode.PAUSED) && (
        <RunningView 
          slides={slides} 
          state={state} 
          mode={mode}
          onTogglePause={togglePause}
          onStop={stopPresentation}
          onChangeSlide={changeSlide}
        />
      )}
    </div>
  );
};

export default App;