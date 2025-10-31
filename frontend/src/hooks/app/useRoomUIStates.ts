// --------------------------------------------------
// 🎛️ useRoomUIStates
// États locaux et gestion d’interface pour une room Kensho
// --------------------------------------------------

import { useState } from 'react';
import type { Room, User } from '@/types';
import { emptyRoom, emptyUser } from '@/types';

// --------------------------------------------------
// 🔹 Hook principal
// --------------------------------------------------
export function useRoomUIStates() {
  // 🧍 Joueur et salle actuelle
  const [currentUser, setCurrentUser] = useState<User>(emptyUser);
  const [currentRoom, setCurrentRoom] = useState<Room>(emptyRoom);

  // 💬 Messagerie & proposition
  const [proposal, setProposal] = useState('');
  const [copied, setCopied] = useState(false);

  // 🧩 Équipes
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);
  const [teamJoinError, setTeamJoinError] = useState<string | null>(null);

  // ⚙️ Modales
  const [showResetModal, setShowResetModal] = useState(false);

  // 🚀 Helpers rapides
  const clearProposal = () => setProposal('');
  const clearTeamJoinError = () => setTeamJoinError(null);

  // 💬 Fonction de simulation d’envoi de message
  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    console.log('📨 Message envoyé localement :', message);
    setProposal('');
  };

  // 🚪 Quitte la room localement (reset complet)
  const leaveRoom = () => {
    console.log('🚪 Sortie locale de la room');
    setCurrentRoom(emptyRoom);
    setCurrentUser(emptyUser);
  };

  // --------------------------------------------------
  // 📦 Retour des données et fonctions
  // --------------------------------------------------
  return {
    // Données principales
    currentUser,
    setCurrentUser,
    currentRoom,
    setCurrentRoom,

    // Messagerie
    proposal,
    setProposal,
    copied,
    setCopied,
    handleSendMessage,
    clearProposal,

    // Équipes
    isJoiningTeam,
    setIsJoiningTeam,
    teamJoinError,
    setTeamJoinError,
    clearTeamJoinError,

    // UI / Modales
    showResetModal,
    setShowResetModal,

    // Actions globales
    leaveRoom,
  };
}
