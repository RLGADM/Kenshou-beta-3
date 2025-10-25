// --------------- IMPORT
import { SocketType } from '../../types';
import { useRef } from 'react';

// --------------- Hook pour gérer les actions de jeu
export function useRoomGameActions(socket: SocketType | null, handleSendMessage: (message: string) => void) {
  const wasPausedRef = useRef(false);
  const announcedResumeRef = useRef(false);

  // Démarrer ou reprendre la partie (ton UI appelle startGame pour les deux cas)
  const startGame = () => {
    if (!socket) {
      console.log('No socket connection for starting game');
      return;
    }
    console.log('[FRONT] Emitting startGame', { socketId: socket.id });
    // Ne pas annoncer ici; l’annonce “Jeu repris” sera faite par onGameStateUpdate
    socket.emit('startGame');
  };

  // Mettre en pause la partie
  const pauseGame = () => {
    if (!socket) {
      console.log('No socket connection for pausing game');
      return;
    }
    console.log('[FRONT] Emitting pauseGame', { socketId: socket.id });
    // Ne pas annoncer ici; l’annonce “Jeu mis en pause” sera faite par onGameStateUpdate
    socket.emit('pauseGame');

    // La prochaine reprise doit annoncer "Jeu repris" une seule fois
    wasPausedRef.current = true;
    announcedResumeRef.current = false;
  };

  // Réinitialiser la partie
  const resetGame = () => {
    if (!socket) {
      console.log('No socket connection for resetting game');
      return;
    }
    console.log('[FRONT] Emitting resetGame', { socketId: socket.id });
    handleSendMessage('La partie a été réinitialisée.');
    socket.emit('resetGame');
  };

  // Envoyer une proposition
  const sendProposal = (proposal: string, clearProposal: () => void) => {
    if (!proposal.trim()) return;

    handleSendMessage(`[Proposition] ${proposal.trim()}`);
    clearProposal();
  };

  // Actions de debug (pour le développement)
  const sendPing = () => {
    if (socket) {
      console.log('Sending ping to server...');
      socket.emit('ping');
    }
  };

  // Reprendre la partie (resume)
  const resumeGame = () => {
    if (!socket) {
      console.log('No socket connection for resuming game');
      return;
    }
    console.log('[FRONT] Emitting resumeGame', { socketId: socket.id });
    // Use any cast because resumeGame may not be declared in ClientToServerEvents
    (socket as any).emit('resumeGame');
  };

  const requestDebugInfo = () => {
    if (socket) {
      console.log('Requesting debug info from server...');
      socket.emit('debugGetUsers');
    }
  };

  return {
    startGame,
    pauseGame,
    resumeGame,
    //resumeGame,
    resetGame,
    sendProposal,
    sendPing,
    requestDebugInfo,
  };
}
