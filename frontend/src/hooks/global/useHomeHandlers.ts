// --------------------------------------------------
// 🏠 useHomeHandlers.ts — Hook principal de la page Home Kenshou
// --------------------------------------------------
// Rôles :
// 1️⃣ Gérer les actions de création / rejoindre de salle
// 2️⃣ Synchroniser les états locaux (username, roomCode, etc.)
// 3️⃣ Gérer la reconnexion automatique via localStorage
// --------------------------------------------------

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSocketContext } from "@/components/SocketContext";
import { ensureUserToken } from "@/utils/userToken";

// --------------------------------------------------
// 🔹 Typage du hook
// --------------------------------------------------
interface UseHomeHandlersReturn {
  socketIsConnected: boolean;
  username: string;
  setUsername: (v: string) => void;
  inRoom: boolean;
  roomCode: string;
  inputRoomCode: string;
  setInputRoomCode: (v: string) => void;
  isCreating: boolean;
  isJoining: boolean;
  isConfigModalOpen: boolean;
  setConfigModalOpen: (v: boolean) => void;
  handleJoin: () => void;
  handleConfigConfirm: (parameters: any) => void;
  startRoom: () => void;
  error: string | null;
}

// --------------------------------------------------
// 🧠 Hook principal
// --------------------------------------------------
export function useHomeHandlers(initialUsername = ""): UseHomeHandlersReturn {
  const navigate = useNavigate();
  const { socket, isConnected: socketIsConnected } = useSocketContext();

  // États locaux
  const [username, setUsername] = useState(initialUsername);
  const [inRoom, setInRoom] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [inputRoomCode, setInputRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isConfigModalOpen, setConfigModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------
  // 🪪 Gestion du userToken
  // --------------------------------------------------
  const userToken = ensureUserToken();

  // --------------------------------------------------
  // 🎮 CREATE ROOM
  // --------------------------------------------------
  const handleCreateRoom = useCallback(
    (username: string, parameters: any) => {
      if (!socket) return;
      if (!username.trim()) {
        toast.error("Veuillez entrer un pseudo avant de créer une salle.");
        return;
      }

      localStorage.setItem("lastUsername", JSON.stringify(username));
      localStorage.setItem("hasLeftRoom", "false");

      console.log("🎮 handleCreateRoom →", username, parameters);

      setIsCreating(true);

      socket.emit(
        "createRoom",
        { username, parameters, userToken },
        (res: any) => {
          setIsCreating(false);

          if (!res?.success) {
            setError("Erreur lors de la création de la salle");
            toast.error("Impossible de créer la salle");
          } else {
            setRoomCode(res.roomCode);
            setInRoom(true);
            localStorage.setItem("lastRoomCode", res.roomCode);
          }
        }
      );
    },
    [socket, userToken]
  );

  // --------------------------------------------------
  // 👥 JOIN ROOM
  // --------------------------------------------------
  const handleJoinRoom = useCallback(
    (username: string, roomCode: string) => {
      if (!socket) return;
      if (!username.trim()) {
        toast.error("Veuillez entrer un pseudo avant de rejoindre une salle.");
        return;
      }
      if (!roomCode.trim()) {
        toast.error("Veuillez entrer un code de salle.");
        return;
      }

      localStorage.setItem("lastUsername", JSON.stringify(username));
      localStorage.setItem("hasLeftRoom", "false");

      console.log("👥 handleJoinRoom →", username, roomCode);

      setIsJoining(true);
      socket.emit("joinRoom", { username, roomCode, userToken }, (res: any) => {
        setIsJoining(false);
        if (!res?.success) {
          const msg =
            res?.error === "username taken"
              ? "Ce pseudo est déjà pris dans cette salle."
              : "Erreur lors de la connexion à la salle.";
          setError(msg);
          toast.error(msg);
        } else {
          setRoomCode(roomCode);
          setInRoom(true);
          localStorage.setItem("lastRoomCode", roomCode);
          navigate(`/room/${roomCode}`);
        }
      });
    },
    [socket, userToken, navigate]
  );

  // --------------------------------------------------
  // ⚙️ Handlers liés à l'UI
  // --------------------------------------------------
  const handleJoin = useCallback(() => {
    handleJoinRoom(username, inputRoomCode);
  }, [handleJoinRoom, username, inputRoomCode]);

  const handleConfigConfirm = useCallback(
    (parameters: any) => handleCreateRoom(username, parameters),
    [handleCreateRoom, username]
  );

  const startRoom = useCallback(() => setConfigModalOpen(true), []);
//tentative
  useEffect(() => {
    if (!socket) return;

    socket.once("roomCreated", (room) => {
      console.log("✅ roomCreated reçu du serveur →", room.code);
      localStorage.setItem("lastRoomCode", room.code);
      localStorage.setItem("hasLeftRoom", "false");
      setRoomCode(room.code);
      setInRoom(true);
      navigate(`/room/${room.code}`);
    });

    return () => {
      socket.off("roomCreated");
    };
  }, [socket]);
// --------------------------------------------------
// ♻️ Reconnexion automatique si utilisateur actif
// --------------------------------------------------
useEffect(() => {
  if (!socketIsConnected) return;

  // ✅ Flag pour éviter les doublons de reconnexion
  let hasReconnected = false;

  const hasLeftRoom = localStorage.getItem("hasLeftRoom") === "true";
  const lastRoomCode = localStorage.getItem("lastRoomCode");
  const savedUsername = JSON.parse(localStorage.getItem("lastUsername") || '""');

  if (inRoom || isCreating || hasLeftRoom) {
    console.log("🚫 Reconnexion automatique ignorée (inRoom/isCreating/hasLeftRoom)");
    return;
  }

  if (lastRoomCode && savedUsername && !hasReconnected) {
    hasReconnected = true;
    console.log(`♻️ Tentative de reconnexion automatique à ${lastRoomCode}`);
    handleJoinRoom(savedUsername, lastRoomCode);
  }

  return () => {
    hasReconnected = true; // empêche le re-trigger lors d’un re-render
  };
}, [socketIsConnected]);
// --------------------------------------------------
// ✅ Écoute directe de l’event roomCreated
// --------------------------------------------------
useEffect(() => {
  if (!socket) return;

  const onRoomCreated = (room: any) => {
    console.log("✅ roomCreated reçu du serveur →", room.code);

    localStorage.setItem("lastRoomCode", room.code);
    localStorage.setItem("hasLeftRoom", "false");

    setRoomCode(room.code);
    setInRoom(true);
    navigate(`/room/${room.code}`);
  };

  socket.on("roomCreated", onRoomCreated);

  return () => {
    socket.off("roomCreated", onRoomCreated);
  };
}, [socket, navigate]);

  // --------------------------------------------------
  // 🔙 Retour
  // --------------------------------------------------
  return {
    socketIsConnected,
    username,
    setUsername,
    inRoom,
    roomCode,
    inputRoomCode,
    setInputRoomCode,
    isCreating,
    isJoining,
    isConfigModalOpen,
    setConfigModalOpen,
    handleJoin,
    handleConfigConfirm,
    startRoom,
    error,
  };
}
