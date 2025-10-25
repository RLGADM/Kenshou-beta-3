import { useState, useCallback } from 'react';

interface GamePhase {
  index: 1 | 2 | 3;
  status: 'waiting' | 'in-progress' | 'finished';
}

interface GameRound {
  index: number;
  currentPhase: GamePhase;
  redTeamWord?: string;
  blueTeamWord?: string;
  redTeamForbiddenWords: string[];
  blueTeamForbiddenWords: string[];
}

interface GameState {
  isPlaying: boolean;
  currentRound: GameRound;
  scores: {
    red: number;
    blue: number;
  };
  currentTeam: 'red' | 'blue';
  remainingGuesses: number;
  isPaused: boolean;
}

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

const initialGameRound: GameRound = {
  index: 1,
  currentPhase: {
    index: 1,
    status: 'waiting',
  },
  redTeamForbiddenWords: [],
  blueTeamForbiddenWords: [],
};

const initialGameState: GameState = {
  isPlaying: false,
  currentRound: initialGameRound,
  scores: {
    red: 0,
    blue: 0,
  },
  currentTeam: 'red',
  remainingGuesses: 5,
  isPaused: false,
};

export const useGameState = (params: GameStateParams) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const startGame = useCallback(() => {
    setGameState({
      ...initialGameState,
      isPlaying: true,
      remainingGuesses: params.maxGuesses,
    });
  }, [params.maxGuesses]);

  const startPhase = useCallback((phase: 1 | 2 | 3) => {
    setGameState((prev: GameState) => ({
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
    setGameState((prev: GameState) => ({ ...prev, isPaused: true }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState((prev: GameState) => ({ ...prev, isPaused: false }));
  }, []);

  const addPoint = useCallback((team: 'red' | 'blue') => {
    setGameState((prev: GameState) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [team]: prev.scores[team] + 1,
      },
    }));
  }, []);

  const nextTeam = useCallback(() => {
    setGameState((prev: GameState) => ({
      ...prev,
      currentTeam: prev.currentTeam === 'red' ? 'blue' : 'red',
      remainingGuesses: params.maxGuesses,
    }));
  }, [params.maxGuesses]);

  const nextRound = useCallback(() => {
    setGameState((prev: GameState) => ({
      ...prev,
      currentRound: {
        index: prev.currentRound.index + 1,
        currentPhase: {
          index: 1,
          status: 'waiting',
        },
        redTeamForbiddenWords: [],
        blueTeamForbiddenWords: [],
      },
      currentTeam: 'red',
      remainingGuesses: params.maxGuesses,
    }));
  }, [params.maxGuesses]);

  const setWord = useCallback((team: 'red' | 'blue', word: string) => {
    setGameState((prev: GameState) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        [team === 'red' ? 'redTeamWord' : 'blueTeamWord']: word,
      },
    }));
  }, []);

  const addForbiddenWord = useCallback(
    (team: 'red' | 'blue', word: string) => {
      setGameState((prev: GameState) => {
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
    setGameState((prev: GameState) => {
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
    setGameState((prev: GameState) => ({
      ...prev,
      remainingGuesses: Math.max(0, prev.remainingGuesses - 1),
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
  };
};
