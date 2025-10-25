import { useState, useCallback } from 'react';
import { GameState, GameRound } from '@/types/game';

interface GameStateParams {
  maxScore: number;
  pointsOnTie: boolean;
  maxForbiddenWords: number;
  maxGuesses: number;
  maxPasses: number;
  timers: {
    phase1: number;
    phase2: number;
    phase3: number;
  };
}

const createInitialGameRound = (maxPasses: number): GameRound => ({
  index: 1,
  currentPhase: {
    index: 1,
    status: 'waiting',
  },
  redTeamForbiddenWords: [],
  blueTeamForbiddenWords: [],
  // passes left for rerolls per round
  redTeamPassesLeft: maxPasses,
  blueTeamPassesLeft: maxPasses,
});

const createInitialGameState = (maxPasses: number): GameState => ({
  isPlaying: false,
  currentRound: createInitialGameRound(maxPasses),
  scores: {
    red: 0,
    blue: 0,
  },
  currentTeam: 'red',
  remainingGuesses: 5,
  isPaused: false,
});

export const useGameState = (params: GameStateParams) => {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(params.maxPasses));

  const startGame = useCallback(() => {
    setGameState({
      ...createInitialGameState(params.maxPasses),
      isPlaying: true,
      remainingGuesses: params.maxGuesses,
    });
  }, [params.maxGuesses, params.maxPasses]);

  const startPhase = useCallback((phase: 1 | 2 | 3) => {
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        currentPhase: {
          index: phase,
          status: 'in-progress',
        },
      },
      isPaused: false,
    }));
  }, []);

  const pauseGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPaused: true, isPlaying: false }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPaused: false, isPlaying: true }));
  }, []);

  const addPoint = useCallback((team: 'red' | 'blue') => {
    setGameState((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [team]: prev.scores[team] + 1,
      },
    }));
  }, []);

  const nextTeam = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      currentTeam: prev.currentTeam === 'red' ? 'blue' : 'red',
      remainingGuesses: params.maxGuesses,
    }));
  }, [params.maxGuesses]);

  const nextRound = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        index: prev.currentRound.index + 1,
        currentPhase: {
          index: 1,
          status: 'waiting',
        },
        redTeamForbiddenWords: [],
        blueTeamForbiddenWords: [],
        redTeamPassesLeft: params.maxPasses,
        blueTeamPassesLeft: params.maxPasses,
      },
      currentTeam: 'red',
      remainingGuesses: params.maxGuesses,
    }));
  }, [params.maxGuesses]);

  const tryConsumeReroll = useCallback((team: 'red' | 'blue') => {
    let allowed = false;
    setGameState((prev) => {
      const key = team === 'red' ? 'redTeamPassesLeft' : 'blueTeamPassesLeft';
      const current = prev.currentRound[key as keyof typeof prev.currentRound] as number;

      // Vérifier si des rerolls sont disponibles
      if (current === undefined || current <= 0) {
        console.warn(`No rerolls left for team ${team}`);
        return prev;
      }

      allowed = true;
      return {
        ...prev,
        currentRound: {
          ...prev.currentRound,
          [key]: current - 1,
        },
      };
    });
    return allowed;
  }, []);

  const setWord = useCallback((team: 'red' | 'blue', word: string) => {
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        [team === 'red' ? 'redTeamWord' : 'blueTeamWord']: word,
      },
    }));
  }, []);

  const addForbiddenWord = useCallback(
    (team: 'red' | 'blue', word: string) => {
      setGameState((prev) => {
        const key = team === 'red' ? 'redTeamForbiddenWords' : 'blueTeamForbiddenWords';
        const currentWords = prev.currentRound[key];
        if (currentWords.length >= params.maxForbiddenWords) return prev;

        return {
          ...prev,
          currentRound: {
            ...prev.currentRound,
            [key]: [...currentWords, word],
          },
        };
      });
    },
    [params.maxForbiddenWords]
  );

  const removeForbiddenWord = useCallback((team: 'red' | 'blue', index: number) => {
    setGameState((prev) => {
      const key = team === 'red' ? 'redTeamForbiddenWords' : 'blueTeamForbiddenWords';
      return {
        ...prev,
        currentRound: {
          ...prev.currentRound,
          [key]: prev.currentRound[key].filter((_, i) => i !== index),
        },
      };
    });
  }, []);

  const decrementGuesses = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      remainingGuesses: Math.max(0, prev.remainingGuesses - 1),
    }));
  }, []);

  // Permet de remettre la phase en 'waiting' (fermer le modal sans avancer)
  const finishPhase = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        currentPhase: {
          index: prev.currentRound.currentPhase.index,
          status: 'waiting',
        },
      },
    }));
  }, []);

  return {
    gameState,
    startGame,
    startPhase,
    pauseGame,
    resumeGame,
    addPoint,
    nextTeam,
    nextRound,
    setWord,
    addForbiddenWord,
    removeForbiddenWord,
    decrementGuesses,
    finishPhase,
    tryConsumeReroll,
  };
};
