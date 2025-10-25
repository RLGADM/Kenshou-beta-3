// import framework
import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
// import ts et hooks
import { useSocket } from './useSocket';
import { GameParameters, Message, Room, User, emptyRoom, emptyUser } from '@/types';
import { useUserToken } from './useUserToken';

export function useRoomEvents() {
  // Déclaration ts hooks
  const userToken = useUserToken();
  const { socket, isConnected: socketIsConnected } = useSocket();
  const [currentUser, setCurrentUser] = useState<User>(emptyUser);
  const [currentRoom, setCurrentRoom] = useState<Room>(emptyRoom);
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState<boolean>(false);

  // Refs utilisés par RoomCreatedMain
  const hasJoinedRoomRef = useRef<boolean>(false);
  const hasRejoinAttempted = useRef<boolean>(false);

  // Écoute des événements de room
  useEffect(() => {
    if (!socket) return;

    socket.on('roomCreated', (room: Room) => {
      setCurrentRoom(room);
      setInRoom(true);
    });

    return () => {
      socket.off('roomCreated');
    };
  }, [socket]);

  // Hydrater le code de la room depuis le localStorage au montage
  useEffect(() => {
    const storedRoomCode = localStorage.getItem('roomCode') || localStorage.getItem('lastRoomCode');
    if (storedRoomCode && !currentRoom.code) {
      setCurrentRoom((prev) => ({ ...prev, code: storedRoomCode }));
    }
  }, []);

  // Autres listeners socket (users/messages)
  useEffect(() => {
    if (!socket) return;

    const onUsersUpdate = (users: User[]) => {
      // hydrate la liste des utilisateurs
      setRoomUsers(users);

      // met à jour currentRoom.users pour le compteur
      setCurrentRoom((prev) => ({ ...prev, users }));

      // synchronise currentUser avec la source serveur (token: userToken côté front, id côté serveur)
      const storedToken = userToken || localStorage.getItem('userToken') || '';
      const self = users.find(
        (u: any) => ((u as any).userToken ?? (u as any).id) === storedToken
      );
      if (self) {
        setCurrentUser((prev) => ({
          ...prev,
          ...self,
          // Normalise : toujours avoir userToken côté front
          userToken: (self as any).userToken ?? (self as any).id,
        }));
      }
    };

    const onNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('usersUpdate', onUsersUpdate);
    socket.on('newMessage', onNewMessage);

    return () => {
      socket.off('usersUpdate', onUsersUpdate);
      socket.off('newMessage', onNewMessage);
    };
  }, [socket, userToken]);

    setCurrentRoom((prev) => ({ ...prev, users }));

      // Hydrate currentUser depuis la liste renvoyée par le serveur
      const myToken = localStorage.getItem('userToken');
      const self = users.find((u: any) => u?.id === myToken || u?.userToken === myToken);
      if (self) {
        setCurrentUser((prev) => ({
          ...prev,
          ...self,
          // Normalise : toujours avoir userToken côté front
          userToken: self.userToken ?? self.id,
        }));
      }
    });

    socket.on('newMessage', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('usersUpdate');
      socket.off('newMessage');
    };
  }, [socket]);

  const handleJoinRoom = async (socket: Socket, username: string, roomCode: string): Promise<boolean> => {
    if (!socket?.connected) return false;
    if (!userToken) return false;

    return new Promise((resolve) => {
      socket.emit('joinRoom', { username, roomCode, userToken }, (response: any) => {
        if (response.success) {
          localStorage.setItem('lastRoomCode', roomCode);
          localStorage.setItem('roomCode', roomCode);
          localStorage.setItem('lastUsername', JSON.stringify(username));
          setInRoom(true);
          setCurrentRoom((prev) => ({ ...prev, code: roomCode }));

          // Hydrate immédiatement currentUser côté client
          setCurrentUser((prev) => ({
            ...prev,
            userToken,
            username,
            room: roomCode,
            team: 'spectator',
            role: 'spectator',
            socketId: socket.id,
          }));

          // Aligner côté serveur (avec role explicite)
          socket.emit('joinTeam', { roomCode, userToken, team: 'spectator', role: 'spectator' });
          resolve(true);
        } else {
          setError(response.error);
          localStorage.removeItem('lastRoomCode');
          resolve(false);
        }
      });
    });
  };

  const handleCreateRoom = (
    socket: Socket,
    username: string,
    gameMode: 'standard' | 'custom',
    parameters: GameParameters
  ) => {
    if (!socket) return;

    socket.emit(
      'createRoom',
      { username, gameMode, parameters, userToken },
      (response: { success: boolean; roomCode?: string; error?: string }) => {
        if (response.success && response.roomCode) {
          handleJoinRoom(socket, username, response.roomCode);
          setCurrentRoom((prev) => ({ ...prev, code: response.roomCode }));
        } else {
          setError(response.error || 'Erreur lors de la création de la salle.');
        }
      }
    );
  };

  //TODO le déplacer dans le hook du game
  // const handleLeaveRoom = () => {
  //   if (!socket || !currentRoom) return;

  //   socket.emit('leaveRoom', currentRoom.code);
  //   setRoomUsers([]);
  //   setMessages([]);
  //   setError(null);
  // };

  const handleSendMessage = (message: string) => {
    if (!socket || !message?.trim()) return;
    socket.emit('sendMessage', message.trim());
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        username: currentUser.username,
        message: message.trim(),
        timestamp: new Date(),
      },
    ]);
  };

  const leaveRoom = () => {
    if (socket && currentRoom?.code) {
      socket.emit('leaveRoom', currentRoom.code);
    }
    localStorage.setItem('hasLeftRoom', 'yes');
    localStorage.removeItem('lastRoomCode');
    setInRoom(false);
    setCurrentRoom(emptyRoom);
    setRoomUsers([]);
    setMessages([]);
    setError(null);
  };

  return {
    // Retourner le socket du hook central
    socket,
    currentUser,
    currentRoom,
    roomUsers,
    messages,
    error,
    inRoom,
    socketIsConnected,
    handleCreateRoom,
    handleJoinRoom,
    handleSendMessage,
    leaveRoom,
    hasJoinedRoomRef,
    hasRejoinAttempted,
    setCurrentUser,
    setCurrentRoom,
    setInRoom,
    setRoomUsers,
    setMessages,
    setError,
  };
}
