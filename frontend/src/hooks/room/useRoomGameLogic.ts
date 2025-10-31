// --------------------------------------------------
// 🎮 useRoomGameLogic — Gestion complète de la logique du jeu Kensho
// --------------------------------------------------

import { useCallback } from 'react';
import { useGameState } from '../game/useGameState';
import { useGameTimer } from '../game/useGameTimer';
import { useGameHistory } from '../game/useGameHistory';
import type { GameParameters } from '@/types/game';

// --------------------------------------------------
// 🔹 Hook principal
// --------------------------------------------------
export const useRoomGameLogic = (parameters: GameParameters) => {
  // --- État principal du jeu ---
  const {
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
  } = useGameState({ parameters });

  // --- Timers de phase ---
  const { timerState, startTimer, pauseTimer, resumeTimer, resetTimer, getCurrentTime } = useGameTimer({
    phase1Duration: parameters.ParametersTimeFirst,
    phase2Duration: parameters.ParametersTimeSecond,
    phase3Duration: parameters.ParametersTimeThird,
  });

  // --- Historique du jeu ---
  const { history, gameStarted, phaseStarted, roundEnded, guessAttempted } = useGameHistory();

  // --------------------------------------------------
  // 🚀 Démarrage du jeu
  // --------------------------------------------------
  const handleGameStart = useCallback(() => {
    startGame();
    resetTimer();
    startTimer(1);
    gameStarted();
  }, [startGame, resetTimer, startTimer, gameStarted]);

  // --------------------------------------------------
  // ⏩ Avancer à la phase suivante
  // --------------------------------------------------
  const handlePhaseProceed = useCallback(() => {
    const currentPhase = gameState.currentRound.currentPhase.index;
    const nextPhase = currentPhase < 3 ? ((currentPhase + 1) as 1 | 2 | 3) : null;

    if (nextPhase) {
      startPhase(nextPhase);
      startTimer(nextPhase);
      phaseStarted(nextPhase);
    } else {
      // Fin du round → attribution de points
      const { redTeamWord, blueTeamWord } = gameState.currentRound;

      const redFound = !!redTeamWord;
      const blueFound = !!blueTeamWord;

      if (parameters.ParametersPointsRules === 'tie' && redFound && blueFound) {
        // Mode égalité : si les deux trouvent, pas de point
        roundEnded(gameState.scores, true);
      } else {
        if (redFound) addPoint('red');
        if (blueFound) addPoint('blue');
        roundEnded(gameState.scores, false);
      }

      nextRound();
    }
  }, [gameState, parameters, startPhase, startTimer, phaseStarted, roundEnded, addPoint, nextRound]);

  // --------------------------------------------------
  // 💬 Gestion des propositions de mots (phase 3)
  // --------------------------------------------------
  const handleGuess = useCallback(
    (word: string) => {
      const { currentRound, remainingGuesses } = gameState;
      const targetWord =
        gameState.currentRound.currentPhase.index === 3
          ? gameState.currentRound.redTeamWord || gameState.currentRound.blueTeamWord
          : '';

      decrementGuesses();
      guessAttempted('disciple', word, word === targetWord);

      if (word === targetWord) {
        handlePhaseProceed();
      } else if (remainingGuesses - 1 <= 0) {
        handlePhaseProceed();
      }
    },
    [gameState, decrementGuesses, guessAttempted, handlePhaseProceed]
  );

  // --------------------------------------------------
  // 🧮 Vérifie la fin du jeu (max score atteint)
  // --------------------------------------------------
  const checkGameOver = useCallback(() => {
    const maxScore = parameters.ParametersPointsMaxScore;
    return gameState.scores.red >= maxScore || gameState.scores.blue >= maxScore;
  }, [gameState.scores, parameters.ParametersPointsMaxScore]);

  // --------------------------------------------------
  // 🧨 Réinitialiser la partie (mais garder les règles)
  // --------------------------------------------------
  const resetGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      currentRound: {
        index: 1,
        phases: [],
        currentPhase: { index: 0, name: 'En attente', status: 'En attente' },
        redTeamWord: '',
        blueTeamWord: '',
        redTeamForbiddenWords: [],
        blueTeamForbiddenWords: [],
      },
      scores: { red: 0, blue: 0 },
      remainingGuesses: parameters.ParametersTeamMaxPropositions,
    }));
    resetTimer();
  }, [setGameState, resetTimer, parameters]);

  // --------------------------------------------------
  // 🏁 Fin de partie (détermine le gagnant)
  // --------------------------------------------------
  const endGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      winner: prev.scores.red > prev.scores.blue ? 'red' : prev.scores.blue > prev.scores.red ? 'blue' : 'tie',
    }));
  }, [setGameState]);

  // --------------------------------------------------
  // 📦 Retour du hook
  // --------------------------------------------------
  return {
    gameState,
    timerState,
    history,
    actions: {
      startGame: handleGameStart,
      pauseGame,
      resumeGame,
      nextRound,
      setWord,
      addForbiddenWord,
      removeForbiddenWord,
      handleGuess,
      checkGameOver,
      resetToWaitingPhase,
      resetGame,
      endGame,
    },
    timer: {
      getCurrentTime,
      pauseTimer,
      resumeTimer,
      resetTimer,
    },
  };
};
