import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

// --------------------------------------------------
// 🔌 Détection robuste de l’URL du serveur
// --------------------------------------------------
function getServerUrl(): string {
  try {
    const hostname = window.location.hostname;

    // ✅ Cas 1 : dev local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('🌍 Mode développement détecté → backend local');
      return 'http://localhost:3000';
    }

    // ✅ Cas 2 : URL fournie dans .env
    const envUrl = import.meta.env.VITE_SERVER_URL?.trim();
    if (envUrl) {
      console.log('🌐 Mode production détecté → URL .env utilisée');
      return envUrl;
    }

    // ✅ Cas 3 : fallback
    console.log('🧭 Fallback → URL Render utilisée');
    return 'https://kenshou-beta-3.onrender.com';
  } catch (err) {
    console.warn('⚠️ Erreur dans getServerUrl, fallback Render utilisé', err);
    return 'https://kenshou-beta-3.onrender.com';
  }
}

// --------------------------------------------------
// 🔹 Provider principal
// --------------------------------------------------
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const SERVER_URL = getServerUrl();

    console.log(`🌐 Tentative de connexion Socket.IO → ${SERVER_URL}`);

    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      secure: SERVER_URL.startsWith('https'),
      path: '/socket.io',
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`✅ Connecté à Socket.IO (${SERVER_URL})`);
      setIsConnected(true);
      setIsConnecting(false);
    });

    newSocket.on('disconnect', () => {
      console.warn('🔴 Déconnecté du serveur');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Erreur Socket.IO :', err.message);
      setIsConnected(false);
      setIsConnecting(false);
    });

    // Nettoyage propre
    return () => {
      console.log('🧹 Fermeture de la connexion Socket.IO');
      newSocket.close();
    };
  }, []);

  return <SocketContext.Provider value={{ socket, isConnected, isConnecting }}>{children}</SocketContext.Provider>;
}

// --------------------------------------------------
// 🔹 Hook utilitaire
// --------------------------------------------------
export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocketContext must be used within a SocketProvider');
  return context;
}
