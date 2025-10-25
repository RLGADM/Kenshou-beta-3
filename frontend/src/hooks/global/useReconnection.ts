import { useEffect, MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

type Params = {
  socket: any;
  isConnected: boolean;
  hasRejoinAttempted: MutableRefObject<boolean>;
  handleJoinRoom: (socket: any, username: string, roomCode: string) => Promise<boolean>;
  setInRoom: (inRoom: boolean) => void;
};

export function useReconnection({ socket, isConnected, hasRejoinAttempted, handleJoinRoom, setInRoom }: Params) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected || hasRejoinAttempted.current) return;

    hasRejoinAttempted.current = true;

    const userToken = localStorage.getItem('userToken');
    const hasLeftRoom = localStorage.getItem('hasLeftRoom');

    // Fallback sur roomCode si lastRoomCode absent
    const roomCode = localStorage.getItem('lastRoomCode') || localStorage.getItem('roomCode');

    // Fallback sur username si lastUsername absent
    const lastUsernameRaw = localStorage.getItem('lastUsername');
    const usernameStored = localStorage.getItem('username');
    const username = lastUsernameRaw ? JSON.parse(lastUsernameRaw) : (usernameStored || '');

    // Prérequis stricts
    if (!userToken || !roomCode || !username) {
      setInRoom(false);
      return;
    }
    if (hasLeftRoom === 'true' || hasLeftRoom === 'yes') {
      setInRoom(false);
      return;
    }

    // Tentative de reconnexion
    handleJoinRoom(socket, username, roomCode).then((success) => {
      if (success) {
        setInRoom(true);
        navigate(`/room/${roomCode}`);
      } else {
        // Échec: informer et nettoyer le localStorage
        setInRoom(false);
        localStorage.removeItem('roomCode');
        localStorage.removeItem('lastRoomCode');
        toast.error(`Le salon ${roomCode} n'existe plus ou a été supprimé.`);
      }
    });
  }, [isConnected]);
}
