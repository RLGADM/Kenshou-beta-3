// --------------------------------------------------
// 🎮 useRoomEvents — Hook central de la salle Kensho
// --------------------------------------------------
// Gère :
// 1️⃣ Les événements Socket.IO (create, join, users, messages, game state…)
// 2️⃣ La synchro avec le localStorage
// 3️⃣ La redirection vers /room/:code après création ou jointure
// --------------------------------------------------

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

import { useSocketContext } from '@/components/SocketContext';
import { useSocket } from '@/hooks/global/useSocket';
import { ensureUserToken } from '@/utils/userToken';
import type { User, Message, GameRoom, GameState, GameParameters } from '@/types/game';
import { defaultGameState } from "@/hooks/room/useRoomGameLogic";
import { getDefaultParameters } from "@/utils/defaultParameters";     




// --------------------------------------------------
// 💾 Valeurs initiales
// --------------------------------------------------
const initialUser: User = {
  id: '',
  userToken: '',
  username: '',
  team: 'spectator',
  role: 'spectator',
  isAdmin: true,
  socketId: '',
};

const initialRoom: GameRoom = {
  code: "",
  mode: "standard",
  users: [],
  messages: [],
  redTeam: [],
  blueTeam: [],
  gameParameters: { ...getDefaultParameters() }, // ✅ fonction appelée
  gameState: { ...defaultGameState },
  roundsPlayed: 0,
  createdAt: Date.now(),
};


// --------------------------------------------------
// 🧩 Hook principal
// --------------------------------------------------
export function useRoomEvents() {
  const navigate = useNavigate();

  // 🧩 Récupération sécurisée du contexte socket
  let ctxSocket: Socket | null = null;
  let localIsConnected = false;

  try {
    const ctx = useSocketContext();
    ctxSocket = ctx.socket;
    localIsConnected = ctx.isConnected;
  } catch (err) {
    console.warn("⚠️ useSocketContext appelé sans provider → fallback useSocket()");
  }

  const { socket: localSocket, isConnected: localConnected } = useSocket();
  const socket = ctxSocket ?? localSocket;
  const socketIsConnected = Boolean(socket?.connected) || localIsConnected || localConnected;

  // 🔑 Token utilisateur
  const userToken = ensureUserToken();

  // 🧠 États React
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [currentRoom, setCurrentRoom] = useState<GameRoom>(initialRoom);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState(false);

  // ⚙️ Refs persistantes (utile pour reconnexion)
  const hasJoinedRoomRef = useRef(false);
  const hasRejoinAttempted = useRef(false);
  const msgSeqRef = useRef(0);

  // --------------------------------------------------
  // 🧰 Helper : retrouver l’utilisateur local
  // --------------------------------------------------
  const findSelf = useCallback(
    (users: User[], token: string) => users.find((u) => u.userToken === token || u.id === token),
    []
  );

  // --------------------------------------------------
  // 💾 Hydratation locale (localStorage)
  // --------------------------------------------------
  useEffect(() => {
    try {
      const storedUsername = localStorage.getItem('lastUsername');
      const storedRoom = localStorage.getItem('lastRoomCode');

      if (storedUsername) {
        setCurrentUser((prev) => ({
          ...prev,
          username: JSON.parse(storedUsername),
          id: userToken ?? prev.id,
        }));
      }

      if (storedRoom && !currentRoom.code) {
        setCurrentRoom((prev) => ({ ...prev, code: storedRoom }));
      }
    } catch (err) {
      console.warn('⚠️ Erreur hydratation localStorage', err);
    }
  }, [userToken]);

  // --------------------------------------------------
  // 🎧 Listeners socket — room / users / messages / game
  // --------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    // 🏠 Room créée
    const onRoomCreated = (room: GameRoom) => {
      console.log('✅ roomCreated reçu →', room);
      if (!room?.code) return console.warn('⚠️ roomCreated sans code valide');

      // 🔄 Stockage local
      localStorage.setItem('roomCode', room.code);
      localStorage.setItem('lastRoomCode', room.code);
      localStorage.setItem('hasLeftRoom', 'false');
      localStorage.setItem('inRoom', 'true');

      // 🔁 Mise à jour des états
      setCurrentRoom(room);
      setInRoom(true);

      // 👤 Synchroniser currentUser
      const storedToken = localStorage.getItem('userToken');
      const me = room.users.find((u) => u.userToken === storedToken || u.id === storedToken);
      if (me) setCurrentUser(me);

      console.log(`🚀 Salle ${room.code} rejointe automatiquement`);
      navigate(`/room/${room.code}`); // ✅ redirection immédiate
    };

    // 🙋 Rejoint une room
    const onRoomJoined = (room: GameRoom) => {
      setCurrentRoom(room);
      setInRoom(true);
      hasJoinedRoomRef.current = true;
      localStorage.setItem('lastRoomCode', room.code);
      localStorage.setItem('inRoom', 'true');
      toast.success(`Connecté à la salle ${room.code}`);

      navigate(`/room/${room.code}`); // ✅ redirection
    };

    // ❌ Room introuvable
    const onRoomNotFound = () => {
      setError('Salle introuvable');
      toast.error('Salle introuvable — retour à l’accueil');
      localStorage.removeItem('lastRoomCode');
      setTimeout(() => (window.location.href = '/'), 1500);
    };

    // 🚫 Nom déjà pris
    const onUsernameTaken = () => toast.error('Nom d’utilisateur déjà pris');

    // 👥 MAJ des utilisateurs
    const onUsersUpdate = (users: User[]) => {
      setCurrentRoom((prev) => ({ ...prev, users }));
      const self = userToken ? findSelf(users, userToken) : null;
      if (self) setCurrentUser((prev) => ({ ...prev, ...self }));
    };

    // 💬 Nouveau message
    const onNewMessage = (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    // 🕹️ MAJ état de jeu
    const onGameStateUpdate = (state: GameState) => {
      setCurrentRoom((prev) => ({ ...prev, gameState: state }));
    };

    // 🔗 Liaison Socket.IO
    socket.on('roomCreated', onRoomCreated);
    socket.on('roomJoined', onRoomJoined);
    socket.on('roomNotFound', onRoomNotFound);
    socket.on('usernameTaken', onUsernameTaken);
    socket.on('usersUpdate', onUsersUpdate);
    socket.on('newMessage', onNewMessage);
    socket.on('gameStateUpdate', onGameStateUpdate);

    return () => {
      socket.off('roomCreated', onRoomCreated);
      socket.off('roomJoined', onRoomJoined);
      socket.off('roomNotFound', onRoomNotFound);
      socket.off('usernameTaken', onUsernameTaken);
      socket.off('usersUpdate', onUsersUpdate);
      socket.off('newMessage', onNewMessage);
      socket.off('gameStateUpdate', onGameStateUpdate);
    };
  }, [socket, userToken, findSelf, navigate]);

  // --------------------------------------------------
  // 🎮 Actions principales
  // --------------------------------------------------

  // ➕ Créer une room
  const handleCreateRoom = useCallback(
    (socketParam: Socket, username: string, mode: 'standard' | 'custom', parameters: GameParameters) => {
      if (!socketParam?.connected) return;
      socketParam.emit('createRoom', { username, mode, parameters, userToken });
    },
    [userToken]
  );

  // 🔗 Rejoindre une room
  const handleJoinRoom = useCallback(
    async (socketParam: Socket, username: string, roomCode: string): Promise<boolean> => {
      if (!socketParam?.connected) return false;

      return new Promise((resolve) => {
        socketParam.emit('joinRoom', { username, roomCode, userToken }, (res: any) => {
          if (res?.success) {
            localStorage.setItem('lastUsername', JSON.stringify(username));
            localStorage.setItem('lastRoomCode', roomCode);
            setCurrentUser((prev) => ({ ...prev, username }));
            setCurrentRoom((prev) => ({ ...prev, code: roomCode }));
            setInRoom(true);
            hasJoinedRoomRef.current = true;
            resolve(true);
          } else {
            toast.error(res?.error || 'Erreur lors de la connexion à la salle');
            resolve(false);
          }
        });
      });
    },
    [userToken]
  );

  // ✉️ Envoyer un message
  const handleSendMessage = useCallback(
    (content: string) => {
      if (!socket || !content.trim()) return;
      const message: Message = {
        id: `client-${Date.now()}-${++msgSeqRef.current}`,
        username: currentUser.username,
        message: content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, message]);
      socket.emit('sendMessage', message);
    },
    [socket, currentUser.username]
  );

  // 🚪 Quitter la room
  const leaveRoom = useCallback(() => {
    if (!socket || !currentRoom.code) return;
    socket.emit('leaveRoom', currentRoom.code);
    setInRoom(false);
    setCurrentRoom(initialRoom);
    setMessages([]);
    localStorage.setItem('inRoom', 'false');
    localStorage.removeItem('lastRoomCode');
    toast('Tu as quitté la salle 👋');
  }, [socket, currentRoom.code]);

  // --------------------------------------------------
  // 🔁 Valeur exportée
  // --------------------------------------------------
  return {
    socket,
    socketIsConnected,
    currentUser,
    currentRoom,
    messages,
    error,
    inRoom,

    // Actions
    handleCreateRoom,
    handleJoinRoom,
    handleSendMessage,
    leaveRoom,

    // Setters & refs
    setCurrentUser,
    setCurrentRoom,
    setInRoom,
    hasJoinedRoomRef,
    hasRejoinAttempted,
  };
}
