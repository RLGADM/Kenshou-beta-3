// src/components/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const getServerUrl = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) return 'http://localhost:3000';

  const env = import.meta.env.VITE_SERVER_URL;
  if (env && env.trim()) return env;

  console.log('🧭 Fallback → URL Render utilisée');
  return 'https://kenshou-beta-3.onrender.com';
};

let persistentSocket: Socket | null = null; // 🧠 socket persistante globale

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(persistentSocket);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    // ✅ Empêche la création multiple
    if (!persistentSocket) {
      const newSocket = io(getServerUrl(), {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 60000,
        withCredentials: true,
        auth: {
          userToken: localStorage.getItem('userToken'), // ✅ on l’envoie dès la connexion
        },
      });


      persistentSocket = newSocket;
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log(`✅ Connecté à Socket.IO (${getServerUrl()})`);
        setIsConnected(true);
        setIsConnecting(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.warn('🔴 Déconnecté du serveur', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('❌ Erreur connexion Socket.IO :', err.message);
        setIsConnecting(false);
      });
    } else {
      // 🔗 Réutilise la socket existante si elle existe déjà
      setSocket(persistentSocket);
      setIsConnected(persistentSocket.connected);
      setIsConnecting(false);
    }

    // ❌ Ne ferme jamais la socket dans StrictMode
    return () => {};
  }, []);

  return <SocketContext.Provider value={{ socket, isConnected, isConnecting }}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocketContext must be used within a SocketProvider');
  return context;
}
