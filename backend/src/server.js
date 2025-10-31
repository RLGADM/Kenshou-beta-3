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
  // 🔐 Récupération du token utilisateur dès la connexion
  const userToken = socket.handshake.auth?.userToken || null;
  console.log(`🛰️ Nouveau client connecté : ${userToken || socket.id}`);

  // 🔎 Si l’utilisateur avait déjà une room → reconnexion automatique
  if (userToken) {
    for (const [code, room] of Object.entries(rooms)) {
      const existingUser = room.users.find((u) => u.userToken === userToken);
      if (existingUser) {
        existingUser.socketId = socket.id;
        socket.join(room.code);
        console.log(`♻️ Reconnexion de ${existingUser.username} (${userToken}) dans la room ${room.code}`);
        socket.emit('roomJoined', room);
      }
    }
  }

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
      mode: mode || 'standard',
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

    // Enregistrement du dernier salon (utile pour reconnexion)
    socket.emit('roomJoined', newRoom);
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

    // Si le joueur existait déjà (reconnexion)
    const existingUser = room.users.find((u) => u.userToken === userToken);
    if (existingUser) {
      existingUser.socketId = socket.id;
      console.log(`♻️ ${username} reconnecté dans ${roomCode}`);
      socket.join(roomCode);
      socket.emit('roomJoined', room);
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
    console.log(`❌ Client déconnecté : ${userToken || socket.id} (${reason})`);

    // Si userToken connu, on ne le supprime pas immédiatement
    if (userToken) {
      const timeout = setTimeout(() => {
        removeUserByToken(userToken);
        pendingDisconnects.delete(userToken);
      }, 60000); // 1 minute de tolérance avant suppression

      pendingDisconnects.set(userToken, timeout);
      return;
    }

    // Sinon, suppression standard
    const timeout = setTimeout(() => {
      removeUserFromRooms(socket.id);
      pendingDisconnects.delete(socket.id);
    }, 60000);

    pendingDisconnects.set(socket.id, timeout);
  });

  // ----------------------------
  // 🔹 RECONNEXION
  // ----------------------------
  socket.on('reconnect', () => {
    console.log(`🔄 ${userToken || socket.id} reconnecté`);
    const timeout = pendingDisconnects.get(userToken || socket.id);
    if (timeout) {
      clearTimeout(timeout);
      pendingDisconnects.delete(userToken || socket.id);
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

// --------------------------------------------------
// 🚀 LANCEMENT SERVEUR
// --------------------------------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Serveur Kensho en ligne sur http://localhost:${PORT}`));
