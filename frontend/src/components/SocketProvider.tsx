// --------------------------------------------------
// ⚡ SocketProvider — Contexte global Socket.IO Kenshou
// --------------------------------------------------

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ensureUserToken } from "@/utils/userToken";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

// --------------------------------------------------
// 🔹 Détection automatique du serveur
// --------------------------------------------------
function getServerUrl(): string {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  if (isLocalhost) return "http://localhost:3000";

  const envUrl = (import.meta as any).env?.VITE_SERVER_URL?.trim();
  if (envUrl) return envUrl;

  return "https://kenshou-beta-3.onrender.com";
}

// --------------------------------------------------
// 🧩 Fournisseur de contexte Socket.IO
// --------------------------------------------------
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (socketRef.current) return; // éviter double init (React.StrictMode)
    const serverUrl = getServerUrl();
    const userToken = ensureUserToken();
    socketRef.current = io(serverUrl, {
    auth: { userToken },
    transports: ["websocket", "polling"],
  });

    console.log(
      `🌐 Tentative de connexion Socket.IO → ${serverUrl} ${serverUrl.includes("localhost") ? "(local)" : "(prod)"}`
    );

    const socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { userToken },
      path: "/socket.io",
      secure: serverUrl.startsWith("https"),
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`✅ Connecté à Socket.IO (${serverUrl})`);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason: string) => {
      console.warn("🔴 Déconnecté du serveur :", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (err: any) => {
      console.error("❌ Erreur de connexion :", err?.message ?? err);
      setIsConnected(false);
    });

    return () => {
      console.log("🧹 Fermeture de la connexion Socket.IO");
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}