// src/socketInstance.ts
// --------------------------------------------------
// 🌐 Socket.IO Singleton Kenshou
// --------------------------------------------------
// - Génère un userToken unique si absent (persistant en localStorage)
// - Envoie ce token via auth à chaque connexion
// - Gère un socket unique, même sous React.StrictMode
// --------------------------------------------------

import { io, Socket } from "socket.io-client";

// 🧠 Génération d'un UUID simple
function generateUUIDv4(): string {
  // Source : RFC 4122 compliant
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 🌍 Détection du serveur
function getServerUrl(): string {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocal) return "http://localhost:3000";

  const envUrl = import.meta.env?.VITE_SERVER_URL?.trim?.();
  if (envUrl) return envUrl;

  return "https://kenshou-beta-3.onrender.com";
}

// --------------------------------------------------
// 🪪 Gestion du userToken persistant
// --------------------------------------------------
let userToken = localStorage.getItem("userToken");

if (!userToken) {
  userToken = generateUUIDv4();
  localStorage.setItem("userToken", userToken);
  console.log("🆕 Nouveau userToken généré :", userToken);
} else {
  console.log("♻️ Reprise userToken existant :", userToken);
}

// --------------------------------------------------
// 🔗 Création unique du socket global
// --------------------------------------------------
const serverUrl = getServerUrl();

export const socket: Socket = io(serverUrl, {
  transports: ["websocket"],
  withCredentials: true,
  auth: { userToken },
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 60000,
  secure: serverUrl.startsWith("https"),
  path: "/socket.io",
});

// --------------------------------------------------
// 📡 Logs de debug (facultatifs)
// --------------------------------------------------
socket.on("connect", () => {
  console.log(`✅ Connecté à ${serverUrl} | socketId=${socket.id} | userToken=${userToken}`);
});

socket.on("disconnect", (reason) => {
  console.warn(`🔴 Déconnecté : ${reason}`);
});

socket.on("connect_error", (err) => {
  console.error("❌ Erreur Socket.IO :", err.message);
});
