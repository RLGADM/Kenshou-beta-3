import { useEffect } from 'react';
import { User, Room } from '@/types';
import { useSocketContext } from '@/components/SocketContext';
import { useRoomEvents } from '@/hooks';

export function useHydration() {
  const { socket } = useSocketContext();
  const { setCurrentUser, setCurrentRoom, setInRoom } = useRoomEvents();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRoom = localStorage.getItem('roomCode');
    const userToken = localStorage.getItem('userToken');

    if (storedUsername && storedRoom && socket?.connected) {
      socket.emit('hydrateUser', { username: storedUsername, roomCode: storedRoom, userToken });

      socket.once('roomJoined', ({ user, room }: { user: User; room: Room }) => {
        setCurrentUser(user);
        setCurrentRoom(room);
        setInRoom(true);
      });
    }
  }, [socket, setCurrentUser, setCurrentRoom, setInRoom]);
}
