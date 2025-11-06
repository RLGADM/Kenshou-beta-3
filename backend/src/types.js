// --------------------------------------------------
// 📘 backend/types.js — Typages & modèles de données Kenshou
// --------------------------------------------------
// Objectif : Fournir une base cohérente entre le serveur et le front-end
// --------------------------------------------------

// 🧍 Utilisateur (User)
export const createUser = ({
  id,
  userToken,
  username,
  team = "spectator",
  role = "disciple",
  isAdmin = false,
  socketId = null,
  room = null,
} = {}) => ({
  id,
  userToken,
  username,
  team,
  role,
  isAdmin,
  socketId,
  room,
});

// 💬 Message (chat)
export const createMessage = ({ username, message }) => ({
  id: crypto.randomUUID(),
  username,
  message,
  timestamp: Date.now(),
});

// ⚙️ Paramètres par défaut du jeu
export const defaultGameParameters = {
  ParametersTimeFirst: 60,
  ParametersTimeSecond: 45,
  ParametersTimeThird: 30,
  ParametersTeamReroll: 1,
  ParametersTeamMaxForbiddenWords: 3,
  ParametersTeamMaxPropositions: 3,
  ParametersPointsMaxScore: 5,
  ParametersPointsRules: "tie", // "no-tie" pour match décisif obligatoire
  ParametersWordsListSelection: {
    veryCommon: true,
    lessCommon: true,
    rarelyCommon: false,
  },
};

// 🎯 Phase de jeu
export const createGamePhase = ({
  index = 0,
  name = "En attente",
  status = "En attente",
  remainingTime = null,
} = {}) => ({
  index,
  name,
  status,
  remainingTime,
});

// 🏁 Round
export const createGameRound = ({
  index = 0,
  phases = [],
  currentPhase = createGamePhase(),
  redTeamWord = "",
  blueTeamWord = "",
  redTeamForbiddenWords = [],
  blueTeamForbiddenWords = [],
} = {}) => ({
  index,
  phases,
  currentPhase,
  redTeamWord,
  blueTeamWord,
  redTeamForbiddenWords,
  blueTeamForbiddenWords,
});

// 🧩 État global du jeu
export const defaultGameState = {
  isPlaying: false,
  winner: null, // "red" | "blue" | "tie" | null
  currentRound: createGameRound(),
  scores: { red: 0, blue: 0 },
  remainingGuesses: 3,
};

// 🏠 Room
export const createRoom = ({
  code,
  mode = "standard",
  users = [],
  messages = [],
  gameParameters = defaultGameParameters,
  gameState = defaultGameState,
  createdAt = Date.now(),
} = {}) => ({
  code,
  mode,
  users,
  messages,
  gameParameters,
  gameState,
  createdAt,
});

// 🧩 GameRoom (enrichie)
export const createGameRoom = ({
  ...baseRoom
} = {}) => ({
  ...createRoom(baseRoom),
  redTeam: [],
  blueTeam: [],
  roundsPlayed: 0,
  winner: null,
});

// --------------------------------------------------
// 📦 Exports groupés
// --------------------------------------------------
export default {
  createUser,
  createMessage,
  createRoom,
  createGameRoom,
  createGamePhase,
  createGameRound,
  defaultGameParameters,
  defaultGameState,
};
