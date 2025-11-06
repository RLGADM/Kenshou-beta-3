// --------------------------------------------------
// 🚀 Kenshou Server — backend/src/server.js
// --------------------------------------------------
// Gère la logique temps réel : création de room, join, déconnexion, game state
// --------------------------------------------------

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import {
  createUser,
  createRoom,
  createGameRoom,
  defaultGameState,
  defaultGameParameters,
} from "./types.js";

// --------------------------------------------------
// ⚙️ Configuration serveur HTTP + Socket.IO
// --------------------------------------------------
const app = express();
const server = createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://kensho-beta.netlify.app",
  "https://kenshou-beta-3.onrender.com",
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true },
  pingInterval: 20000,
  pingTimeout: 60000,
  allowEIO3: false,
});

// --------------------------------------------------
// 🧠 État global en mémoire
// --------------------------------------------------
const rooms = {}; // { [code]: Room }
const usersByToken = new Map(); // userToken → socketId
const pendingDisconnects = new Map(); // socketId → timeout

// --------------------------------------------------
// 🧹 Nettoyage au démarrage du serveur
// --------------------------------------------------
function resetServerState() {
  // ⚙️ Vide les rooms et utilisateurs connus
  Object.keys(rooms).forEach((code) => delete rooms[code]);
  usersByToken.clear();
  pendingDisconnects.clear();

  console.log("♻️ Réinitialisation complète du serveur (rooms & users vidés)");
}

// Appel immédiat au lancement
resetServerState();

// --------------------------------------------------
// 🧩 Fonctions utilitaires
// --------------------------------------------------
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  do {
    code = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (rooms[code]);
  return code;
}

function removeUserFromRoomsBySocket(socketId) {
  for (const [code, room] of Object.entries(rooms)) {
    const before = room.users.length;
    room.users = room.users.filter((u) => u.socketId !== socketId);
    if (room.users.length < before) {
      io.to(code).emit("usersUpdate", room.users);
      console.log(`🧹 ${socketId} retiré de ${code}`);
      if (room.users.length === 0) {
        delete rooms[code];
        console.log(`🗑️ Room ${code} supprimée (vide)`);
      }
    }
  }
}

function removeUserByToken(userToken) {
  for (const [code, room] of Object.entries(rooms)) {
    const before = room.users.length;
    room.users = room.users.filter((u) => u.userToken !== userToken);
    if (room.users.length < before) {
      io.to(code).emit("usersUpdate", room.users);
      console.log(`🧹 ${userToken} retiré de ${code}`);
      if (room.users.length === 0) {
        delete rooms[code];
        console.log(`🗑️ Room ${code} supprimée (vide)`);
      }
    }
  }
}

// --------------------------------------------------
// 🛰️ Protection anti-clients fantômes
// --------------------------------------------------
io.use((socket, next) => {
  const token = socket.handshake.query?.token;
  if (!token || typeof token !== "string") {
    console.log("⚠️ Connexion bloquée : token manquant ou invalide");
    return next(new Error("No valid token"));
  }

  // Si le token est déjà enregistré mais que l'ancien socket n'est pas fermé :
  if (usersByToken.has(token)) {
    console.log(`⚠️ Client fantôme détecté : ${token}, suppression ancienne socket`);
    const oldSocketId = usersByToken.get(token);
    const oldSocket = io.sockets.sockets.get(oldSocketId);
    if (oldSocket) oldSocket.disconnect(true);
    usersByToken.delete(token);
  }

  usersByToken.set(token, socket.id);
  next();
});

// --------------------------------------------------
// ⚡ Socket.IO — Logique principale
// --------------------------------------------------
io.on("connection", (socket) => {
  const userToken = socket.handshake?.auth?.userToken || crypto.randomUUID();
  usersByToken.set(userToken, socket.id);

  console.log(`✅ Client connecté : socketId=${socket.id} userToken=${userToken}`);

  // --------------------------------------------------
  // 🎮 CREATE ROOM
  // --------------------------------------------------
  socket.on("createRoom", (payload, cb) => {
    try {
      const { username, parameters, userToken: clientToken } = payload;

      const token = clientToken || userToken;
      const roomCode = generateRoomCode();

      // Supprime ancienne session du même token
      removeUserByToken(token);

      const user = createUser({
        id: token,
        userToken: token,
        username,
        isAdmin: true,
        role: "spectator",
        socketId: socket.id,
        team: "spectator",
      });

      const newRoom = createRoom({
        code: roomCode,
        users: [user],
        messages: [],
        gameParameters: parameters || defaultGameParameters,
        gameState: defaultGameState,
        createdAt: Date.now(),
      });

      rooms[roomCode] = newRoom;
      socket.join(roomCode);

      console.log(`✅ Nouvelle room ${roomCode} créée par ${username}`);
      socket.emit("roomCreated", newRoom);
      if (cb) cb({ success: true, roomCode });
    } catch (err) {
      console.error("❌ Erreur lors de la création de la room :", err);
      if (cb) cb({ success: false, error: err.message });
    }
  });

// --------------------------------------------------
// 👥 JOIN ROOM
// --------------------------------------------------
socket.on("joinRoom", (data, cb) => {
  const { username, roomCode, userToken } = data;
  console.log(`👥 joinRoom reçu :`, data);

  const room = rooms[roomCode];
  if (!room) {
    if (cb) cb({ success: false, error: "Room not found" });
    socket.emit("roomNotFound");
    return;
  }

  // Vérifie si le pseudo existe déjà
  const existingUser = room.users.find((u) => u.username === username);

  if (existingUser) {
    // ✅ Même token → autoriser la reconnexion (ex: F5 ou reconnexion auto)
    if (existingUser.userToken === userToken) {
      console.log(`🔄 ${username} se reconnecte à ${roomCode}`);
      existingUser.socketId = socket.id; // mise à jour du socketId
      socket.join(roomCode);
      io.to(roomCode).emit("usersUpdate", room.users);
      socket.emit("roomJoined", room);
      if (cb) cb({ success: true, reconnected: true });
      return;
    }

    // ❌ Sinon → pseudo déjà pris
    console.log(`🚫 ${username} déjà utilisé dans ${roomCode}`);
    if (cb) cb({ success: false, error: "username taken" });
    socket.emit("usernameTaken");
    return;
  }

  // ✅ Cas normal — ajout d’un nouveau joueur
  const newUser = {
    id: userToken,
    userToken,
    username,
    team: "spectator",
    role: "spectator",
    isAdmin: true,
    socketId: socket.id,
  };

  room.users.push(newUser);
  socket.join(roomCode);
  io.to(roomCode).emit("usersUpdate", room.users);

  console.log(`✅ ${username} a rejoint ${roomCode}`);
  socket.emit("roomJoined", room);
  if (cb) cb({ success: true });
});


  // --------------------------------------------------
  // 🕹️ RESET GAME
  // --------------------------------------------------
  socket.on("resetGame", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.gameState = { ...defaultGameState };
    io.to(roomCode).emit("gameStateUpdate", room.gameState);
    console.log(`♻️ Partie réinitialisée pour ${roomCode}`);
  });

  // --------------------------------------------------
  // 🚪 LEAVE ROOM
  // --------------------------------------------------
  socket.on("leaveRoom", ({ roomCode, userToken }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.users = room.users.filter((u) => u.userToken !== userToken);
    io.to(roomCode).emit("usersUpdate", room.users);
    socket.leave(roomCode);
    console.log(`🚪 ${userToken} a quitté la room ${roomCode}`);

    if (room.users.length === 0) {
      delete rooms[roomCode];
      console.log(`🗑️ Room ${roomCode} supprimée (vide)`);
    }
  });

  // --------------------------------------------------
  // ❌ DISCONNECT (tolérance 60s)
  // --------------------------------------------------
  socket.on("disconnect", (reason) => {
    console.log(`❌ Déconnexion socketId=${socket.id} reason=${reason}`);

    for (const [token, id] of usersByToken.entries()) {
      if (id === socket.id) {
        usersByToken.delete(token);
      }
    }

    const timeout = setTimeout(() => {
      removeUserFromRoomsBySocket(socket.id);
      pendingDisconnects.delete(socket.id);
    }, 60000);

    pendingDisconnects.set(socket.id, timeout);
  });

  // --------------------------------------------------
  // 🔁 RECONNECT
  // --------------------------------------------------
  socket.on("reconnect", () => {
    const t = pendingDisconnects.get(socket.id);
    if (t) {
      clearTimeout(t);
      pendingDisconnects.delete(socket.id);
      console.log(`🔄 Reconnexion socketId=${socket.id}`);
    }
  });
});

// --------------------------------------------------
// 🚀 LANCEMENT SERVEUR
// --------------------------------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Serveur Kenshou en ligne sur http://localhost:${PORT}`));
