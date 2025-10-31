import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '@/types';

interface UseRoomSocketListenersProps {
  socket: Socket | null;
  isConnected: boolean;
  setGameState: (newState: GameState) => void;
  onError?: (error: string) => void; // Optionnel : callback pour remonter les erreurs
}

export function useRoomSocketListeners({ socket, isConnected, setGameState, onError }: UseRoomSocketListenersProps) {
  useEffect(() => {
    if (!socket || !isConnected) return;

    // === Handlers ===
    const handleGameStateUpdate = (newGameState: GameState) => {
      setGameState(newGameState);
    };

    const handleRoomError = (errorMessage: string) => {
      console.error('[ROOM ERROR]', errorMessage);
      if (onError) onError(errorMessage);
    };

    const handleRoomNotFound = () => {
      const msg = 'La salle de jeu est introuvable.';
      console.warn(msg);
      if (onError) onError(msg);
    };

    const handleRoomFull = () => {
      const msg = 'La salle est pleine.';
      console.warn(msg);
      if (onError) onError(msg);
    };

    // === Listeners ===
    socket.on('gameStateUpdate', handleGameStateUpdate);
    socket.on('roomError', handleRoomError);
    socket.on('roomNotFound', handleRoomNotFound);
    socket.on('roomFull', handleRoomFull);

    // Nettoyage à la destruction du composant
    return () => {
      socket.off('gameStateUpdate', handleGameStateUpdate);
      socket.off('roomError', handleRoomError);
      socket.off('roomNotFound', handleRoomNotFound);
      socket.off('roomFull', handleRoomFull);
    };
  }, [socket, isConnected, setGameState, onError]);
}
