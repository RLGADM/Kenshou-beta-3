// --------------- IMPORT
import { User } from '../../types';

// --------------- Hook utilitaire pour les fonctions de formatage et helpers
export function useRoomUtils() {
  // Formatage du temps pour les messages
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatage du timer de jeu
  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Copier le lien de la room
  const copyRoomLink = async (roomCode: string, setCopied: (value: boolean) => void) => {
    const roomUrl = `${window.location.origin}/room/${roomCode}`;

    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = roomUrl;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    };

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(roomUrl);
      } else {
        fallbackCopy();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Clipboard API a échoué, fallback utilisé:', error);
      try {
        fallbackCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Erreur lors de la copie (fallback):', fallbackError);
      }
    }
  };

  // Obtenir les données pour le rendu d'une carte utilisateur
  const getUserCardData = (user: User, currentUser: User) => {
    // Le serveur peut utiliser `id`, le front `userToken` → fallback multiples
    const currentToken = (currentUser as any).userToken ?? (currentUser as any).id ?? currentUser.socketId;
    const userToken = (user as any).userToken ?? (user as any).id ?? user.socketId;

    // Détection robuste du joueur courant
    const isCurrentUser = currentToken
      ? userToken === currentToken
      : user.username === currentUser.username;

    const team = user.team || 'spectator';
    const role = user.role || 'spectator';

    const teamColor = team === 'red' ? 'red' : team === 'blue' ? 'blue' : 'gray';
    const highlight = isCurrentUser ? 'ring-2 ring-yellow-400/50' : '';
    const bgColor =
      team === 'red'
        ? 'bg-red-500/20 border-red-300/30'
        : team === 'blue'
          ? 'bg-blue-500/20 border-blue-300/30'
          : 'bg-gray-500/20 border-gray-300/30';

    return {
      bgColor,
      teamColor,
      highlight,
      isCurrentUser,
      team,
      role,
      user,
    };
  };

  // Vérifier les permissions
  const checkPermissions = (currentUser: User) => {
    const isAdmin = currentUser.isAdmin || false;
    const canControlGame = isAdmin; // Peut être étendu selon vos règles métier

    return {
      isAdmin,
      canControlGame,
    };
  };

  return {
    formatTime,
    formatTimer,
    copyRoomLink,
    getUserCardData,
    checkPermissions,
  };
}
