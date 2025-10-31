// --------------------------------------------------
// 🎮 useRoomGameActions
// Actions de jeu liées au socket
// --------------------------------------------------

import { useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { Message } from '@/types/game';

export function useRoomGameActions(socket: Socket | null, handleSendMessage?: (msg: string) => void) {
  // ✉️ Envoi d’un message global (chat)
  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !content.trim()) return;
      const message: Message = {
        id: crypto.randomUUID(),
        username: 'Player',
        message: content,
        timestamp: new Date(),
      };
      socket.emit('sendMessage', message);
      if (handleSendMessage) handleSendMessage(content);
    },
    [socket, handleSendMessage]
  );

  // 💡 Envoi d’une proposition (phase 3)
  const sendProposal = useCallback(
    (proposal: string, onClear?: () => void) => {
      if (!socket || !proposal.trim()) return;
      socket.emit('sendProposal', { proposal });
      console.log('💡 Proposition envoyée :', proposal);
      if (onClear) onClear();
    },
    [socket]
  );

  // 🔁 Reset complet de la partie
  const resetGame = useCallback(() => {
    if (!socket) return;
    socket.emit('resetGame');
    console.log('🌀 Jeu réinitialisé');
  }, [socket]);

  // 🚀 Démarrer une phase spécifique
  const startPhase = useCallback(
    (phase: number, roomCode: string) => {
      if (!socket) return;
      socket.emit('startPhase', { phase, roomCode });
      console.log(`🚀 Phase ${phase} démarrée pour ${roomCode}`);
    },
    [socket]
  );

  return {
    sendMessage,
    sendProposal,
    resetGame,
    startPhase,
  };
}
