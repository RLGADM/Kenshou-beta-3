import { useCallback, useState } from 'react';
// import a simple words list to pick random words for phase 1 (dev fallback)
import wordsFacileRaw from '../../Words/facile.txt?raw';
import { toast } from 'react-hot-toast';
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
    finishPhase,
    tryConsumeReroll,
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

  // Gestion des votes par équipe
  const [teamVotes, setTeamVotes] = useState<{
    red: { [userId: string]: 'accept' | 'reject' };
    blue: { [userId: string]: 'accept' | 'reject' };
  }>({ red: {}, blue: {} });

  const { timerState, startTimer, pauseTimer, resumeTimer, resetTimer, getCurrentTime } = useGameTimer({
    phase1Duration: parameters.ParametersTimeFirst,
    phase2Duration: parameters.ParametersTimeSecond,
    phase3Duration: parameters.ParametersTimeThird,
  });

  const {
    history,
    addHistoryEntry,
    gameStarted,
    phaseStarted,
    teamTurn,
    orationStarted,
    roundEnded,
    gameEnded,
    guessAttempted,
  } = useGameHistory();

  const handleGameStart = useCallback(() => {
    startGame();
    resetTimer();
    // pick random words for each team (client-side fallback)
    try {
      const lines = (wordsFacileRaw || '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 0) {
        const redWord = lines[Math.floor(Math.random() * lines.length)];
        let blueWord = lines[Math.floor(Math.random() * lines.length)];
        // ensure different words
        if (blueWord === redWord && lines.length > 1) {
          blueWord = lines.find((w) => w !== redWord) || blueWord;
        }
        setWord('red', redWord);
        setWord('blue', blueWord);
      }
    } catch (e) {
      console.warn('Failed to pick random words for phase 1', e);
    }
    // mark phase 1 as started so UI modals appear
    startPhase(1);
    startTimer(1);
    gameStarted();
  }, [startGame, resetTimer, startTimer, gameStarted]);

  const handlePhaseProceed = useCallback(() => {
    const currentPhaseIndex = gameState.currentRound?.currentPhase?.index ?? 1;

    const nextPhase = currentPhaseIndex < 3 ? ((currentPhaseIndex + 1) as 1 | 2 | 3) : null;

    if (nextPhase) {
      startPhase(nextPhase);
      startTimer(nextPhase);
      phaseStarted(nextPhase);

      if (nextPhase === 3) {
        teamTurn(gameState.currentTeam, 3);
      }
    } else {
      // Fin de la manche
      const hasRedPoint = gameState.scores.red > 0;
      const hasBluePoint = gameState.scores.blue > 0;
      roundEnded(gameState.scores, hasRedPoint && hasBluePoint);
    }
  }, [gameState, startPhase, startTimer, phaseStarted, teamTurn, roundEnded]);

  const handlePhaseTimeout = useCallback(() => {
    if (!timerState.isRunning) return;
    handlePhaseProceed();
  }, [timerState.isRunning, handlePhaseProceed]);

  const handleGuess = useCallback(
    (word: string) => {
      decrementGuesses();
      const targetWord =
        gameState.currentTeam === 'red' ? gameState.currentRound.redTeamWord : gameState.currentRound.blueTeamWord;

      guessAttempted(gameState.currentTeam, word, word === targetWord);

      if (word === targetWord) {
        addPoint(gameState.currentTeam);
        handlePhaseProceed();
      } else if (gameState.remainingGuesses === 0) {
        // Plus de tentatives disponibles
        handlePhaseProceed();
      }
    },
    [gameState, decrementGuesses, guessAttempted, addPoint, handlePhaseProceed]
  );

  // Vérifie le consensus de l'équipe (positif ou négatif)
  const checkTeamConsensus = useCallback(
    (team: 'red' | 'blue', voteType: 'accept' | 'reject') => {
      // On récupère les votes de l'équipe actuelle
      const currentTeamVotes = teamVotes[team];
      if (!currentTeamVotes) return false;

      // Compter les votes du type demandé
      const votes = Object.values(currentTeamVotes);
      const targetVotes = votes.filter((v) => v === voteType).length;
      const totalVotes = votes.length;

      // Il faut au moins 2 votes (pour éviter qu'un seul joueur puisse valider)
      return totalVotes >= 2 && targetVotes === totalVotes;
    },
    [teamVotes]
  );

  // Ajoute un vote pour un joueur
  const handleVote = useCallback(
    (team: 'red' | 'blue', userId: string, vote: 'accept' | 'reject') => {
      setTeamVotes((prev) => ({
        ...prev,
        [team]: { ...prev[team], [userId]: vote },
      }));

      if (vote === 'accept') {
        addHistoryEntry?.(`Un membre de l'équipe ${team} a accepté le mot`, 'team');
        if (checkTeamConsensus(team, 'accept')) {
          addHistoryEntry?.(`L'équipe ${team} a validé son mot à l'unanimité !`, 'team');
          // On passe à la phase suivante seulement si le mot a été validé à l'unanimité
          finishPhase();
        }
      } else {
        addHistoryEntry?.(`Un membre de l'équipe ${team} a refusé le mot`, 'team');
        if (checkTeamConsensus(team, 'reject')) {
          addHistoryEntry?.(`L'équipe ${team} a refusé le mot à l'unanimité !`, 'team');
          try {
            // On tente un reroll automatique si toute l'équipe a refusé
            if (tryConsumeReroll(team)) {
              const lines = (wordsFacileRaw || '')
                .split(/\r?\n/)
                .map((l) => l.trim())
                .filter(Boolean);
              if (lines.length > 0) {
                const newWord = lines[Math.floor(Math.random() * lines.length)];
                setWord(team, newWord);
                addHistoryEntry?.(`Nouveau mot proposé pour l'équipe ${team}`, 'team');
                // Réinitialiser les votes pour le nouveau mot
                setTeamVotes((prev) => ({
                  ...prev,
                  [team]: {},
                }));
              }
            } else {
              addHistoryEntry?.(`Plus de rerolls disponibles pour l'équipe ${team}`, 'team');
            }
          } catch (e) {
            console.warn('Automatic reroll failed', e);
            addHistoryEntry?.(`Erreur lors du reroll automatique pour l'équipe ${team}`, 'team');
          }
        }
      }
    },
    [addHistoryEntry, checkTeamConsensus]
  );

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
      setWord,
      addForbiddenWord,
      removeForbiddenWord,
      handleGuess,
      handleVote,
      // expose helper to proceed to next phase (useful after accepting a word)
      proceedPhase: handlePhaseProceed,
      // allow client-side reroll (pick a new random word for given team)
      // return the picked word or null if not allowed
      rerollWord: (team: 'red' | 'blue', currentCandidate?: string): string | null => {
        try {
          if (!tryConsumeReroll(team)) {
            addHistoryEntry?.(`L'équipe ${team} n'a plus de rerolls disponibles`, 'team');
            return null;
          }

          const lines = (wordsFacileRaw || '')
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
          if (lines.length === 0) return null;

          let pick = lines[Math.floor(Math.random() * lines.length)];
          const teamWordCurrent =
            team === 'red' ? gameState.currentRound.redTeamWord : gameState.currentRound.blueTeamWord;

          // Éviter les doublons
          if (lines.length > 1) {
            let attempts = 0;
            const usedWords = new Set([teamWordCurrent, currentCandidate].filter(Boolean));
            while (usedWords.has(pick) && attempts < 10) {
              pick = lines[Math.floor(Math.random() * lines.length)];
              attempts += 1;
            }
          }

          addHistoryEntry?.(`L'équipe ${team} a demandé un reroll — nouveau mot proposé`, 'team');
          return pick;
        } catch (e) {
          console.warn('rerollWord failed', e);
          return null;
        }
      },
      // allow closing the modal without advancing
      finishPhase: () => {
        try {
          finishPhase();
        } catch (e) {
          console.warn('finishPhase failed', e);
        }
      },
    },
    timer: {
      getCurrentTime,
      pauseTimer,
      resumeTimer,
    },
  };
};
