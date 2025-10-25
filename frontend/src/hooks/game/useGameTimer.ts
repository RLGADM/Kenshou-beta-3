import { useState, useEffect, useCallback } from 'react';

interface TimerState {
  phase1: number;
  phase2: number;
  phase3: number;
  currentPhase: 1 | 2 | 3 | null;
  isRunning: boolean;
}

interface TimerParameters {
  phase1Duration: number;
  phase2Duration: number;
  phase3Duration: number;
}

export const useGameTimer = (params: TimerParameters) => {
  const [timerState, setTimerState] = useState<TimerState>({
    phase1: params.phase1Duration,
    phase2: params.phase2Duration,
    phase3: params.phase3Duration,
    currentPhase: null,
    isRunning: false,
  });

  const startTimer = useCallback(
    (phase: 1 | 2 | 3) => {
      setTimerState((prev) => ({
        ...prev,
        currentPhase: phase,
        isRunning: true,
        phase1: phase === 1 ? params.phase1Duration : prev.phase1,
        phase2: phase === 2 ? params.phase2Duration : prev.phase2,
        phase3: phase === 3 ? params.phase3Duration : prev.phase3,
      }));
    },
    [params]
  );

  const pauseTimer = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const resetTimer = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      phase1: params.phase1Duration,
      phase2: params.phase2Duration,
      phase3: params.phase3Duration,
      currentPhase: null,
      isRunning: false,
    }));
  }, [params]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerState.isRunning && timerState.currentPhase) {
      interval = setInterval(() => {
        setTimerState((prev) => {
          const phaseKey = `phase${prev.currentPhase}` as keyof Pick<TimerState, 'phase1' | 'phase2' | 'phase3'>;
          const newTime = prev[phaseKey] - 1;

          if (newTime <= 0) {
            if (interval) clearInterval(interval);
            return {
              ...prev,
              [phaseKey]: 0,
              isRunning: false,
            };
          }

          return {
            ...prev,
            [phaseKey]: newTime,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isRunning, timerState.currentPhase]);

  const getCurrentTime = useCallback(() => {
    if (!timerState.currentPhase) return 0;
    const phaseKey = `phase${timerState.currentPhase}` as keyof Pick<TimerState, 'phase1' | 'phase2' | 'phase3'>;
    return timerState[phaseKey];
  }, [timerState]);

  return {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    getCurrentTime,
  };
};
