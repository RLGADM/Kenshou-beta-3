// src/hooks/global/useSocket.ts
import { useSocketContext } from '@/components/SocketContext';

// ✅ Ce hook ne crée plus de nouvelle connexion
// Il récupère simplement le socket depuis le context.
export function useSocket() {
  return useSocketContext();
}
