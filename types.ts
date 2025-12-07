export interface Slide {
  id: string;
  number: number;
  title: string;
  durationSeconds: number; // Planned duration
}

export enum AppMode {
  SETUP = 'SETUP',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export interface PresentationState {
  currentSlideIndex: number;
  startTime: number | null; // Timestamp
  pausedAt: number | null; // Timestamp
  totalPausedTime: number; // Accumulated paused duration in ms
  elapsedGlobalTime: number; // Seconds (derived for UI)
}
