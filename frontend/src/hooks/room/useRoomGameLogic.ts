// --------------------------------------------------
// 🎮 useRoomGameLogic.ts — Logique de jeu multijoueur Kensho
// --------------------------------------------------
// Gère : progression du jeu (rounds, scores, phases, winner, reset, timer)
// --------------------------------------------------

import { useState, useCallback, useEffect } from "react";
import { useSocketContext } from "@/components/SocketContext";
import { useGameTimer } from "@/hooks/game/useGameTimer";
import { GameState, GameParameters } from "@/types/game";

// --------------------------------------------------
// ⚙️ Constantes globales
// --------------------------------------------------
const PHASE_NAMES = ["En attente", "Choix du mot", "Mots interdits", "Oratoire"] as const;

// --------------------------------------------------
// 🧩 État par défaut du jeu
// --------------------------------------------------
export const defaultGameState: GameState = {
  isPlaying: false,
  winner: null,
  currentRound: {
    index: 0,
    phases: [],
    currentPhase: { index: 0 as const, name: "En attente", status: "En attente" },
    redTeamWord: "",
    blueTeamWord: "",
    redTeamForbiddenWords: [] as string[],
    blueTeamForbiddenWords: [] as string[],
  },
  scores: { red: 0, blue: 0 },
  remainingGuesses: 3,
};

// --------------------------------------------------
// 🧠 Hook principal
// --------------------------------------------------
export function useRoomGameLogic(roomCode?: string, gameParameters?: GameParameters) {
  const { socket } = useSocketContext();
  const [gameState, setGameState] = useState<GameState>(defaultGameState);

  // 🕒 Timer intégré basé sur les paramètres
  const timer = useGameTimer({
    phase1Duration: gameParameters?.ParametersTimeFirst ?? 60,
    phase2Duration: gameParameters?.ParametersTimeSecond ?? 45,
    phase3Duration: gameParameters?.ParametersTimeThird ?? 30,
  });

  // --------------------------------------------------
  // ▶️ Démarrer une nouvelle partie
  // --------------------------------------------------
  const startGame = useCallback(() => {
    if (!socket || !roomCode) return;

    // Reset du timer et démarrage de la première phase
    timer.resetTimer();
    timer.startTimer(1);

    const newState: GameState = {
      ...defaultGameState,
      isPlaying: true,
      winner: null,
      currentRound: {
        ...defaultGameState.currentRound,
        index: 1,
        currentPhase: {
          index: 1 as const,
          name: PHASE_NAMES[1],
          status: "En cours",
        },
      },
    };

    setGameState(newState);
    socket.emit("gameStateUpdate", { roomCode, gameState: newState });
  }, [socket, roomCode, timer]);

  // --------------------------------------------------
  // ⏸️ Mettre en pause le jeu
  // --------------------------------------------------
  const pauseGame = useCallback(() => {
    timer.pauseTimer();
    setGameState((prev) => ({ ...prev, isPlaying: false }));
  }, [timer]);

  // --------------------------------------------------
  // 🧮 Mettre à jour le score
  // --------------------------------------------------
  const updateScore = useCallback(
    (team: "red" | "blue") => {
      if (!socket || !roomCode) return;

      setGameState((prev) => {
        const newScores = {
          red: team === "red" ? prev.scores.red + 1 : prev.scores.red,
          blue: team === "blue" ? prev.scores.blue + 1 : prev.scores.blue,
        };

        const maxScore = gameParameters?.ParametersPointsMaxScore ?? 5;

        let winner: "red" | "blue" | "tie" | null = null;
        if (newScores.red >= maxScore && newScores.blue >= maxScore) winner = "tie";
        else if (newScores.red >= maxScore) winner = "red";
        else if (newScores.blue >= maxScore) winner = "blue";

        const nextPhaseIndex = ((prev.currentRound.currentPhase.index + 1) %
          4) as 0 | 1 | 2 | 3;

        const newState: GameState = winner
          ? {
              ...prev,
              isPlaying: false,
              winner,
            }
          : {
              ...prev,
              scores: newScores,
              currentRound: {
                ...prev.currentRound,
                index: prev.currentRound.index + 1,
                currentPhase: {
                  index: nextPhaseIndex,
                  name: PHASE_NAMES[nextPhaseIndex],
                  status: "En cours",
                },
              },
            };

        socket.emit("gameStateUpdate", { roomCode, gameState: newState });
        return newState;
      });
    },
    [socket, roomCode, gameParameters]
  );

  // --------------------------------------------------
  // 🔁 Réinitialiser complètement le jeu
  // --------------------------------------------------
  const resetGame = useCallback(() => {
    if (!socket || !roomCode) return;

    console.log("♻️ Réinitialisation du jeu");
    timer.resetTimer();

    const newState = { ...defaultGameState };
    setGameState(newState);
    socket.emit("gameStateUpdate", { roomCode, gameState: newState });
  }, [socket, roomCode, timer]);

  // --------------------------------------------------
  // 🛰️ Synchronisation avec le serveur
  // --------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    socket.off("gameStateUpdate").on("gameStateUpdate", (serverState: GameState) => {
      console.log("📡 gameStateUpdate reçu →", serverState);
      setGameState(serverState);
    });

    return () => {
      socket.off("gameStateUpdate");
    };
  }, [socket]);

  // --------------------------------------------------
  // 🔙 Retour du hook
  // --------------------------------------------------
  return {
    gameState,
    startGame,
    pauseGame,
    updateScore,
    resetGame,
    timer, // ⏱️ utilisé dans RoomCreated
  };
}
