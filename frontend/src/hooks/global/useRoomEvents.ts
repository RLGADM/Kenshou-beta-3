// src/hooks/app/useRoomEvents.ts
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '@/components/SocketContext';
import type { Room, User, Message, GameParameters } from '@/types';
import { emptyRoom, emptyUser } from '@/types';
import { useUserToken } from 'hooks/global/useUserToken';

export function useRoomEvents() {
  const { socket, isConnected } = useSocketContext();
  const navigate = useNavigate();
  const userToken = useUserToken();

  // --- États principaux
  const [currentUser, setCurrentUser] = useState<User>(emptyUser);
  const [currentRoom, setCurrentRoom] = useState<Room>(emptyRoom);
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inRoom, setInRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------
  // 🧩 Gestion des événements socket
  // --------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    // 🏠 Quand une room est créée
    socket.on('roomCreated', (room: Room) => {
      console.log('✅ Room créée côté client :', room);
      setCurrentRoom(room);
      setInRoom(true);

      localStorage.setItem('roomCode', room.code);
      navigate(`/room/${room.code}`);
    });

    // 🔄 Quand la liste des users est mise à jour
    socket.on('usersUpdate', (users: User[]) => {
      setRoomUsers(users);
      setCurrentRoom((prev) => ({ ...prev, users }));

      const token = userToken || localStorage.getItem('userToken');
      const me = users.find((u) => u.userToken === token);
      if (me) setCurrentUser(me);
    });

    // 💬 Messages reçus
    socket.on('newMessage', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    // 🧹 Cleanup
    return () => {
      socket.off('roomCreated');
      socket.off('usersUpdate');
      socket.off('newMessage');
    };
  }, [socket, navigate, userToken]);

  // --------------------------------------------------
  // 🚀 Créer une salle
  // --------------------------------------------------
  const handleCreateRoom = (username: string, mode: 'standard' | 'custom', parameters: GameParameters) => {
    if (!socket?.connected) {
      console.warn('❌ Impossible de créer la salle : socket non connecté');
      return;
    }

    socket.emit(
      'createRoom',
      { username, mode, parameters, userToken },
      (response: { success: boolean; roomCode?: string; error?: string }) => {
        if (response.success && response.roomCode) {
          localStorage.setItem('roomCode', response.roomCode);
          navigate(`/room/${response.roomCode}`);
        } else {
          console.error('Erreur création room :', response.error);
          setError(response.error ?? 'Erreur inconnue lors de la création.');
        }
      }
    );
  };

  // --------------------------------------------------
  // 🚪 Quitter la salle
  // --------------------------------------------------
  const handleLeaveRoom = () => {
    if (!socket || !currentRoom.code) return;
    socket.emit('leaveRoom', { roomCode: currentRoom.code, userToken });
    localStorage.removeItem('roomCode');
    setInRoom(false);
    setCurrentRoom(emptyRoom);
    setRoomUsers([]);
    setMessages([]);
    navigate('/');
  };

  // --------------------------------------------------
  // 📦 Retour du hook
  // --------------------------------------------------
  return {
    socket,
    isConnected,
    currentUser,
    setCurrentUser,
    currentRoom,
    setCurrentRoom,
    roomUsers,
    setRoomUsers,
    messages,
    setMessages,
    inRoom,
    setInRoom,
    error,
    setError,
    handleCreateRoom,
    handleLeaveRoom,
  };
}
