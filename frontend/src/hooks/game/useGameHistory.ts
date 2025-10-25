import { useState, useCallback } from 'react';

interface GameHistoryEntry {
  message: string;
  timestamp: Date;
  type: 'game' | 'phase' | 'team' | 'victory' | 'guess';
}

export const useGameHistory = () => {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);

  const addHistoryEntry = useCallback((message: string, type: GameHistoryEntry['type']) => {
    setHistory((prev) => [
      ...prev,
      {
        message,
        timestamp: new Date(),
        type,
      },
    ]);
  }, []);

  const gameStarted = useCallback(() => {
    addHistoryEntry('Nouvelle partie démarrée ! GL HF', 'game');
  }, [addHistoryEntry]);

  const phaseStarted = useCallback(
    (phase: number) => {
      addHistoryEntry(`Début de la phase ${phase}`, 'phase');
    },
    [addHistoryEntry]
  );

  const teamTurn = useCallback(
    (team: string, phase: number) => {
      addHistoryEntry(`Mise en attente pour la phase ${phase} - Sage ${team}`, 'team');
    },
    [addHistoryEntry]
  );

  const orationStarted = useCallback(
    (team: string) => {
      addHistoryEntry(`Le sage ${team} a commencé son oration`, 'team');
    },
    [addHistoryEntry]
  );

  const roundEnded = useCallback(
    (points: { red: number; blue: number }, isEqual: boolean) => {
      if (isEqual) {
        addHistoryEntry("Fin de la manche, égalité partout, personne n'a de point", 'game');
      } else {
        const winner = points.red > points.blue ? 'rouge' : 'bleu';
        addHistoryEntry(
          `Fin de la manche, ${Math.abs(points.red - points.blue)} points remportés par l'équipe ${winner}`,
          'game'
        );
      }
    },
    [addHistoryEntry]
  );

  const gameEnded = useCallback(
    (winner: string) => {
      addHistoryEntry(`Bravo l'équipe ${winner}`, 'victory');
    },
    [addHistoryEntry]
  );

  const guessAttempted = useCallback(
    (team: string, word: string, isCorrect: boolean) => {
      if (isCorrect) {
        addHistoryEntry(`L'équipe ${team} a trouvé le mot "${word}" !`, 'guess');
      } else {
        addHistoryEntry(`L'équipe ${team} a proposé "${word}"`, 'guess');
      }
    },
    [addHistoryEntry]
  );

  return {
    history,
    addHistoryEntry,
    gameStarted,
    phaseStarted,
    teamTurn,
    orationStarted,
    roundEnded,
    gameEnded,
    guessAttempted,
  };
};
