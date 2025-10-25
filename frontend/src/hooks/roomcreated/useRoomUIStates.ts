// --------------- IMPORT
import { useState, useRef } from 'react';

// --------------- Hook pour gérer tous les états UI de RoomCreated
export function useRoomUIStates() {
  // États des modales et UI
  const [proposal, setProposal] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [teamJoinError, setTeamJoinError] = useState<string | null>(null);
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);

  // Refs
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Actions UI
  const clearProposal = () => setProposal('');
  const clearTeamJoinError = () => setTeamJoinError(null);

  const showError = (error: string, duration = 3000) => {
    setTeamJoinError(error);
    setTimeout(clearTeamJoinError, duration);
  };

  return {
    // États
    proposal,
    copied,
    showPlayersModal,
    showResetModal,
    teamJoinError,
    isJoiningTeam,
    historyEndRef,

    // Setters
    setProposal,
    setCopied,
    setShowPlayersModal,
    setShowResetModal,
    setTeamJoinError,
    setIsJoiningTeam,

    // Actions utilitaires
    clearProposal,
    clearTeamJoinError,
    showError,
  };
}
