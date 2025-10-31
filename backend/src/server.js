// --------------------------------------------------
// ⚙️ IMPORTS ET CONFIG
// --------------------------------------------------
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

// --------------------------------------------------
// 🧩 SETUP EXPRESS + SOCKET.IO
// --------------------------------------------------
const app = express();
const server = createServer(app);
// Youpi CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://kensho-beta.netlify.app',
  'https://kenshou-beta-3.onrender.com',
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});

// --------------------------------------------------
// 📦 STOCKAGE EN MÉMOIRE (temporaire)
// --------------------------------------------------
const rooms = {}; // ex: { "ABCD12": { code, users, gameState, ... } }
const pendingDisconnects = new Map(); // socket.id → timeout

// --------------------------------------------------
// 🧪 ROUTE DE TEST
// --------------------------------------------------
app.get('/', (_, res) => res.send('✅ Serveur Kensho opérationnel'));

// --------------------------------------------------
// ⚡ SOCKET.IO HANDLERS
// --------------------------------------------------
io.on('connection', (socket) => {
  console.log(`🛰️ Nouveau client connecté : ${socket.id}`);

  // ----------------------------
  // 🔹 CREATE ROOM
  // ----------------------------
  socket.on('createRoom', (payload) => {
    console.log('🎮 createRoom reçu →', payload);
    const { username, mode, parameters, userToken } = payload;

    // Génère un code de salle unique
    const roomCode = generateRoomCode();
    const newRoom = {
      code: roomCode,
      mode,
      users: [
        {
          id: userToken,
          userToken,
          username,
          team: 'spectator',
          role: 'sage',
          isAdmin: true,
          socketId: socket.id,
        },
      ],
      messages: [],
      gameParameters: parameters,
      gameState: getInitialGameState(parameters),
    };

    rooms[roomCode] = newRoom;
    socket.join(roomCode);

    console.log(`✅ Nouvelle room ${roomCode} créée par ${username}`);
    socket.emit('roomCreated', newRoom);
  });

  // ----------------------------
  // 🔹 JOIN ROOM
  // ----------------------------
  socket.on('joinRoom', ({ username, roomCode, userToken }) => {
    console.log(`👥 joinRoom reçu : ${username} veut rejoindre ${roomCode}`);

    const room = rooms[roomCode];
    if (!room) {
      socket.emit('roomNotFound');
      return;
    }

    // Vérifie pseudo déjà utilisé
    if (room.users.some((u) => u.username === username)) {
      socket.emit('usernameTaken');
      return;
    }

    const newUser = {
      id: userToken,
      userToken,
      username,
      team: 'spectator',
      role: 'disciple',
      isAdmin: false,
      socketId: socket.id,
    };

    room.users.push(newUser);
    socket.join(roomCode);
    io.to(roomCode).emit('usersUpdate', room.users);

    console.log(`✅ ${username} a rejoint ${roomCode}`);
    socket.emit('roomJoined', room);
  });

  // ----------------------------
  // 🔹 RESET GAME
  // ----------------------------
  socket.on('resetGame', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.gameState = getInitialGameState(room.gameParameters);
    io.to(roomCode).emit('gameStateUpdate', room.gameState);
    console.log(`♻️ Partie réinitialisée pour ${roomCode}`);
  });

  // ----------------------------
  // 🔹 DECONNEXION
  // ----------------------------
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client déconnecté : ${socket.id} (${reason})`);

    // 💡 Tolère une reconnexion pendant 2s avant suppression
    const timeout = setTimeout(() => {
      removeUserFromRooms(socket.id);
      pendingDisconnects.delete(socket.id);
    }, 60000); // 60s

    pendingDisconnects.set(socket.id, timeout);
  });

  // ----------------------------
  // 🔹 RECONNEXION (auto Socket.IO)
  // ----------------------------
  socket.on('reconnect', () => {
    console.log(`🔄 ${socket.id} reconnecté`);
    const timeout = pendingDisconnects.get(socket.id);
    if (timeout) {
      clearTimeout(timeout);
      pendingDisconnects.delete(socket.id);
    }
  });
});

// --------------------------------------------------
// 🧩 FONCTIONS UTILITAIRES
// --------------------------------------------------
function generateRoomCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  } while (rooms[code]);
  return code;
}

function getInitialGameState(params) {
  return {
    isPlaying: false,
    currentRound: {
      index: 0,
      phases: [],
      currentPhase: { index: 0, name: 'En attente', status: 'En attente' },
      redTeamWord: '',
      blueTeamWord: '',
      redTeamForbiddenWords: [],
      blueTeamForbiddenWords: [],
    },
    scores: { red: 0, blue: 0 },
    remainingGuesses: 3,
  };
}

function removeUserFromRooms(socketId) {
  for (const [code, room] of Object.entries(rooms)) {
    const before = room.users.length;
    room.users = room.users.filter((u) => u.socketId !== socketId);
    if (room.users.length < before) {
      io.to(code).emit('usersUpdate', room.users);
      console.log(`🧹 ${socketId} retiré de ${code}`);
      if (room.users.length === 0) {
        delete rooms[code];
        console.log(`🗑️ Room ${code} supprimée (vide)`);
      }
    }
  }
}

// --------------------------------------------------
// 🚀 LANCEMENT SERVEUR
// --------------------------------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Serveur Kensho en ligne sur http://localhost:${PORT}`));
