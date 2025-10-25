import { useCallback } from 'react';
import { useGameState } from '../game/useGameState';
import { useGameTimer } from '../game/useGameTimer';
import { useGameHistory } from '../game/useGameHistory';
import { GameParameters } from '@/types';

export const useRoomGameLogic = (parameters: GameParameters) => {
  const {
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
  } = useGameState({
    maxScore: parameters.ParametersPointsMaxScore,
    pointsOnTie: parameters.ParametersPointsRules === 'tie',
    maxForbiddenWords: parameters.ParametersTeamMaxForbiddenWords,
    maxGuesses: parameters.ParametersTeamMaxPropositions,
    maxPasses: parameters.ParametersTeamReroll,
    timers: {
      phase1: parameters.ParametersTimeFirst,
      phase2: parameters.ParametersTimeSecond,
      phase3: parameters.ParametersTimeThird,
    },
  });

  const { timerState, startTimer, pauseTimer, resumeTimer, resetTimer, getCurrentTime } = useGameTimer({
    phase1Duration: parameters.ParametersTimeFirst,
    phase2Duration: parameters.ParametersTimeSecond,
    phase3Duration: parameters.ParametersTimeThird,
  });

  const { history, gameStarted, phaseStarted, teamTurn, roundEnded, guessAttempted } = useGameHistory();

  const handleGameStart = useCallback(() => {
    startGame();
    resetTimer();
    startTimer(1);
    gameStarted();
  }, [startGame, resetTimer, startTimer, gameStarted]);

  const handlePhaseProceed = useCallback(() => {
    const currentPhase = gameState.currentRound.currentPhase.index;
    const nextPhase = currentPhase < 3 ? ((currentPhase + 1) as 1 | 2 | 3) : null;

    if (nextPhase) {
      startPhase(nextPhase);
      startTimer(nextPhase);
      phaseStarted(nextPhase);

      if (nextPhase === 3) {
        teamTurn(gameState.currentTeam, 3);
      }
    } else {
      // Fin de la manche
      const redTeamGuessed = gameState.currentRound.redTeamWord !== undefined;
      const blueTeamGuessed = gameState.currentRound.blueTeamWord !== undefined;

      if (parameters.ParametersPointsRules === 'tie' && redTeamGuessed && blueTeamGuessed) {
        // En mode égalité, si les deux équipes ont trouvé leur mot, personne ne gagne de point
        roundEnded(gameState.scores, true);
      } else {
        if (redTeamGuessed) addPoint('red');
        if (blueTeamGuessed) addPoint('blue');
        roundEnded(gameState.scores, false);
      }
    }
  }, [
    gameState,
    parameters.ParametersPointsRules,
    startPhase,
    startTimer,
    phaseStarted,
    teamTurn,
    roundEnded,
    addPoint,
  ]);

  const handleGuess = useCallback(
    (word: string) => {
      const currentTeam = gameState.currentTeam;
      const targetWord =
        currentTeam === 'red' ? gameState.currentRound.redTeamWord : gameState.currentRound.blueTeamWord;

      decrementGuesses();
      guessAttempted(currentTeam, word, word === targetWord);

      if (word === targetWord) {
        setWord(currentTeam, word);
        handlePhaseProceed();
      } else if (gameState.remainingGuesses === 0) {
        // Plus de tentatives disponibles
        handlePhaseProceed();
      }
    },
    [gameState, decrementGuesses, guessAttempted, setWord, handlePhaseProceed]
  );

  const checkGameOver = useCallback(() => {
    const maxScore = parameters.ParametersPointsMaxScore;
    return gameState.scores.red >= maxScore || gameState.scores.blue >= maxScore;
  }, [gameState.scores, parameters.ParametersPointsMaxScore]);

  return {
    gameState,
    timerState,
    history,
    actions: {
      startGame: handleGameStart,
      pauseGame,
      resumeGame,
      nextTeam,
      nextRound,
      setWord: (team: 'red' | 'blue', word: string) => setWord(team, word),
      addForbiddenWord: (team: 'red' | 'blue', word: string) => addForbiddenWord(team, word),
      removeForbiddenWord: (team: 'red' | 'blue', index: number) => removeForbiddenWord(team, index),
      handleGuess,
      checkGameOver,
    },
    timer: {
      getCurrentTime,
      pauseTimer,
      resumeTimer,
    },
  };
};
