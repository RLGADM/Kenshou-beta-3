import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.PROD ? 'https://kenshou-beta-v2.onrender.com' : 'http://localhost:3000');

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const connectTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (socket) return;

    const newSocket = io(SERVER_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      secure: SERVER_URL.startsWith('https'),
      path: '/socket.io', // explicite pour les proxys
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      console.log('Socket connected:', newSocket.id);
      if (connectTimeout.current) clearTimeout(connectTimeout.current);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setIsConnecting(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connect_error:', err?.message);
      setIsConnected(false);
      setIsConnecting(false);
    });

    connectTimeout.current = setTimeout(() => {
      if (!newSocket.connected) {
        console.warn('Socket connection timeout');
        setIsConnecting(false);
      }
    }, 10000);

    return () => {
      newSocket.close();
      if (connectTimeout.current) clearTimeout(connectTimeout.current);
    };
  }, [socket]);

  return { socket, isConnected, isConnecting };
}
