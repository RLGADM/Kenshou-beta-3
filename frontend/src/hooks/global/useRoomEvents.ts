// Hook central pour la gestion des événements de salle et du chat.
// Organisation:
// 1) États locaux et primitives
// 2) Helpers internes
// 3) Hydratation initiale (localStorage)
// 4) Listeners "room" (création/entrée/erreurs)
// 5) Listeners "updates" (users/messages/game/timer)
// 6) Actions UI (create/join/send/leave)
// 7) Valeurs exposées

import { useEffect, useState, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { useSocket } from './useSocket';
import { useSocketContext } from '@/components/SocketContext';
import { useUserToken } from './useUserToken';
import { GameParameters, Message, Room, User, GameState, emptyRoom, emptyUser } from '@/types';
import { toast } from 'react-hot-toast';

export function useRoomEvents() {
  // 1) États locaux et primitives
  const userToken = useUserToken();

  // Prend le socket global du contexte si disponible, sinon fallback local
  const { socket: ctxSocket } = useSocketContext();
  const { socket: localSocket, isConnected: localIsConnected } = useSocket();
  const socket = ctxSocket ?? localSocket;
  const socketIsConnected = Boolean(socket?.connected) || localIsConnected;

  const [currentUser, setCurrentUser] = useState<User>(emptyUser);
  const [currentRoom, setCurrentRoom] = useState<Room>(emptyRoom);
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState<boolean>(false);

  // Refs utiles à d’autres hooks pour gérer la reconnexion ou éviter les doubles-joins
  const hasJoinedRoomRef = useRef<boolean>(false);
  const hasRejoinAttempted = useRef<boolean>(false);

  // Garde: dernières transitions annoncées
  const hasGameStartedRef = useRef<boolean>(false);
  const suppressNextResumeRef = useRef<boolean>(false);
  // Séquence pour IDs uniques (évite collisions à la milliseconde)
  const msgSeqRef = useRef<number>(0);

  // Utilitaire pour formater le nom de phase (utilise `phases` si dispo)

  // Annonce contrôlée des transitions (phase / play-pause)

  // 2) Helpers internes (non exportés)
  const getSelfFromUsers = (users: User[], token: string) => {
    return users.find((u: any) => ((u as any).userToken ?? (u as any).id) === token);
  };

  // 3) Hydratation initiale depuis localStorage (facultative mais pratique)
  useEffect(() => {
    try {
      const lastUsernameRaw = localStorage.getItem('lastUsername');
      if (lastUsernameRaw) {
        const lastUsername = JSON.parse(lastUsernameRaw);
        if (typeof lastUsername === 'string' && lastUsername.trim()) {
          setCurrentUser((prev) => ({ ...prev, username: lastUsername.trim(), userToken }));
        }
      }
      // Hydrate le code de la room si présent (utile pour affichage)
      const storedRoomCode = localStorage.getItem('roomCode') || localStorage.getItem('lastRoomCode');
      if (storedRoomCode && !currentRoom.code) {
        setCurrentRoom((prev) => ({ ...prev, code: storedRoomCode }));
      }
    } catch (e) {
      console.warn('Hydratation localStorage échouée', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4) Listeners "room" (création/entrée/erreurs)
  useEffect(() => {
    if (!socket) return;

    const onRoomCreated = (room: Room) => {
      setCurrentRoom((prev) => ({ ...prev, ...room }));
      if (room?.code) {
        localStorage.setItem('roomCode', room.code);
        localStorage.setItem('lastRoomCode', room.code);
      }
      setError(null);
    };

    const onRoomJoined = (room: Room) => {
      setCurrentRoom((prev) => ({ ...prev, ...room }));
      if (room?.code) {
        localStorage.setItem('roomCode', room.code);
        localStorage.setItem('lastRoomCode', room.code);
      }
      setInRoom(true);
      hasJoinedRoomRef.current = true;
      setError(null);
    };

    const onRoomNotFound = () => {
      setError('Salle introuvable.');
      setInRoom(false);
      try {
        localStorage.removeItem('roomCode');
        localStorage.removeItem('lastRoomCode');
      } catch (e) {
        console.warn('Échec nettoyage localStorage', e);
      }
      // Notifier l’utilisateur avant la redirection
      toast.error('Salle introuvable — retour à l’accueil');
      // Rafraîchir automatiquement vers l’accueil pour éviter rester sur RoomCreated vide
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }, 1200);
    };

    const onUsernameTaken = () => {
      setError('Nom d’utilisateur déjà pris.');
    };

    socket.on('roomCreated', onRoomCreated);
    socket.on('roomJoined', onRoomJoined);
    socket.on('roomNotFound', onRoomNotFound);
    socket.on('usernameTaken', onUsernameTaken);

    return () => {
      socket.off('roomCreated', onRoomCreated);
      socket.off('roomJoined', onRoomJoined);
      socket.off('roomNotFound', onRoomNotFound);
      socket.off('usernameTaken', onUsernameTaken);
    };
  }, [socket]);

  // 5) Listeners "updates" (users/messages/game) + timer tick
  useEffect(() => {
    if (!socket) return;

    const onUsersUpdate = (users: User[]) => {
      setRoomUsers(users);
      // Alimente aussi l’objet currentRoom pour l’UI (compteur joueurs, filtres équipes/spectateurs)
      setCurrentRoom((prev) => ({ ...prev, users }));
  
      if (userToken) {
          const self = getSelfFromUsers(users, userToken);
          if (self) {
              setCurrentUser((prev) => ({ ...prev, ...self }));
          }
      }
    };

    const onNewMessage = (message: Message) => {
      // Dédup côté client: si un message avec le même id existe déjà, on ignore
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setCurrentRoom((prev) => {
        const existing = prev.messages || [];
        if (existing.some((m) => m.id === message.id)) return prev;
        return { ...prev, messages: [...existing, message] };
      });
    };

    const onGameStateUpdate = (gameState: GameState) => {
      setCurrentRoom((prev) => {
        const prevPhase = prev.gameState?.currentPhase ?? null;
        const nextPhase = gameState.currentPhase ?? null;
        const prevPlaying = prev.gameState?.isPlaying ?? false;
        const nextPlaying = gameState.isPlaying ?? false;

        const isInitialHydration = prevPhase === null;
        const isWaitingPhase = nextPhase === 0 || nextPhase === null;

        const shouldAnnouncePhase = prevPhase !== nextPhase && nextPhase !== null;
        const shouldAnnouncePlayPause = prevPlaying !== nextPlaying;

        // Réinitialiser la garde si retour à l’attente
        if (gameState.status !== 'started' && !gameState.isPlaying) {
          hasGameStartedRef.current = false;
        }

        if (shouldAnnouncePhase) {
          const isFirstStart = (prevPhase === 0 || isInitialHydration) && nextPhase === 1;

          const sysMsg: Message = {
            id: `sys-${Date.now()}-${++msgSeqRef.current}`,
            username: 'SYSTEM',
            message: isFirstStart
              ? 'La partie commence ! GL HF !'
              : nextPhase === 1
                ? 'Phase 1 - Choisissez votre mot'
                : nextPhase === 2
                  ? 'Phase 2 - Choisissez vos interdits'
                  : nextPhase === 3
                    ? 'Phase 3 - Préparez votre laius !'
                    : isInitialHydration && isWaitingPhase
                      ? 'Bienvenue sur Kensho !'
                      : 'Retour à l’attente',
            timestamp: new Date(),
          };

          if (isFirstStart) {
            hasGameStartedRef.current = true;
            suppressNextResumeRef.current = true; // évite "Jeu repris" juste après démarrage
          }

          setMessages((prevMsgs) => [...prevMsgs, sysMsg]);
          return { ...prev, gameState, messages: [...(prev.messages || []), sysMsg] };
        } else if (shouldAnnouncePlayPause) {
          const startingNow = !prevPlaying && nextPlaying;

          // Ne pas annoncer "Jeu repris" immédiatement après le tout premier démarrage
          if (startingNow && suppressNextResumeRef.current) {
            suppressNextResumeRef.current = false;
            return { ...prev, gameState };
          }

          const message = nextPlaying ? 'Jeu repris' : 'Jeu mis en pause';

          const sysMsg: Message = {
            id: `sys-${Date.now()}-${++msgSeqRef.current}`,
            username: 'SYSTEM',
            message,
            timestamp: new Date(),
          };
          setMessages((prevMsgs) => [...prevMsgs, sysMsg]);
          return { ...prev, gameState, messages: [...(prev.messages || []), sysMsg] };
        }

        return { ...prev, gameState };
      });
    };

    const onGameTick = (tick: { timeRemaining: number; totalTime?: number; currentPhase?: number }) => {
      setCurrentRoom((prev) => {
        const prevState = (prev.gameState || {}) as Partial<GameState>;
        const nextState = {
          ...prevState,
          timeRemaining: tick.timeRemaining,
          totalTime: typeof tick.totalTime === 'number' ? tick.totalTime : (prevState.totalTime ?? 0),
          currentPhase: typeof tick.currentPhase === 'number' ? tick.currentPhase : prevState.currentPhase,
          // Conserver le reste du state sans le modifier
          gameParameters: prevState.gameParameters ?? prev.parameters,
          status: prevState.status ?? 'waiting',
          isPlaying: prevState.isPlaying ?? false,
          rounds: prevState.rounds ?? [],
          currentRound: prevState.currentRound ?? 0,
          teams: prevState.teams ?? {
            red: { sage: null, disciples: [], score: 0 },
            blue: { sage: null, disciples: [], score: 0 },
          },
          spectators: prevState.spectators ?? [],
        } as GameState;

        return { ...prev, gameState: nextState };
      });

      // Pas de handleSendMessage ici pour éviter les doublons/spam.
    };
    socket.on('usersUpdate', onUsersUpdate);
    socket.on('newMessage', onNewMessage);
    socket.on('gameStateUpdate', onGameStateUpdate);
    socket.on('gameTick', onGameTick);

    return () => {
      socket.off('usersUpdate', onUsersUpdate);
      socket.off('newMessage', onNewMessage);
      socket.off('gameStateUpdate', onGameStateUpdate);
      socket.off('gameTick', onGameTick);
    };
  }, [socket, userToken]);

  // 6) Actions UI (create/join/send/leave) — alignées avec les appels externes
  const handleJoinRoom = async (socketParam: Socket, username: string, roomCode: string): Promise<boolean> => {
    if (!socketParam?.connected) return false;
    if (!userToken) return false;

    return new Promise((resolve) => {
      socketParam.emit('joinRoom', { username, roomCode, userToken }, (response: any) => {
        if (response?.success) {
          localStorage.setItem('lastRoomCode', roomCode);
          localStorage.setItem('roomCode', roomCode);
          localStorage.setItem('lastUsername', JSON.stringify(username));

          setInRoom(true);
          setCurrentRoom((prev) => ({ ...prev, code: roomCode }));
          // Correction: normalisation typée pour respecter User
          setCurrentUser((prev) => {
            const normalizedUsername = String(username ?? prev.username ?? '');
            const normalizedRoomCode = String(roomCode ?? prev.room ?? '');
            const normalizedSocketId = String(socketParam?.id ?? prev.socketId ?? '');
            const normalizedToken = String(userToken ?? prev.userToken ?? '');

            return {
              ...prev,
              userToken: normalizedToken,
              username: normalizedUsername,
              room: normalizedRoomCode,
              team: 'spectator',
              role: 'spectator',
              socketId: normalizedSocketId,
            } as User;
          });

          // Alignement côté serveur (par défaut spectateur)
          socketParam.emit('joinTeam', { roomCode, userToken, team: 'spectator', role: 'spectator' });

          hasJoinedRoomRef.current = true;
          setError(null);
          resolve(true);
        } else {
          setError(response?.error || 'Échec de la jointure de la salle.');
          localStorage.removeItem('lastRoomCode');
          setInRoom(false);
          resolve(false);
        }
      });
    });
  };

  const handleCreateRoom = (
    socketParam: Socket,
    username: string,
    gameMode: 'standard' | 'custom',
    parameters: GameParameters
  ) => {
    if (!socketParam) return;
    if (!username?.trim()) return;

    socketParam.emit(
      'createRoom',
      { username, gameMode, parameters, userToken },
      (response: { success: boolean; roomCode?: string; error?: string }) => {
        if (response?.success && response.roomCode) {
          setCurrentRoom((prev) => ({ ...prev, code: response.roomCode! }));
          // Joindre automatiquement la salle nouvellement créée
          handleJoinRoom(socketParam, username, response.roomCode!);
        } else {
          setError(response?.error || 'Erreur lors de la création de la salle.');
        }
      }
    );
  };

  // Envoyer un message (avec UI optimiste)
  const handleSendMessage = (message: string) => {
    if (!socket || !message?.trim()) return;
    socket.emit('sendMessage', message.trim());

    const msgObj: Message = {
      id: `client-${Date.now()}-${++msgSeqRef.current}`,
      username: currentUser.username,
      message: message.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msgObj]);
    setCurrentRoom((prev) => ({ ...prev, messages: [...(prev.messages || []), msgObj] }));
  };

  // Quitter la salle et nettoyer l’état
  const leaveRoom = () => {
    try {
      if (socket && currentRoom?.code) {
        socket.emit('leaveRoom', currentRoom.code);
      }
      localStorage.setItem('hasLeftRoom', 'true');
      localStorage.removeItem('roomCode');

      setInRoom(false);
      setCurrentRoom(emptyRoom);
      setRoomUsers([]);
      setMessages([]);
      setError(null);
      hasJoinedRoomRef.current = false;
    } catch (e) {
      console.warn('Erreur au leaveRoom', e);
    }
  };

  // 7) Valeurs exposées par le hook
  return {
    // Socket
    socket,
    socketIsConnected,

    // États
    currentUser,
    currentRoom,
    roomUsers,
    messages,
    error,
    inRoom,

    // Actions UI
    handleCreateRoom,
    handleJoinRoom,
    handleSendMessage,
    leaveRoom,

    // Expose pour autres hooks/compos
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
