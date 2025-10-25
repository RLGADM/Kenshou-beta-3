import type { ClientToServerEvents, ServerToClientEvents } from '../../types';
import type { Socket } from 'socket.io-client';

export function useRoomTeamActions(
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null,
  setIsJoiningTeam: (value: boolean) => void,
  setTeamJoinError: (error: string | null) => void
) {
  // Rejoindre une équipe
  const joinTeam = (
    team: 'red' | 'blue' | 'spectator',
    role?: 'sage' | 'disciple' | 'spectator'
  ) => {
    if (!socket) {
      setTeamJoinError('Connexion au serveur perdue');
      return;
    }

    const roomCode =
      localStorage.getItem('roomCode') ||
      localStorage.getItem('lastRoomCode') ||
      '';
    const userToken = localStorage.getItem('userToken') || '';
    const username =
      localStorage.getItem('username') ||
      (() => {
        try {
          const raw = localStorage.getItem('lastUsername');
          return raw ? JSON.parse(raw) : '';
        } catch {
          return '';
        }
      })();

    setIsJoiningTeam(true);
    setTeamJoinError(null);

    const normalizedRole = role ?? (team === 'spectator' ? 'spectator' : 'disciple');

    const ack = (resp: { success: boolean; message?: string }) => {
      setIsJoiningTeam(false);
      if (!resp?.success) {
        setTeamJoinError(resp?.message || "Erreur lors de la jonction de l’équipe");
      }
    };

    // Fallback legacy si les données manquent: le serveur déduit via socket.id
    if (!roomCode || !userToken) {
      (socket as any).emit('joinTeam', team, normalizedRole, ack);
    } else {
      socket.emit(
        'joinTeam',
        { roomCode, userToken, username, team, role: normalizedRole },
        ack
      );
    }

    setTimeout(() => {
      setIsJoiningTeam(false);
    }, 5000);
  };

  const joinSpectator = () => {
    joinTeam('spectator', 'spectator');
  };

  return { joinTeam, joinSpectator };
}
