// --------------- IMPORT
import { useEffect } from 'react';
import { useRoomEvents } from '../global';
import { useRoomUIStates } from './useRoomUIStates';
import { useRoomUtils } from './useRoomUtils';
import { useRoomTeamActions } from './useRoomTeamActions';
import { useRoomGameActions } from './useRoomGameActions';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '@/components/SocketContext';
import { User } from '@/types';

// --------------- Hook principal pour RoomCreated
export function useRoomCreatedMain() {
  // Hook principal de la room (depuis votre architecture globale)
  const {
    socket: _unusedLocalSocket,
    currentUser,
    currentRoom,
    handleSendMessage,
    leaveRoom,
    hasJoinedRoomRef,
    hasRejoinAttempted,
    setCurrentRoom,
    handleJoinRoom,
    inRoom,
  } = useRoomEvents();
  const navigate = useNavigate();
  const { socket } = useSocketContext();

  // États UI
  const uiStates = useRoomUIStates();

  // Utilitaires
  const utils = useRoomUtils();

  // Actions d'équipes (branchées sur le socket global)
  // Actions d'équipes: câble avec les setters UI depuis uiStates
  const teamActions = useRoomTeamActions(socket, uiStates.setIsJoiningTeam, uiStates.setTeamJoinError);

  // Actions de jeu (branchées sur le socket global)
  const gameActions = useRoomGameActions(socket, handleSendMessage);

  // Effet pour nettoyer l'état isJoiningTeam quand l'utilisateur rejoint effectivement une équipe
  useEffect(() => {
    if (currentUser && currentUser.team) {
      uiStates.setIsJoiningTeam(false);
      uiStates.clearTeamJoinError();
    }
  }, [currentUser?.team]);

  // Écoute `usersUpdate` sur le socket global pour alimenter le compteur joueurs
  useEffect(() => {
    if (!socket) return;
    const onUsersUpdate = (users: User[]) => {
      setCurrentRoom((prev) => ({ ...prev, users }));
    };
    socket.on('usersUpdate', onUsersUpdate);
    return () => {
      socket.off('usersUpdate', onUsersUpdate);
    };
  }, [socket, setCurrentRoom]);

  // Permissions utilisateur
  const permissions = currentUser ? utils.checkPermissions(currentUser) : { isAdmin: false, canControlGame: false };

  // Actions combinées avec les utilitaires
  const enhancedActions = {
    ...gameActions,
    ...teamActions,
    // Mettre les utilitaires AVANT pour éviter d'écraser la copie locale
    ...utils,

    // Action pour copier le lien avec gestion de l'état (sans argument)
    copyRoomLink: () => {
      const code = currentRoom?.code;
      if (typeof code === 'string' && code) {
        utils.copyRoomLink(code, uiStates.setCopied);
      } else {
        console.warn('Room code indisponible ou invalide pour la copie:', code);
      }
    },

    // Envoyer proposition avec nettoyage automatique
    sendProposal: () => {
      gameActions.sendProposal(uiStates.proposal, uiStates.clearProposal);
    },

    // Quitter la room avec nettoyage
    handleLeaveRoom: () => {
      leaveRoom();
      hasJoinedRoomRef.current = false;
      hasRejoinAttempted.current = false;
      localStorage.setItem('hasLeftRoom', 'yes');
      localStorage.removeItem('lastRoomCode');
      navigate('/'); // redirection vers l’accueil
    },

    // Gérer reset avec fermeture de modal
    handleResetGame: () => {
      gameActions.resetGame();
      uiStates.setShowResetModal(false);
    },

    // Données de base (expose le socket global)
    socket,
    currentUser,
    currentRoom,
    inRoom,
    permissions,

    // Expose pour le modal pseudo
    handleJoinRoom,

    // États UI (inclut isJoiningTeam, teamJoinError, etc.)
    ...uiStates,
  };

  // Hydrater le code de la room depuis le localStorage pour cette instance
  useEffect(() => {
    const storedRoomCode = localStorage.getItem('roomCode') || localStorage.getItem('lastRoomCode');
    if (storedRoomCode && !currentRoom.code) {
      setCurrentRoom((prev) => ({ ...prev, code: storedRoomCode }));
    }
  }, [currentRoom.code, setCurrentRoom]);

  return enhancedActions;
}
