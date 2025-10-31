// src/hooks/app/useHydration.ts
// --------------------------------------------------
// 💧 useHydration
// Recharge la session joueur + room après un rechargement
// --------------------------------------------------

import { useEffect, useState } from 'react';
import { useSocketContext } from '@/components/SocketContext';

interface HydrationData {
  username: string;
  roomCode: string;
  userToken?: string | null;
}

export function useHydration() {
  const { socket } = useSocketContext();
  const [hydrated, setHydrated] = useState(false); // indique si l’hydratation est terminée

  useEffect(() => {
    if (!socket || !socket.connected || hydrated) return;

    const storedUsername = localStorage.getItem('username');
    const storedRoom = localStorage.getItem('roomCode');
    const userToken = localStorage.getItem('kensho_player_token'); // harmonisé avec useGenerateToken

    if (!storedUsername || !storedRoom) return;

    const data: HydrationData = {
      username: storedUsername,
      roomCode: storedRoom,
      userToken,
    };

    console.log('💧 Hydration: tentative de reconnexion avec :', data);
    socket.emit('hydrateUser', data);

    // Réception des données de room
    const handleRoomJoined = (payload: any) => {
      console.log('✅ Hydration réussie :', payload);
      localStorage.setItem('roomCode', payload.room.code);
      setHydrated(true);
    };

    socket.once('roomJoined', handleRoomJoined);

    // Cleanup listener
    return () => {
      socket.off('roomJoined', handleRoomJoined);
    };
  }, [socket, hydrated]);

  return { hydrated };
}
