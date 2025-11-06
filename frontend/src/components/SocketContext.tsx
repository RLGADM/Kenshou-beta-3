// src/components/SocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ensureUserToken } from "@/utils/userToken";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  console.log("🧩 SocketProvider mounted");


  useEffect(() => {
    const isLocal = window.location.hostname.includes("localhost");
    const serverUrl = isLocal
      ? "http://localhost:3000"
      : import.meta.env.VITE_SERVER_URL ?? "https://kenshou-beta-3.onrender.com";

    const userToken = ensureUserToken();
    const socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      auth: { userToken },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log(`✅ Connecté à Socket.IO (${serverUrl})`);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.warn(`🔴 Déconnecté du serveur (${reason})`);
    });

    socket.on("connect_error", (err) => {
      setIsConnected(false);
      console.error("❌ Erreur de connexion :", err.message);
    });

    return () => {
      socket.disconnect();
      console.log("🧹 Socket.IO déconnecté proprement");
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocketContext must be used within a SocketProvider");
  return context;
};
