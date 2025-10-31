// --------------------------------------------------
// 🧠 useRoomUtils
// Utilitaires communs pour les actions de room
// --------------------------------------------------

import { useCallback } from 'react';
import type { User, Room } from '@/types';

/**
 * Hook utilitaire pour centraliser les actions génériques
 * liées aux rooms : copier le lien, permissions, etc.
 */
export function useRoomUtils() {
  // --------------------------------------------------
  // 🔗 Copier le lien d’invitation
  // --------------------------------------------------
  const copyRoomLink = useCallback((roomCode: string, setCopied?: (v: boolean) => void) => {
    if (!roomCode) {
      console.warn('❌ Aucun code de salon fourni à copyRoomLink');
      return;
    }

    const link = `${window.location.origin}/room/${roomCode}`;

    navigator.clipboard
      .writeText(link)
      .then(() => {
        console.log('🔗 Lien copié dans le presse-papiers :', link);

        if (setCopied) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      })
      .catch((err) => {
        console.error('⚠️ Erreur lors de la copie du lien :', err);
      });
  }, []);

  // --------------------------------------------------
  // 🧍 Vérifie les permissions du joueur actuel
  // --------------------------------------------------
  const checkPermissions = useCallback((user?: User, room?: Room) => {
    if (!user) return { isAdmin: true, canControlGame: true };

    const isAdmin = user.isAdmin === true; // 🔸 les "sages" peuvent parfois contrôler la partie selon ton système

    const canControlGame = isAdmin || (room?.users?.length ?? 0) > 0;

    return { isAdmin, canControlGame };
  }, []);

  // --------------------------------------------------
  // 🧹 Nettoyer les infos locales (quand on quitte la room)
  // --------------------------------------------------
  const clearRoomLocalData = useCallback(() => {
    localStorage.removeItem('roomCode');
    //localStorage.removeItem('lastRoomCode');
    localStorage.removeItem('hasLeftRoom');
    console.log('🧹 Données de room nettoyées du localStorage');
  }, []);

  // --------------------------------------------------
  // 📦 Exports publics
  // --------------------------------------------------
  return {
    copyRoomLink,
    checkPermissions,
    clearRoomLocalData,
  };
}
