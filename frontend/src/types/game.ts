import * as Game from '@/types/game';
// --------------------------------------------------
// 📘 Types de base pour Kensho
// --------------------------------------------------

// 🧍 Utilisateur
// ✅ User = 100% calé sur ce que tu m’as dit
export interface User {
  id: string; // = userToken
  userToken: string; //= userToken 2
  username: string;
  team: 'red' | 'blue' | 'spectator';
  role: 'sage' | 'disciple' | 'spectator';
  isAdmin: true;
  socketId?: string;
  room?: string;
}

// 💬 Message (chat ou système)
export interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
}
// ⚙️ Paramètres de jeu (configurable avant la partie)
export interface GameParameters {
  ParametersTimeFirst: number;
  ParametersTimeSecond: number;
  ParametersTimeThird: number;
  ParametersTeamReroll: number;
  ParametersTeamMaxForbiddenWords: number;
  ParametersTeamMaxPropositions: number;
  ParametersPointsMaxScore: number;
  ParametersPointsRules: 'no-tie' | 'tie';
  ParametersWordsListSelection: {
    veryCommon: boolean;
    lessCommon: boolean;
    rarelyCommon: boolean;
  };
}

// 🎯 Phase de jeu (0, 1, 2, 3)
export interface GamePhase {
  index: 0 | 1 | 2 | 3; // 0 = attente / pré-phase
  name: 'En attente' | 'Choix du mot' | 'Mots interdits' | 'Oratoire';
  status: 'En attente' | 'En cours' | 'Finie';
  remainingTime?: number; // temps restant en secondes
}

// 🏁 Round complet
export interface GameRound {
  index: number; // numéro du round
  phases: GamePhase[];
  currentPhase: GamePhase;
  redTeamWord: string;
  blueTeamWord: string;
  redTeamForbiddenWords: string[];
  blueTeamForbiddenWords: string[];
}

// 🧩 État complet du jeu
export interface GameState {
  //Mise à zéro des mots avabnt le début d'une nouvelle manche
  isPlaying: boolean;
  currentRound: GameRound;
  scores: { red: number; blue: number };
  remainingGuesses: number;
  winner?: 'red' | 'blue' | 'tie';
}

// 🏠 Salle de base (Room)
export interface Room {
  code: string;
  users: User[];
  messages: Message[];
  gameParameters: GameParameters; // Règles statiques (création)
  gameState: GameState; // État dynamique (partie en cours)
}

// 🧩 GameRoom — version enrichie utilisée côté jeu
export interface GameRoom extends Room {
  redTeam: User[];
  blueTeam: User[];
  roundsPlayed: number;
  winner?: 'red' | 'blue' | 'tie';
}
