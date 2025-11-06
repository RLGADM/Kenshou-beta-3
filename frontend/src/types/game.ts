// --------------------------------------------------
// 📘 types/game.ts — Typages centraux du projet Kenshou
// --------------------------------------------------

// --------------------------------------------------
// 🧍 Utilisateur
// --------------------------------------------------
export interface User {
  /** Identifiant unique (UUID stocké dans localStorage) */
  id: string;
  userToken: string;
  username: string;

  /** Rôle et équipe */
  team: "red" | "blue" | "spectator";
  role: "sage" | "disciple" | "spectator";

  /** Permissions */
  isAdmin: boolean;

  /** Infos réseau optionnelles */
  socketId?: string;
  room?: string;
}

// --------------------------------------------------
// 💬 Message (chat ou système)
// --------------------------------------------------
const now = globalThis.Date.now();

export interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

// --------------------------------------------------
// ⚙️ Paramètres de jeu (configurables avant partie)
// --------------------------------------------------
export interface GameParameters {
  /** Durées des phases (en secondes) */
  ParametersTimeFirst: number;
  ParametersTimeSecond: number;
  ParametersTimeThird: number;

  /** Gestion d’équipe et rerolls */
  ParametersTeamReroll: number;
  ParametersTeamMaxForbiddenWords: number;
  ParametersTeamMaxPropositions: number;

  /** Règles de points et conditions de victoire */
  ParametersPointsMaxScore: number;
  ParametersPointsRules: "no-tie" | "tie"; // tie = égalité possible

  /** Sélection du dictionnaire */
  ParametersWordsListSelection: {
    veryCommon: boolean;
    lessCommon: boolean;
    rarelyCommon: boolean;
  };
}

// --------------------------------------------------
// 🎯 Phase de jeu
// --------------------------------------------------
export interface GamePhase {
  index: 0 | 1 | 2 | 3; // 0 = attente, 1 = choix mot, 2 = interdits, 3 = discours
  name: "En attente" | "Choix du mot" | "Mots interdits" | "Oratoire";
  status: "En attente" | "En cours" | "Finie";
  remainingTime?: number;
}

// --------------------------------------------------
// 🏁 Round complet
// --------------------------------------------------
export interface GameRound {
  index: number;
  phases: GamePhase[];
  currentPhase: GamePhase;

  /** Mots choisis */
  redTeamWord: string;
  blueTeamWord: string;

  /** Mots interdits */
  redTeamForbiddenWords: string[];
  blueTeamForbiddenWords: string[];
}

// --------------------------------------------------
// 🧩 État global du jeu (GameState)
// --------------------------------------------------
export interface GameState {
  /** Partie active */
  isPlaying: boolean;

  /** Gagnant actuel ou null si aucun */
  winner: "red" | "blue" | "tie" | null;

  /** Round et phases */
  currentRound: GameRound;

  /** Scores cumulés */
  scores: {
    red: number;
    blue: number;
  };

  /** Nombre d’essais restants */
  remainingGuesses: number;
}

// --------------------------------------------------
// 🏠 Salle (Room)
// --------------------------------------------------
export interface Room {
  /** Code unique de la room (6 caractères) */
  code: string;

  /** Mode de jeu (standard/custom/arcade) */
  mode: "standard" | "custom" | "arcade";

  /** Liste des joueurs et messages */
  users: User[];
  messages: Message[];

  /** Config & état du jeu */
  gameParameters: GameParameters;
  gameState: GameState;

  /** Horodatage de création */
  createdAt: number;
}

// --------------------------------------------------
// 🧩 GameRoom — version enrichie utilisée pendant la partie
// --------------------------------------------------
export interface GameRoom extends Room {
  redTeam: User[];
  blueTeam: User[];
  roundsPlayed: number;

  /** Gagnant global de la partie */
  winner?: "red" | "blue" | "tie";
}

// --------------------------------------------------
// 🔸 Constantes par défaut utiles côté client
// --------------------------------------------------
export const defaultGameParameters: GameParameters = {
  ParametersTimeFirst: 60,
  ParametersTimeSecond: 45,
  ParametersTimeThird: 30,
  ParametersTeamReroll: 1,
  ParametersTeamMaxForbiddenWords: 3,
  ParametersTeamMaxPropositions: 3,
  ParametersPointsMaxScore: 5,
  ParametersPointsRules: "tie",
  ParametersWordsListSelection: {
    veryCommon: true,
    lessCommon: true,
    rarelyCommon: false,
  },
};

export const defaultGameState: GameState = {
  isPlaying: false,
  winner: null,
  currentRound: {
    index: 0,
    phases: [],
    currentPhase: {
      index: 0,
      name: "En attente",
      status: "En attente",
    },
    redTeamWord: "",
    blueTeamWord: "",
    redTeamForbiddenWords: [],
    blueTeamForbiddenWords: [],
  },
  scores: { red: 0, blue: 0 },
  remainingGuesses: 3,
};
