// server.js (ou src/server.js) - extrait pertinent
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'https://kensho-beta.netlify.app',
  'https://kenshou-beta-3.onrender.com',
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// options: augmenter pingInterval / pingTimeout
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
  pingInterval: 20000, // serveur ping client every 20s
  pingTimeout: 60000, // wait 60s for pong before disconnect
  allowEIO3: false,
});

// In-memory maps
const rooms = {};
const pendingDisconnects = new Map(); // socketId -> timeout

function generateRoomCode() {
  /* ta logique */
}
function getInitialGameState(params) {
  /* ta logique */
}
// removeUserFromRooms: remplace par version robuste ci-dessous

function removeUserFromRoomsBySocket(socketId) {
  for (const code of Object.keys(rooms)) {
    const room = rooms[code];
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

io.on('connection', (socket) => {
  // prefer logging userToken if provided by client
  const userToken = socket.handshake?.auth?.userToken ?? 'no-token';
  console.log(`✅ Client connecté : socketId=${socket.id} userToken=${userToken}`);

  // CREATE ROOM
  socket.on('createRoom', (payload, cb) => {
    console.log('🎮 createRoom reçu →', payload);
    const { username, mode, parameters, userToken } = payload;
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
      createdAt: Date.now(),
    };
    rooms[roomCode] = newRoom;
    socket.join(roomCode);

    console.log(`✅ Nouvelle room ${roomCode} créée par ${username}`);
    socket.emit('roomCreated', newRoom);
    if (cb) cb({ success: true, roomCode });
  });

  // JOIN ROOM
  socket.on('joinRoom', (data, cb) => {
    console.log(`👥 joinRoom reçu :`, data);
    const { username, roomCode, userToken } = data;
    const room = rooms[roomCode];
    if (!room) {
      if (cb) cb({ success: false, error: 'Room not found' });
      socket.emit('roomNotFound');
      return;
    }

    if (room.users.some((u) => u.username === username)) {
      if (cb) cb({ success: false, error: 'username taken' });
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
    if (cb) cb({ success: true });
  });

  // RESET GAME (exemple)
  socket.on('resetGame', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.gameState = getInitialGameState(room.gameParameters);
    io.to(roomCode).emit('gameStateUpdate', room.gameState);
    console.log(`♻️ Partie réinitialisée pour ${roomCode}`);
  });

  // DISCONNECT: tolérer 60s
  socket.on('disconnect', (reason) => {
    console.log(`❌ Déconnexion socketId=${socket.id} reason=${reason}`);
    // schedule a removal in 60s
    const t = setTimeout(() => {
      removeUserFromRoomsBySocket(socket.id);
      pendingDisconnects.delete(socket.id);
    }, 60000); // 60s
    pendingDisconnects.set(socket.id, t);
  });

  // Socket.IO will attempt reconnection automatically; if reconnected we clear pending timeout.
  socket.on('reconnect', () => {
    console.log(`🔄 Reconnect event for ${socket.id}`);
    const t = pendingDisconnects.get(socket.id);
    if (t) {
      clearTimeout(t);
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

// 🔹 Supprime un utilisateur par son userToken (persiste entre reconnexions)
function removeUserByToken(token) {
  for (const [code, room] of Object.entries(rooms)) {
    const before = room.users.length;
    room.users = room.users.filter((u) => u.userToken !== token);

    if (room.users.length < before) {
      io.to(code).emit('usersUpdate', room.users);
      console.log(`🧹 ${token} retiré de ${code}`);

      if (room.users.length === 0) {
        delete rooms[code];
        console.log(`🗑️ Room ${code} supprimée (vide)`);
      }
      return; // on quitte dès qu’on a trouvé
    }
  }
}
function removeUserFromRooms(socketId) {
  for (const [code, room] of Object.entries(rooms)) {
    const before = room.users.length;

    // Supprime l'utilisateur lié à ce socket
    room.users = room.users.filter((u) => u.socketId !== socketId);

    if (room.users.length < before) {
      io.to(code).emit('usersUpdate', room.users);
      console.log(`🧹 ${socketId} retiré de ${code}`);

      // Supprime la room si elle devient vide
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
