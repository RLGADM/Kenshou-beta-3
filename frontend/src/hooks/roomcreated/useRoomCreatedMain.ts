// --------------------------------------------------
// 🧩 useRoomCreatedMain — Logique principale d’une salle de jeu Kensho
// --------------------------------------------------

import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { useSocketContext } from '@/components/SocketContext';
import { useRoomEvents } from '@/hooks/app/useRoomEvents';
import { useGameState } from '@/hooks/game/useGameState';
import { getDefaultParameters } from '@/utils/defaultParameters';
import type { GameParameters, User } from '@/types';

// 🚫 ❌ supprime cette ligne !
// const { inRoom, setInRoom, currentRoom } = useRoomEvents();

// --------------------------------------------------
// 🔹 Hook principal
// --------------------------------------------------
export function useRoomCreatedMain() {
  const navigate = useNavigate();
  const { socket } = useSocketContext();
  const { inRoom, setInRoom, currentRoom } = useRoomEvents(); // ✅ ici c’est bon (dans un hook)

  // --- États internes ---
  const [proposal, setProposal] = useState('');
  const [copied, setCopied] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // --- Paramètres du jeu ---
  const gameParameters: GameParameters = currentRoom?.gameParameters ?? getDefaultParameters();

  // --- Logique du jeu ---
  const {
    gameState,
    startGame: baseStartGame,
    pauseGame: basePauseGame,
    resetToWaitingPhase,
  } = useGameState({ parameters: gameParameters });

  // --------------------------------------------------
  // 🚪 Quitter la salle proprement
  // --------------------------------------------------
  const handleLeaveRoom = useCallback(() => {
    if (!socket || !currentRoom) return;

    const roomCode = currentRoom.code;
    const userToken = localStorage.getItem("userToken");

    if (!roomCode || !userToken) {
      console.warn("⚠️ Impossible de quitter : roomCode ou userToken manquant");
      navigate("/");
      return;
    }

    console.log(`🚪 Demande de sortie → ${roomCode} (${userToken})`);

    socket.emit("leaveRoom", { roomCode, userToken });

    localStorage.setItem("hasLeftRoom", "true");
    localStorage.removeItem("lastRoomCode");
    localStorage.removeItem("roomCode");

    setInRoom(false);
    navigate("/");

    toast.success("Vous avez quitté la salle !");
  }, [socket, currentRoom, navigate, setInRoom]);

  // --------------------------------------------------
  // 🕹️ Contrôles du jeu
  // --------------------------------------------------
  const startGame = useCallback(() => {
    if (!socket || !currentRoom) return;

    if (gameState.isPlaying) {
      console.log('[Game] Déjà en cours');
      return;
    }

    console.log('[Game] ▶️ Start game');
    socket.emit('startGame', { roomCode: currentRoom.code });
    baseStartGame();
  }, [socket, currentRoom, baseStartGame, gameState.isPlaying]);

  const pauseGame = useCallback(() => {
    if (!socket || !currentRoom) return;
    console.log('[Game] ⏸ Pause');
    socket.emit('pauseGame', { roomCode: currentRoom.code });
    basePauseGame();
  }, [socket, currentRoom, basePauseGame]);

  const resetGame = useCallback(() => {
    if (!socket || !currentRoom) return;
    console.log('[Game] 🔁 Reset');
    socket.emit('resetGame', { roomCode: currentRoom.code });
    resetToWaitingPhase();
    setShowResetModal(false);
  }, [socket, currentRoom, resetToWaitingPhase]);

  // --------------------------------------------------
  // 💬 Gestion des propositions (phase 3)
  // --------------------------------------------------
  const sendProposal = useCallback(
    (text: string) => {
      if (!socket || !currentRoom || !text.trim()) return;
      socket.emit('sendProposal', { roomCode: currentRoom.code, text });
      setProposal('');
    },
    [socket, currentRoom]
  );

  // --------------------------------------------------
  // ⏱️ Format du timer (mm:ss)
  // --------------------------------------------------
  const formatTimer = useCallback((seconds: number): string => {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }, []);

  // --------------------------------------------------
  // 🔐 Permissions
  // --------------------------------------------------
  const currentUser = currentRoom?.users?.find((u: User) => u.isAdmin) ?? null;
  const permissions = { canStartGame: !!currentUser?.isAdmin };

  // --------------------------------------------------
  // 🔄 Gestion du reset modal
  // --------------------------------------------------
  const handleResetGame = useCallback(() => {
    if (!socket || !currentRoom) return;
    socket.emit('resetGame', { roomCode: currentRoom.code });
    setShowResetModal(false);
    toast.success('Partie réinitialisée !');
  }, [socket, currentRoom]);

  // --------------------------------------------------
  // 📦 Retour du hook
  // --------------------------------------------------
  return {
    // État de la salle
    inRoom,
    currentRoom,
    currentUser,
    permissions,

    // États UI
    proposal,
    setProposal,
    copied,
    setCopied,
    showResetModal,
    setShowResetModal,

    // Utilitaires
    formatTimer,

    // Actions jeu
    startGame,
    pauseGame,
    resetGame,
    sendProposal,
    handleLeaveRoom,
    handleResetGame,
  };
}
