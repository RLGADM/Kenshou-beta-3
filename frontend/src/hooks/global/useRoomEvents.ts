// --------------------------------------------------
// 🎮 useRoomEvents.ts — Hook principal des rooms Kenshou
// --------------------------------------------------
// Rôles :
// 1️⃣ Écoute et gère tous les événements Socket.IO liés aux rooms
// 2️⃣ Maintient les états locaux (room, users, messages, etc.)
// 3️⃣ Gère la reconnexion automatique et la sortie volontaire
// --------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSocketContext } from "@/components/SocketContext";
import type { Room, Message, User, GameParameters } from "@/types";
const [inRoom, setInRoom] = useState(false);

// --------------------------------------------------
// 🔧 Valeurs par défaut
// --------------------------------------------------

const defaultGameParameters: GameParameters = {
  ParametersTimeFirst: 60,
  ParametersTimeSecond: 45,
  ParametersTimeThird: 30,
  ParametersTeamReroll: 1,
  ParametersTeamMaxForbiddenWords: 2,
  
  ParametersTeamMaxPropositions: 3,
  ParametersPointsMaxScore: 10,
  ParametersPointsRules: "no-tie",
  ParametersWordsListSelection: {
    veryCommon: true,
    lessCommon: true,
    rarelyCommon: false,
  },
};

const defaultGameState = {
  isPlaying: false,
  winner: null,
  currentRound: {
    index: 0,
    phases: [] as any[], // 👈 tableau modifiable
    currentPhase: { index: 0 as const, name: "En attente", status: "En attente" },
    redTeamWord: "",
    blueTeamWord: "",
    redTeamForbiddenWords: [] as string[],
    blueTeamForbiddenWords: [] as string[],
  },
  scores: { red: 0, blue: 0 },
  remainingGuesses: 3,
} as const;


const emptyRoom: Room = {
  code: "",
  mode: "standard",
  users: [],
  messages: [],
  gameParameters: defaultGameParameters,
  gameState: defaultGameState,
  createdAt: 0,
};

// --------------------------------------------------
// 🧠 Hook principal
// --------------------------------------------------
export function useRoomEvents() {
  const { socket, isConnected } = useSocketContext();
  const navigate = useNavigate();

  const [currentRoom, setCurrentRoom] = useState<Room>(emptyRoom);
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inRoom, setInRoom] = useState(false);

  const userToken = localStorage.getItem("userToken") || "";

  // --------------------------------------------------
  // 🚪 Quitter la salle proprement
  // --------------------------------------------------
  const handleLeaveRoom = useCallback(() => {
    if (!socket || !currentRoom?.code) return;

    const { code } = currentRoom;
    console.log(`🚪 Déconnexion volontaire de la room ${code}`);

    // 1️⃣ Signaler au serveur
    socket.emit("leaveRoom", { roomCode: code, userToken });

    // 2️⃣ Marquer départ volontaire
    localStorage.setItem("hasLeftRoom", "true");
    localStorage.removeItem("lastRoomCode");

    // 3️⃣ Nettoyer l'état local
    setInRoom(false);
    setCurrentRoom(emptyRoom);
    setRoomUsers([]);
    setMessages([]);

    // 4️⃣ Fermer proprement le socket
    try {
      socket.disconnect();
    } catch (err) {
      console.warn("⚠️ Erreur lors de la déconnexion socket:", err);
    }

    // 5️⃣ Retour à l'accueil
    navigate("/");
  }, [socket, currentRoom, userToken, navigate]);

  // --------------------------------------------------
  // 🔄 Gestion des événements Socket.IO
  // --------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    // --- Création de room ---
    socket.off("roomCreated").on("roomCreated", (roomData: Room) => {
      console.log("✅ roomCreated reçu →", roomData);
      setCurrentRoom(roomData);
      setRoomUsers(roomData.users);
      setInRoom(true);
      localStorage.setItem("hasLeftRoom", "false");
      localStorage.setItem("lastRoomCode", roomData.code);
      navigate(`/room/${roomData.code}`);
    });

    // --- Rejoint une room ---
    socket.off("roomJoined").on("roomJoined", (roomData: Room) => {
      console.log("🚀 roomJoined reçu →", roomData);
      setCurrentRoom(roomData);
      setRoomUsers(roomData.users);
      setInRoom(true);
      localStorage.setItem("hasLeftRoom", "false");
      localStorage.setItem("lastRoomCode", roomData.code);
      navigate(`/room/${roomData.code}`);
    });

    // --- Reconnexion automatique ---
    socket.off("reconnectedToRoom").on("reconnectedToRoom", (roomData: Room) => {
      console.log("🔄 reconnectedToRoom reçu →", roomData);
      setCurrentRoom(roomData);
      setRoomUsers(roomData.users);
      setInRoom(true);
      localStorage.setItem("hasLeftRoom", "false");
      navigate(`/room/${roomData.code}`);
      toast.success(`Reconnexion à la salle ${roomData.code}`);
    });

    // --- Mise à jour des utilisateurs ---
    socket.off("usersUpdate").on("usersUpdate", (users: User[]) => {
      console.log("👥 usersUpdate reçu →", users);
      setRoomUsers(users);
    });

    // --- Nouveau message ---
    socket.off("message").on("message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    // --- Room introuvable ---
    socket.off("roomNotFound").on("roomNotFound", () => {
      toast.error("Salle introuvable.");
      navigate("/");
    });

    // --- Pseudo déjà pris ---
    socket.off("usernameTaken").on("usernameTaken", () => {
      toast.error("Ce pseudo est déjà pris dans cette salle.");
      navigate("/");
    });

    // --- Confirmation de sortie ---
    socket.off("clientLeftRoom").on("clientLeftRoom", () => {
      console.log("🚪 clientLeftRoom reçu → départ volontaire confirmé");
      localStorage.setItem("hasLeftRoom", "true");
      setInRoom(false);
      setCurrentRoom(emptyRoom);
      setRoomUsers([]);
      setMessages([]);
      navigate("/");
    });

    // --- Déconnexion serveur ---
    socket.off("disconnect").on("disconnect", (reason: string) => {
      console.warn("🔴 Déconnecté du serveur :", reason);
      setInRoom(false);
      // On ne met pas hasLeftRoom=true ici → déconnexion involontaire
    });

    // Nettoyage des listeners
    return () => {
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("reconnectedToRoom");
      socket.off("usersUpdate");
      socket.off("message");
      socket.off("roomNotFound");
      socket.off("usernameTaken");
      socket.off("clientLeftRoom");
      socket.off("disconnect");
    };
  }, [socket, navigate]);

  // --------------------------------------------------
  // 🔙 Retour des handlers
  // --------------------------------------------------
  return {
    currentRoom,
    roomUsers,
    messages,
    inRoom,
    setInRoom,
    handleLeaveRoom,
  };
}
