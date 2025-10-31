// src/hooks/app/useReconnection.ts
// --------------------------------------------------
// 🔄 useReconnection : tente de relier le joueur après un F5
// --------------------------------------------------

import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';

interface Params {
  socket: Socket | null;
  isConnected: boolean;
}

export function useReconnection({ socket, isConnected }: Params) {
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Vérifie si un token joueur est stocké
    const token = localStorage.getItem('kensho_player_token');
    if (!token) return;

    // Envoie un event de reconnexion au serveur
    console.log('♻️ Tentative de reconnexion avec le token :', token);
    socket.emit('player_reconnect', { token });
  }, [socket, isConnected]);
}
