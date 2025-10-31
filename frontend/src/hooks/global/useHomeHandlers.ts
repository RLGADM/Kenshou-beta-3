// src/hooks/home/useHomeHandlers.ts
import { useState, useCallback } from 'react';
import { GameParameters } from '@/types';
import { useSocketContext } from '@/components/SocketContext';
import { useRoomEvents } from '@/hooks/app/useRoomEvents';
import { getDefaultParameters } from '@/utils/defaultParameters';

export function useHomeHandlers(initialUsername = '') {
  // --------------------------------------------------
  // 🔹 Hooks principaux
  // --------------------------------------------------
  const { socket } = useSocketContext();
  const { inRoom, currentRoom, handleCreateRoom, handleJoinRoom } = useRoomEvents();

  // --------------------------------------------------
  // 🔹 États locaux
  // --------------------------------------------------
  const [username, setUsername] = useState(initialUsername);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isConfigModalOpen, setConfigModalOpen] = useState(false);
  const [gameMode, setGameMode] = useState<'standard' | 'custom'>('standard');
  const [parameters, setParameters] = useState<GameParameters>(getDefaultParameters());

  const socketIsConnected = !!socket?.connected;
  const roomCode = currentRoom?.code || null;

  // --------------------------------------------------
  // 🚀 startRoom — création directe sans modal
  // --------------------------------------------------
  const startRoom = useCallback(() => {
    if (!socketIsConnected || !socket) {
      setError('Connexion au serveur requise.');
      return;
    }
    if (!username.trim()) {
      setError('Pseudo requis.');
      return;
    }

    try {
      setIsCreating(true);
      handleCreateRoom(socket, username.trim(), gameMode, parameters);
      localStorage.setItem('lastUsername', JSON.stringify(username));
    } catch (err) {
      console.error('Erreur lors de la création du salon:', err);
      setError('Erreur lors de la création du salon.');
    } finally {
      setIsCreating(false);
    }
  }, [socket, socketIsConnected, username, gameMode, parameters, handleCreateRoom]);

  // --------------------------------------------------
  // ⚙️ Création via formulaire standard
  // --------------------------------------------------
  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      startRoom(); // ✅ utilise maintenant startRoom()
    },
    [startRoom]
  );

  // --------------------------------------------------
  // ⚙️ Rejoindre un salon
  // --------------------------------------------------
  const handleJoin = useCallback(
    async (eOrUsername: React.FormEvent | string, maybeRoomCode?: string) => {
      if (!socketIsConnected || !socket) return setError('Connexion au serveur requise.');

      let finalUsername = username.trim();
      let finalRoomCode = inputRoomCode.trim().toUpperCase();

      // Si l'appel vient en direct (handleJoin("pseudo", "ABC123"))
      if (typeof eOrUsername === 'string' && typeof maybeRoomCode === 'string') {
        finalUsername = eOrUsername.trim();
        finalRoomCode = maybeRoomCode.trim().toUpperCase();
      } else {
        (eOrUsername as React.FormEvent).preventDefault();
      }

      if (!finalUsername || !finalRoomCode) {
        return setError('Pseudo et code salon requis.');
      }

      try {
        setIsJoining(true);
        await handleJoinRoom(socket, finalUsername, finalRoomCode);
        localStorage.setItem('lastUsername', JSON.stringify(finalUsername));
      } catch (err) {
        console.error('Erreur lors de la connexion à la salle:', err);
        setError('Impossible de rejoindre le salon.');
      } finally {
        setIsJoining(false);
      }
    },
    [socket, socketIsConnected, username, inputRoomCode, handleJoinRoom]
  );

  // --------------------------------------------------
  // ⚙️ Confirmation du modal de configuration
  // --------------------------------------------------
  const handleConfigConfirm = useCallback(
    (providedUsername: string, selectedMode: 'standard' | 'custom', selectedParameters: GameParameters) => {
      setConfigModalOpen(false);
      setGameMode(selectedMode);
      setParameters(selectedParameters);

      if (!providedUsername.trim()) {
        setError('Veuillez entrer un pseudo.');
        return;
      }

      if (!socket) {
        setError('Connexion au serveur requise.');
        return;
      }
      console.log('avant create room');
      handleCreateRoom(socket, providedUsername.trim(), selectedMode, selectedParameters);
      console.log('apres create room');
      localStorage.setItem('lastUsername', JSON.stringify(providedUsername));
    },
    [socket, handleCreateRoom]
  );

  // --------------------------------------------------
  // 📦 Exports publics
  // --------------------------------------------------
  return {
    // Socket
    socket,
    socketIsConnected,

    // Utilisateur et room
    inRoom,
    roomCode,
    username,
    setUsername,

    // Création et jointure
    startRoom, // ✅ désormais disponible
    handleCreate,
    handleJoin,
    handleConfigConfirm,

    //inputs
    inputRoomCode,
    setInputRoomCode,

    // États UI
    isCreating,
    isJoining,
    isConfigModalOpen,
    setConfigModalOpen,

    // Paramètres de jeu
    gameMode,
    parameters,

    // Erreurs
    error,
    setError,
  };
}
