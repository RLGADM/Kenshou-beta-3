// --------------------------------------------------
// 🎯 useRoomTeamAction — Gestion intelligente des équipes et rôles
// --------------------------------------------------

import { useCallback } from 'react';
import { useSocketContext } from '@/components/SocketContext';
import { useRoomEvents } from '@/hooks/app/useRoomEvents';
import type { User } from '@/types/game';

// --------------------------------------------------
// 🔹 Hook principal
// --------------------------------------------------
export function useRoomTeamAction() {
  const { socket } = useSocketContext();
  const { currentRoom, currentUser, setCurrentUser, setCurrentRoom } = useRoomEvents();

  // --------------------------------------------------
  // 🧩 Changer d’équipe
  // --------------------------------------------------
  const changeTeam = useCallback(
    (newTeam: 'red' | 'blue' | 'spectator') => {
      if (!socket || !currentRoom || !currentUser) return;
      if (currentUser.team === newTeam) return;

      // ✅ on garde toutes les propriétés du currentUser
      const updatedUser: User = { ...currentUser, team: newTeam };

      setCurrentUser(updatedUser);
      setCurrentRoom((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.userToken === currentUser.userToken ? updatedUser : u)),
      }));

      socket.emit('changeTeam', {
        roomCode: currentRoom.code,
        userToken: currentUser.userToken,
        newTeam,
      });

      console.log(`🟥 ${currentUser.username} a rejoint l’équipe ${newTeam}`);
    },
    [socket, currentRoom, currentUser, setCurrentUser, setCurrentRoom]
  );

  // --------------------------------------------------
  // 🧠 Attribution automatique du rôle selon l’équipe
  // --------------------------------------------------
  const autoAssignRole = useCallback(
    (team: 'red' | 'blue' | 'spectator') => {
      if (!currentRoom) return 'spectator';
      if (team === 'spectator') return 'spectator';

      const teamUsers = currentRoom.users.filter((u) => u.team === team);
      const hasSage = teamUsers.some((u) => u.role === 'sage');
      return hasSage ? 'disciple' : 'sage';
    },
    [currentRoom]
  );

  // --------------------------------------------------
  // 🎭 Changer de rôle (manuel)
  // --------------------------------------------------
  const changeRole = useCallback(
    (newRole: 'sage' | 'disciple' | 'spectator') => {
      if (!socket || !currentRoom || !currentUser) return;

      if (newRole === 'sage') {
        const sameTeamSage = currentRoom.users.find(
          (u) => u.team === currentUser.team && u.role === 'sage' && u.userToken !== currentUser.userToken
        );
        if (sameTeamSage) {
          console.warn('⚠️ Un sage existe déjà dans cette équipe.');
          return;
        }
      }

      // ✅ Conserve tout le user
      const updatedUser: User = { ...currentUser, role: newRole };

      setCurrentUser(updatedUser);
      setCurrentRoom((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.userToken === currentUser.userToken ? updatedUser : u)),
      }));

      socket.emit('changeRole', {
        roomCode: currentRoom.code,
        userToken: currentUser.userToken,
        newRole,
      });

      console.log(`🎭 ${currentUser.username} est maintenant ${newRole}`);
    },
    [socket, currentRoom, currentUser, setCurrentUser, setCurrentRoom]
  );

  // --------------------------------------------------
  // 🔁 Changement d’équipe automatique + rôle
  // --------------------------------------------------
  const switchTeam = useCallback(
    (team: 'red' | 'blue' | 'spectator') => {
      if (!socket || !currentRoom || !currentUser) return;

      const newRole = autoAssignRole(team);
      const updatedUser: User = { ...currentUser, team, role: newRole };

      setCurrentUser(updatedUser);
      setCurrentRoom((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.userToken === currentUser.userToken ? updatedUser : u)),
      }));

      socket.emit('switchTeam', {
        roomCode: currentRoom.code,
        userToken: currentUser.userToken,
        newTeam: team,
        newRole,
      });

      console.log(`🔁 ${currentUser.username} → ${team} (${newRole})`);
    },
    [socket, currentRoom, currentUser, autoAssignRole, setCurrentUser, setCurrentRoom]
  );

  // --------------------------------------------------
  // 📦 Export
  // --------------------------------------------------
  return {
    changeTeam,
    changeRole,
    switchTeam,
  };
}
