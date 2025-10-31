// src/components/SocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

function getServerUrl(): string {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost) return 'http://localhost:3000';
  const envUrl = (import.meta as any).env?.VITE_SERVER_URL?.trim();
  if (envUrl) return envUrl;
  return 'https://kenshou-beta-3.onrender.com';
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const serverUrl = getServerUrl();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (socketRef.current) return; // éviter double init (React.StrictMode)

    const userToken = localStorage.getItem('userToken') || undefined;

    console.log(
      `🌐 Tentative de connexion Socket.IO → ${serverUrl} ${serverUrl.includes('localhost') ? '(local)' : '(prod)'}`
    );

    // ✅ pingInterval / pingTimeout ne sont PAS des options client, retirés
    socketRef.current = io(serverUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      timeout: 60000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { userToken },
      path: '/socket.io',
      secure: serverUrl.startsWith('https'),
      withCredentials: true,
    });

    const s = socketRef.current;

    const onConnect = () => {
      console.log('✅ Connecté à Socket.IO (', serverUrl, ')');
      setIsConnected(true);
      setIsConnecting(false);
    };

    const onDisconnect = (reason: string) => {
      console.warn('🔴 Déconnecté du serveur', reason);
      setIsConnected(false);
    };

    const onConnectError = (err: any) => {
      console.error('❌ Erreur de connexion :', err?.message ?? err);
      setIsConnected(false);
      setIsConnecting(false);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    setIsConnecting(true);
    s.connect();

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      try {
        s.close();
        console.log('🧹 Fermeture de la connexion Socket.IO');
      } catch {}
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, isConnecting }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocketContext must be used within a SocketProvider');
  return context;
}
