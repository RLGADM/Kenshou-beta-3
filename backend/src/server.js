// Import Framework
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
// Import local
import { rooms, users, gameStates } from './utils/store.js';

// --- INIT --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

//log initialement, mais on va le laisser ici
// --- CORS & JSON ---
const allowedOrigins = ['http://localhost:5173', 'https://localhost:5173', 'https://kenshou-b3.netlify.app'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Instanciation Socket.IO avant tout usage
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

// Route racine (check Render)
app.get('/', (req, res) => {
  res.send('OK');
});
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

//fonction pour récupérer les utilisateurs d'une room
function getRoomUsers(roomCode) {
  const room = rooms.get(roomCode);
  return room ? room.users : [];
}
// --- SOCKET.IO ---

// 🔄 Nettoyage initial
rooms.clear();
users.clear();
console.log('[SERVER] Maps rooms et users vidées au démarrage');

// Ajout: Map des timers de suppression des rooms vides
const roomDeletionTimers = new Map();

// Ajout: Map des timers de phases (1s tick par room)
const phaseTimers = new Map();

// SUPPRIMÉ: seconde déclaration de `io` ici
// const io = new Server(server, {
//   cors: {
//     origin: 'https://localhost:5173',
//     credentials: true,
//   },
// });

// Réutiliser l’instance `io` existante
io.emit('serverReset', 'Serveur redémarré');

io.on('connection', (socket) => {
  console.log(`[SERVER] ✅ Nouveau client connecté : ${socket.id}`);

  if (!socket.connected) {
    console.warn(`[JOIN BLOCKED] Socket ${socket.id} n'est pas encore connecté.`);
    if (ack) ack({ success: false, error: 'Connexion non encore établie.' });
    return;
  }

  // === 🔗 CREATE ROOM ===
  socket.on('createRoom', (data, ack) => {
    const { gameMode, parameters, userToken } = data;
    console.log('data :', data);

    if (!userToken || !parameters) {
      return ack?.({
        success: false,
        error: 'Paramètres ou token manquants pour créer la salle.',
      });
    }

    const roomCode = generateRoomCode(); // exemple : "XK3D9A"

    // Crée la room sans y ajouter d'utilisateur
    const room = createRoom(roomCode, parameters);

    console.log(`[SERVER] Room ${roomCode} créée avec le mode ${gameMode}`);

    // Si la room reste vide, suppression dans 5 minutes
    const existingTimer = roomDeletionTimers.get(roomCode);
    if (!existingTimer && room.users.length === 0) {
      const timer = setTimeout(
        () => {
          const r = rooms.get(roomCode);
          if (r && r.users.length === 0) {
            rooms.delete(roomCode);
            gameStates.delete(roomCode);
            console.log(`🗑️ Salle ${roomCode} supprimée après 5 min sans joueurs`);
          }
          roomDeletionTimers.delete(roomCode);
        },
        5 * 60 * 1000
      );
      roomDeletionTimers.set(roomCode, timer);
      console.log(`[⏳] Salle ${roomCode} créée vide, suppression programmée dans 5 minutes`);
    }

    return ack?.({ success: true, roomCode });
  });

  // === 🔗 JOIN ROOM ===
  socket.on('joinRoom', (data, ack) => {
    const { username, roomCode, userToken } = data;

    if (!roomCode || !username || !userToken) {
      if (typeof ack === 'function') {
        ack({ success: false, error: 'Informations manquantes pour rejoindre la salle.' });
      }
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      if (typeof ack === 'function') {
        ack({ success: false, error: "Cette salle n'existe pas." });
      }
      return;
    }

    // Vérifie si l'utilisateur est déjà présent avec ce token
    const existingUser = room.users.find((u) => u.id === userToken);

    if (existingUser) {
      existingUser.socketId = socket.id;
      users.set(socket.id, existingUser);
      socket.join(roomCode);

      // Annuler suppression si programmée
      const pendingTimer = roomDeletionTimers.get(roomCode);
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        roomDeletionTimers.delete(roomCode);
        console.log(`[🛑] Suppression de la salle ${roomCode} annulée: un utilisateur existant a rejoint.`);
      }

      // Garder l'utilisateur existant dans son équipe et rôle actuels
      if (room.gameState) {
        // Ne rien faire ici - on laisse l'utilisateur dans son équipe actuelle
        console.log(`[REJOINT EXISTANT] ${username} conserve son équipe/rôle actuel:`, {
          team: existingUser.team,
          role: existingUser.role,
        });
      }

      console.log(`[REJOINT EXISTANT] ${username} replacé en spectator`);

      if (typeof ack === 'function') {
        ack({ success: true });
      }

      io.to(roomCode).emit('gameStateUpdate', room.gameState);
      io.to(roomCode).emit('usersUpdate', getRoomUsers(roomCode));
      return;
    }

    // Nouveau joueur
    const isFirst = room.users.length === 0;

    const newUser = {
      id: userToken,
      socketId: socket.id,
      username,
      roomRole: isFirst ? 'Admin' : 'Player',
      isAdmin: isFirst,
      team: 'spectator',
      role: 'spectator',
      room: roomCode,
    };

    room.users.push(newUser);
    users.set(socket.id, newUser);
    socket.join(roomCode);

    // Annuler suppression si programmée
    const pendingTimer = roomDeletionTimers.get(roomCode);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      roomDeletionTimers.delete(roomCode);
      console.log(`[🛑] Suppression de la salle ${roomCode} annulée: un nouveau joueur a rejoint.`);
    }

    console.log(`[JOIN ROOM] ${username} rejoint ${roomCode} en tant que ${newUser.roomRole}`);

    if (typeof ack === 'function') {
      console.log('[JOIN ACK] envoyé');
      ack({ success: true });
    }

    // Aligner avec le front
    io.to(roomCode).emit('usersUpdate', getRoomUsers(roomCode));
  });

  // === 🧩 JOIN TEAM ===
  socket.on('joinTeam', (firstArg, maybeAck) => {
    // Normalise payload et ack
    const ack = typeof maybeAck === 'function' ? maybeAck : undefined;

    let roomCode, userToken, username, team, role;

    // Nouveau format: objet
    if (typeof firstArg === 'object' && firstArg !== null) {
      ({ roomCode, userToken, username, team, role } = firstArg);
    } else {
      // Ancien format: (team, role)
      team = firstArg;
      if (typeof maybeAck === 'string') {
        role = maybeAck;
      }
      const existingUser = users.get(socket.id);
      if (existingUser) {
        roomCode = existingUser.room;
        userToken = existingUser.id;
        username = existingUser.username;
      }
    }

    if (!socket?.connected) {
      if (ack) ack({ success: false, message: 'Socket non connecté' });
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      if (ack) ack({ success: false, message: 'Room introuvable' });
      return;
    }

    // Rechercher l’utilisateur par token, sinon fallback socket.id
    let user = room.users.find((u) => u.id === userToken);
    if (!user) {
      user = users.get(socket.id);
      if (!user) {
        if (ack) ack({ success: false, message: 'Utilisateur non trouvé' });
        return;
      }
    }

    // Déterminer le rôle souhaité (disciple par défaut en équipe; spectateur sinon)
    const desiredRole = role || (team === 'spectator' ? 'spectator' : 'disciple');

    // Initialiser le gameState si manquant
    if (!room.gameState) {
      room.gameState = initializeGameState();
    }

    // Verrou des rôles UNIQUEMENT pendant une manche active
    const isMancheActive = Boolean(room.gameState.isPlaying);
    if (isMancheActive && team !== 'spectator') {
      if (ack)
        ack({
          success: false,
          message: 'Rôles verrouillés pendant la manche en cours. Les nouveaux arrivants sont observateurs.',
        });
      return;
    }

    // Règle: un seul Sage par équipe. Le swap ne s'applique QUE pour un membre de la même équipe.
    if (desiredRole === 'sage') {
      const existingSage = room.users.find((u) => u.team === team && u.role === 'sage' && u.id !== user.id);
      if (existingSage) {
        const isSameTeam = user.team === team; // utilisateur déjà dans l'équipe ciblée
        if (!isSameTeam) {
          if (ack) ack({ success: false, message: 'Il y a déjà un Sage dans cette équipe !' });
          return;
        }
        // Swap autorisé: démote l'ancien sage en disciple dans la même équipe
        existingSage.role = 'disciple';
        // Reporter la mise à jour côté gameState
        const gs = room.gameState;
        const exToken = existingSage.id;
        // Nettoyage d'abord pour éviter les doublons
        gs.teams[team].disciples = gs.teams[team].disciples.filter((u) => u?.id !== exToken);
        if (gs.teams[team].sage?.id === exToken) {
          gs.teams[team].sage = null;
        }
        gs.teams[team].disciples.push({
          id: exToken,
          username: existingSage.username,
          room: roomCode,
          team,
          role: 'disciple',
        });
        // Mettre à jour l'entrée dans la map globale users si on peut la retrouver
        for (const [sid, uObj] of users.entries()) {
          if (uObj?.id === exToken) {
            users.set(sid, { ...uObj, role: 'disciple', team });
            break;
          }
        }
      }
    }

    // Nettoyer la position précédente dans le gameState pour l'utilisateur courant
    const gs = room.gameState;
    const token = user.id;
    gs.spectators = gs.spectators.filter((u) => u?.id !== token);
    gs.teams.red.disciples = gs.teams.red.disciples.filter((u) => u?.id !== token);
    gs.teams.blue.disciples = gs.teams.blue.disciples.filter((u) => u?.id !== token);
    if (gs.teams.red.sage?.id === token) gs.teams.red.sage = null;
    if (gs.teams.blue.sage?.id === token) gs.teams.blue.sage = null;

    // Appliquer l’équipe/rôle
    user.team = team;
    user.role = desiredRole;
    user.socketId = socket.id;
    if (username) user.username = username;

    // Reporter dans le gameState
    const entry = { id: token, username: user.username, room: roomCode, team, role: user.role };
    if (team === 'spectator') {
      gs.spectators.push(entry);
    } else if (user.role === 'sage') {
      gs.teams[team].sage = entry;
    } else {
      gs.teams[team].disciples.push(entry);
    }

    // Mettre à jour la map globale des users (clé: socket.id)
    users.set(socket.id, user);

    // Sync front
    io.to(roomCode).emit('gameStateUpdate', room.gameState);
    io.to(roomCode).emit('usersUpdate', room.users);

    if (ack) ack({ success: true, message: 'Équipe/role mis à jour avec succès' });
  });

  // === ▶️ START GAME ===
  socket.on('startGame', () => {
    const user = users.get(socket.id);
    console.log('[BACK] startGame received', { socketId: socket.id, userToken: user?.id, roomCode: user?.room });
    if (!user) return;
    const room = rooms.get(user.room);
    if (!room || !room.gameState) return;

    const phaseBefore = room.gameState.currentPhase;
    if (phaseBefore === 0) {
      startPhase(room.code, 1);
    } else if (phaseBefore === 2) {
      startPhase(room.code, 3);
    } else if (!room.gameState.isPlaying) {
      // Reprendre avec le total initial de la phase, pas avec le temps restant
      const phaseTotal = room.gameState.totalTime || getPhaseDuration(room.gameParameters, phaseBefore || 1);
      startPhaseTimer(room.code, phaseTotal);
    }
    console.log('[BACK] startGame processed', {
      phaseBefore,
      phaseAfter: room.gameState.currentPhase,
      isPlaying: room.gameState.isPlaying,
      timeRemaining: room.gameState.timeRemaining,
      totalTime: room.gameState.totalTime,
    });
  });

  socket.on('pauseGame', () => {
    const user = users.get(socket.id);
    console.log('[BACK] pauseGame received', { socketId: socket.id, userToken: user?.id, roomCode: user?.room });
    if (!user) return;
    const room = rooms.get(user.room);
    if (!room || !room.gameState) return;

    room.gameState.isPlaying = false;
    io.to(user.room).emit('gameStateUpdate', room.gameState);
    clearPhaseTimer(room.code);
    console.log('[BACK] pauseGame processed', {
      phase: room.gameState.currentPhase,
      isPlaying: room.gameState.isPlaying,
    });
  });

  // === 🔁 RESET GAME ===
  socket.on('resetGame', () => {
    const user = users.get(socket.id);
    if (!user) return;
    const room = rooms.get(user.room);
    if (!room || !room.gameState) return;

    clearPhaseTimer(room.code);
    const gs = room.gameState;
    gs.currentPhase = 0;
    gs.isPlaying = false;
    gs.timeRemaining = 0;
    gs.totalTime = 0;
    gs.score = { red: 0, blue: 0 };
    io.to(user.room).emit('gameStateUpdate', gs);
  });

  // === 💬 CHAT ===
  socket.on('sendMessage', (messageText) => {
    const user = users.get(socket.id);
    if (!user || !messageText?.trim()) return;

    const message = {
      id: Date.now().toString(),
      username: user.username,
      message: messageText.trim(),
      timestamp: new Date(),
    };

    addMessageToRoom(user.room, message);
    io.to(user.room).emit('newMessage', message);
    console.log(`💬 ${user.username} (${user.room}): ${messageText}`);
  });

  // === 🔌 DISCONNECT ===
  socket.on('disconnect', () => {
    const user = removeUserFromRoom(socket.id);
    if (!user) {
      console.log(`⚠️ Socket ${socket.id} déconnecté sans utilisateur associé`);
      return;
    }
    const room = rooms.get(user.room);
    if (room) {
      room.users = room.users.filter((u) => u.id !== user.id);
      socket.to(user.room).emit('userLeft', socket.id);
      io.to(user.room).emit('gameStateUpdate', room.gameState);
      io.to(user.room).emit('usersUpdate', room.users);

      if (room.users.length === 0) {
        // Suppression différée si la room est vide
        const existingTimer = roomDeletionTimers.get(user.room);
        if (!existingTimer) {
          const timer = setTimeout(
            () => {
              const r = rooms.get(user.room);
              if (r && r.users.length === 0) {
                rooms.delete(user.room);
                gameStates.delete(user.room);
                console.log(`🗑️ Salle ${user.room} supprimée après 5 min d'inactivité`);
              } else {
                console.log(`[ℹ️] Salle ${user.room} non supprimée: des utilisateurs ont rejoint entre-temps`);
              }
              roomDeletionTimers.delete(user.room);
            },
            5 * 60 * 1000
          ); // 5 minutes

          roomDeletionTimers.set(user.room, timer);
          console.log(`[⏳] Salle ${user.room} vide, suppression programmée dans 5 minutes`);
        }
      }
    }
  });

  // === ⚠️ GESTION D’ERREUR ===
  socket.on('error', (err) => {
    console.error(`❌ Erreur sur socket ${socket.id}:`, err);
  });
});

// --- HELPERS ---
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function getDefaultParameters() {
  return {
    ParametersTimeFirst: 20,
    ParametersTimeSecond: 90,
    ParametersTimeThird: 120,
    ParametersTeamReroll: 2,
    ParametersTeamMaxForbiddenWords: 6,
    ParametersTeamMaxPropositions: 5,
    ParametersPointsMaxScore: 3,
    ParametersPointsRules: 'no-tie',
    ParametersWordsListSelection: {
      veryCommon: true,
      lessCommon: true,
      rarelyCommon: false,
    },
  };
}

function initializeGameState() {
  return {
    currentPhase: 0,
    phases: [
      'Attente début de la manche',
      'Phase 1 - Choix du mot',
      'Phase 2 - Choix des mots interdits',
      'Phase 3 - Discours du Sage',
    ],
    teams: {
      red: { sage: null, disciples: [] },
      blue: { sage: null, disciples: [] },
    },
    spectators: [],
    timer: null,
    timeRemaining: 0,
    totalTime: 0,
    isPlaying: false,
    score: { red: 0, blue: 0 },
  };
}

function isUsernameAvailable(username, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return true;
  return !room.users.some((user) => user.username === username);
}

function createRoom(roomCode, parameters) {
  const room = {
    code: roomCode,
    users: [],
    messages: [],
    gameParameters: parameters,
    gameState: initializeGameState(),
  };
  rooms.set(roomCode, room);
  gameStates.set(roomCode, room.gameState);
  return room;
}

function addUserToRoom(user, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) {
    return { success: false, error: `La salle ${roomCode} n'existe pas.` };
  }

  // Initialiser le gameState si nécessaire
  if (!room.gameState) {
    room.gameState = initializeGameState();
  }

  // Ajouter l'utilisateur à la liste principale
  room.users.push(user);

  // Ajouter aux spectateurs
  room.gameState.spectators.push({
    id: user.id,
    username: user.username,
    room: user.room,
    team: user.team || 'spectator',
    role: user.role || 'spectator',
  });

  return { success: true, room };
}

function removeUserFromRoom(socketId) {
  const user = users.get(socketId);
  if (!user) return null;
  const room = rooms.get(user.room);
  const userToken = user.id;

  if (room) {
    room.users = room.users.filter((u) => u && u.id !== userToken);
    if (room.gameState) {
      const gs = room.gameState;
      gs.spectators = gs.spectators.filter((u) => u.id !== userToken);
      gs.teams.red.disciples = gs.teams.red.disciples.filter((u) => u.id !== userToken);
      gs.teams.blue.disciples = gs.teams.blue.disciples.filter((u) => u.id !== userToken);
      if (gs.teams.red.sage?.id === userToken) gs.teams.red.sage = null;
      if (gs.teams.blue.sage?.id === userToken) gs.teams.blue.sage = null;
    }
  }
  users.delete(socketId);
  return user;
}

function addMessageToRoom(roomCode, message) {
  const room = rooms.get(roomCode);
  if (room) {
    room.messages.push(message);
    return room;
  }
  return null;
}

function handleTeamJoin(userId, roomCode, team, role) {
  const room = rooms.get(roomCode);
  const user = users.get(userId);
  if (!room || !user || !room.gameState) return { error: 'Données de base manquantes' };

  // Vérifie si un Sage est déjà présent dans l'équipe
  if (role === 'sage' && room.gameState.teams[team]?.sage) {
    return { error: 'Il y a déjà un Sage dans cette équipe !' };
  }

  // Vérifie si le pseudo est déjà pris par un autre utilisateur dans la room (autre que l'utilisateur actuel)
  const isUsernameTaken = room.users.some((u) => u.username === user.username && u.id !== userId);
  if (isUsernameTaken) {
    return { error: 'Pseudo déjà utilisé dans cette salle' };
  }

  // Retire l'utilisateur de toutes ses positions dans la gameState (spectators, disciples, sages)
  room.gameState.spectators = room.gameState.spectators.filter((u) => u?.id !== userId);
  room.gameState.teams.red.disciples = room.gameState.teams.red.disciples.filter((u) => u?.id !== userId);
  room.gameState.teams.blue.disciples = room.gameState.teams.blue.disciples.filter((u) => u?.id !== userId);
  if (room.gameState.teams.red.sage?.id === userId) room.gameState.teams.red.sage = null;
  if (room.gameState.teams.blue.sage?.id === userId) room.gameState.teams.blue.sage = null;

  // Ajoute l'utilisateur avec sa nouvelle équipe et rôle
  const userWithTeam = { id: user.id, username: user.username, room: user.room, team, role };
  if (team === 'spectator') {
    room.gameState.spectators.push(userWithTeam);
  } else if (role === 'sage') {
    room.gameState.teams[team].sage = userWithTeam;
  } else {
    room.gameState.teams[team].disciples.push(userWithTeam);
  }

  // Met à jour l'utilisateur dans le store global users et dans la liste des users de la room
  users.set(userId, { ...user, team, role });
  const userIndex = room.users.findIndex((u) => u && u.id === userId);
  if (userIndex !== -1) {
    room.users[userIndex] = { ...room.users[userIndex], team, role };
  }

  return { success: true, gameState: room.gameState };
}
//TODO peut être utile plus tard
// function emitIfNotSilent(socket, event, data, options = { silent: false }) {
//   if (!options.silent) {
//     socket.emit(event, data);
//   } else {
//     console.log(`[SilentEmit] Suppressed "${event}" to ${socket.id}:`, data);
//   }
// }

// --- ROUTES ---
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    users: users.size,
  });
  //console.log([...rooms.keys()])
});

// --- SOCKET.IO EVENTS ---

// --- SERVER ---
//const PORT = process.env.PORT || 3000;
//server.listen(PORT, () => {
// console.log(`Server running on port ${PORT}`);
//});

// Timers et phases du jeu (moteur serveur)
function getPhaseDuration(parameters, phaseIndex) {
  const defaults = getDefaultParameters();
  const p = parameters || defaults;
  if (phaseIndex === 1) return p.ParametersTimeFirst ?? defaults.ParametersTimeFirst;
  if (phaseIndex === 2) return p.ParametersTimeSecond ?? defaults.ParametersTimeSecond;
  if (phaseIndex === 3) return p.ParametersTimeThird ?? defaults.ParametersTimeThird;
  return defaults.ParametersTimeFirst;
}

function clearPhaseTimer(roomCode) {
  const t = phaseTimers.get(roomCode);
  if (t) {
    clearInterval(t);
    phaseTimers.delete(roomCode);
  }
}

function startPhaseTimer(roomCode, duration) {
  const room = rooms.get(roomCode);
  if (!room || !room.gameState) return;

  room.gameState.isPlaying = true;
  room.gameState.totalTime = duration;
  if (!room.gameState.timeRemaining || room.gameState.timeRemaining <= 0 || room.gameState.timeRemaining > duration) {
    room.gameState.timeRemaining = duration;
  }
  io.to(roomCode).emit('gameStateUpdate', room.gameState);

  clearPhaseTimer(roomCode);
  const tick = setInterval(() => {
    const r = rooms.get(roomCode);
    if (!r || !r.gameState) {
      clearPhaseTimer(roomCode);
      return;
    }
    if (!r.gameState.isPlaying) return;
    r.gameState.timeRemaining = Math.max(0, (r.gameState.timeRemaining || 0) - 1);
    io.to(roomCode).volatile.emit('gameTick', {
      timeRemaining: r.gameState.timeRemaining,
      totalTime: r.gameState.totalTime,
      currentPhase: r.gameState.currentPhase,
    });
    io.to(roomCode).emit('gameStateUpdate', r.gameState);

    if (r.gameState.timeRemaining <= 0) {
      clearPhaseTimer(roomCode);
      onPhaseEnd(roomCode);
    }
  }, 1000);
  phaseTimers.set(roomCode, tick);
}

function startPhase(roomCode, phaseIndex) {
  const room = rooms.get(roomCode);
  if (!room || !room.gameState) return;
  room.gameState.currentPhase = phaseIndex;
  const duration = getPhaseDuration(room.gameParameters, phaseIndex);
  room.gameState.timeRemaining = duration;
  room.gameState.totalTime = duration;
  io.to(roomCode).emit('gameStateUpdate', room.gameState);
  startPhaseTimer(roomCode, duration);
}

function onPhaseEnd(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || !room.gameState) return;
  const phase = room.gameState.currentPhase;

  if (phase === 1) {
    // Auto enchaîne vers la Phase 2
    startPhase(roomCode, 2);
  } else if (phase === 2) {
    // Arrête et attend démarrage manuel de la Phase 3
    room.gameState.isPlaying = false;
    room.gameState.currentPhase = 3;
    room.gameState.timeRemaining = getPhaseDuration(room.gameParameters, 3);
    room.gameState.totalTime = room.gameState.timeRemaining;
    io.to(roomCode).emit('gameStateUpdate', room.gameState);
  } else if (phase === 3) {
    // Fin de manche: stop et retourne à l’attente
    room.gameState.isPlaying = false;
    room.gameState.currentPhase = 0;
    room.gameState.timeRemaining = 0;
    room.gameState.totalTime = 0;
    io.to(roomCode).emit('gameStateUpdate', room.gameState);
  }
}

const PORT = process.env.PORT || 3000;
console.log(`Démarrage du serveur sur le port ${PORT}...`);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
