import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://*.netlify.app", "https://*.netlify.com"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Stockage en mémoire
const rooms = new Map();
const users = new Map();

// Génère un code de salon aléatoire
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Vérifie si un nom d'utilisateur est disponible dans un salon
function isUsernameAvailable(username, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return true;
  return !room.users.some(user => user.username === username);
}

// Crée un nouveau salon
function createRoom(roomCode) {
  const room = {
    code: roomCode,
    users: [],
    messages: []
  };
  rooms.set(roomCode, room);
  return room;
}

// Ajoute un utilisateur à un salon
function addUserToRoom(user, roomCode) {
  let room = rooms.get(roomCode);
  if (!room) {
    room = createRoom(roomCode);
  }
  
  room.users.push(user);
  users.set(user.id, { ...user, room: roomCode });
  return room;
}

// Supprime un utilisateur d'un salon
function removeUserFromRoom(userId) {
  const user = users.get(userId);
  if (!user) return null;
  
  const room = rooms.get(user.room);
  if (room) {
    room.users = room.users.filter(u => u.id !== userId);
    
    // Supprime le salon s'il est vide
    if (room.users.length === 0) {
      rooms.delete(user.room);
    }
  }
  
  users.delete(userId);
  return user;
}

// Ajoute un message à un salon
function addMessageToRoom(roomCode, message) {
  const room = rooms.get(roomCode);
  if (room) {
    room.messages.push(message);
    return room;
  }
  return null;
}

io.on('connection', (socket) => {
  console.log('Utilisateur connecté:', socket.id);

  // Créer un salon
  socket.on('createRoom', (username) => {
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));

    if (!isUsernameAvailable(username, roomCode)) {
      socket.emit('usernameTaken');
      return;
    }

    const user = {
      id: socket.id,
      username,
      room: roomCode
    };

    socket.join(roomCode);
    const room = addUserToRoom(user, roomCode);
    
    socket.emit('roomJoined', room);
    socket.to(roomCode).emit('userJoined', user);
    io.to(roomCode).emit('usersUpdate', room.users);
    
    console.log(`${username} a créé et rejoint le salon ${roomCode}`);
  });

  // Rejoindre un salon
  socket.on('joinRoom', (username, roomCode) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('roomNotFound');
      return;
    }

    if (!isUsernameAvailable(username, roomCode)) {
      socket.emit('usernameTaken');
      return;
    }

    const user = {
      id: socket.id,
      username,
      room: roomCode
    };

    socket.join(roomCode);
    addUserToRoom(user, roomCode);
    
    socket.emit('roomJoined', room);
    socket.to(roomCode).emit('userJoined', user);
    io.to(roomCode).emit('usersUpdate', room.users);
    
    console.log(`${username} a rejoint le salon ${roomCode}`);
  });

  // Envoyer un message
  socket.on('sendMessage', (messageText) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: Date.now().toString(),
      username: user.username,
      message: messageText,
      timestamp: new Date()
    };

    addMessageToRoom(user.room, message);
    io.to(user.room).emit('newMessage', message);
    
    console.log(`Message de ${user.username} dans ${user.room}: ${messageText}`);
  });

  // Déconnexion
  socket.on('disconnect', () => {
    const user = removeUserFromRoom(socket.id);
    if (user) {
      socket.to(user.room).emit('userLeft', socket.id);
      
      const room = rooms.get(user.room);
      if (room) {
        io.to(user.room).emit('usersUpdate', room.users);
      }
      
      console.log(`${user.username} a quitté le salon ${user.room}`);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});