import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';


// Log Socket
export function useSocketInitializer(socket: Socket | null) {
  useEffect(() => {
    if (!socket) {
      console.log('Socket not initialized yet');
      return;
    }

    if (!socket.connected) {
      console.log('Socket initialized but not connected yet, attempting to connect...');
      socket.connect();
    } else {
      console.log('Socket is already connected with id:', socket.id);
    }
  }, [socket]);
}

// Suppression donnée frontend
export function useServerReset(socket: Socket | null) {
  useEffect(() => {
    if (!socket) return;

    const handleServerReset = (message: string) => {
      console.warn('[serverReset] Reçu :', message);

      // Nettoyage des données front
      localStorage.removeItem('roomCode');
      localStorage.removeItem('userToken');

      // Optionnel : rediriger ou recharger la page
      window.location.reload();
    };

    socket.on('serverReset', handleServerReset);

    // Nettoyage à la destruction du hook
    return () => {
      socket.off('serverReset', handleServerReset);
    };
  }, [socket]);
}
