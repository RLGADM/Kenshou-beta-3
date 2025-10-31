import { useState, useCallback } from 'react';
import type { GameParameters, GameRound, GameState } from '@/types/game';
import { getDefaultParameters } from '@/utils/defaultParameters';

// --------------------------------------------------
// 🧠 Création du round initial
// --------------------------------------------------
const createInitialGameRound = (): GameRound => ({
  index: 1,
  phases: [], // tu pourras y insérer les 3 phases si besoin plus tard
  currentPhase: { index: 0, name: 'En attente', status: 'En attente' },
  redTeamWord: '', // ✅ obligatoire maintenant
  blueTeamWord: '', // ✅ idem
  redTeamForbiddenWords: [],
  blueTeamForbiddenWords: [],
});

// --------------------------------------------------
// ⚙️ Création de l’état initial du jeu
// --------------------------------------------------
const createInitialGameState = (parameters: GameParameters): GameState => ({
  isPlaying: false,
  currentRound: createInitialGameRound(),
  scores: { red: 0, blue: 0 },
  remainingGuesses: parameters.ParametersTeamMaxPropositions,
  winner: undefined,
});

// --------------------------------------------------
// 🪄 Hook principal : useGameState
// --------------------------------------------------
export const useGameState = (params?: { parameters?: GameParameters }) => {
  const parameters = params?.parameters ?? getDefaultParameters();

  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(parameters));

  // --------------------------------------------------
  // 🎮 Fonctions principales
  // --------------------------------------------------

  // 🔸 Démarrage complet d’une partie
  const startGame = useCallback(() => {
    setGameState(createInitialGameState(parameters));
  }, [parameters]);

  // 🔸 Démarrage d’une phase (1 à 3)
  const startPhase = useCallback((phase: 1 | 2 | 3) => {
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        currentPhase: { index: phase, name: getPhaseName(phase), status: 'En cours' },
      },
      isPlaying: true,
    }));
  }, []);

  // 🔸 Pause / Reprise
  const pauseGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  // 🔸 Ajouter un point
  const addPoint = useCallback((team: 'red' | 'blue') => {
    setGameState((prev) => ({
      ...prev,
      scores: { ...prev.scores, [team]: prev.scores[team] + 1 },
    }));
  }, []);

  // 🔸 Passer au round suivant
  const nextRound = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      currentRound: {
        index: prev.currentRound.index + 1,
        phases: [],
        currentPhase: { index: 0, name: 'En attente', status: 'En attente' },
        redTeamWord: '',
        blueTeamWord: '',
        redTeamForbiddenWords: [],
        blueTeamForbiddenWords: [],
      },
      remainingGuesses: parameters.ParametersTeamMaxPropositions,
    }));
  }, [parameters]);

  // 🔸 Définir le mot choisi par une équipe
  const setWord = useCallback((team: 'red' | 'blue', word: string) => {
    setGameState((prev) => ({
      ...prev,
      currentRound: { ...prev.currentRound, [`${team}TeamWord`]: word } as GameRound,
    }));
  }, []);

  // 🔸 Ajouter un mot interdit
  const addForbiddenWord = useCallback(
    (team: 'red' | 'blue', word: string) => {
      setGameState((prev) => {
        const key = team === 'red' ? 'redTeamForbiddenWords' : 'blueTeamForbiddenWords';
        const currentWords = prev.currentRound[key];
        if (currentWords.length >= parameters.ParametersTeamMaxForbiddenWords) return prev;
        return {
          ...prev,
          currentRound: {
            ...prev.currentRound,
            [key]: [...currentWords, word],
          },
        };
      });
    },
    [parameters]
  );

  // 🔸 Supprimer un mot interdit
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

  // 🔸 Décrémenter les essais restants (phase 3)
  const decrementGuesses = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      remainingGuesses: Math.max(0, prev.remainingGuesses - 1),
    }));
  }, []);

  // 🔸 Réinitialiser la partie
  const resetToWaitingPhase = useCallback(() => {
    setGameState((prev) => ({
      ...createInitialGameState(parameters),
      scores: prev.scores, // garde les scores existants
    }));
  }, [parameters]);

  // --------------------------------------------------
  // 🧩 Helper : nom de phase lisible
  // --------------------------------------------------
  const getPhaseName = (phase: 1 | 2 | 3): GameRound['currentPhase']['name'] => {
    switch (phase) {
      case 1:
        return 'Choix du mot';
      case 2:
        return 'Mots interdits';
      case 3:
        return 'Oratoire';
      default:
        return 'En attente';
    }
  };

  // --------------------------------------------------
  // 🎯 Retour
  // --------------------------------------------------
  return {
    gameState,
    setGameState,
    startGame,
    startPhase,
    pauseGame,
    resumeGame,
    addPoint,
    nextRound,
    setWord,
    addForbiddenWord,
    removeForbiddenWord,
    decrementGuesses,
    resetToWaitingPhase,
  };
};
