// src/types/index.ts
// point d'entrée unique pour tous les types + objets de base

export * from './game'; // on ré-exporte ton fichier actuel

// ⬇️ on importe les interfaces pour typer nos objets "vides"
import type { User, Message, Room, GameParameters, GamePhase, GameRound, GameState } from './game';

// 👤 utilisateur vide
export const emptyUser: User = {
  id: '',
  userToken: '',
  username: '',
  team: 'spectator',
  role: 'spectator',
  isAdmin: true, // tu avais dit : "pour l’instant tout le monde est admin en bêta"
  socketId: undefined,
  room: undefined,
};

// 🟦 phase d’attente (avec tes libellés FR)
const waitingPhase: GamePhase = {
  index: 0,
  name: 'En attente',
  status: 'En attente',
  remainingTime: undefined, // tu as écrit remainingTiume dans game.ts, je respecte
};

// 🟨 round initial
const initialRound: GameRound = {
  index: 1,
  phases: [waitingPhase],
  currentPhase: waitingPhase,
  // ⚠ dans ton game.ts tu as : redTeamWord: string; (pas optionnel)
  // donc on met une string vide
  redTeamWord: '',
  blueTeamWord: '',
  redTeamForbiddenWords: [],
  blueTeamForbiddenWords: [],
};

// ⚙️ paramètres par défaut conformes à TON interface
const defaultGameParameters: GameParameters = {
  ParametersTimeFirst: 60,
  ParametersTimeSecond: 45,
  ParametersTimeThird: 30,
  ParametersTeamReroll: 3,
  ParametersTeamMaxForbiddenWords: 6,
  ParametersTeamMaxPropositions: 3,
  ParametersPointsMaxScore: 10,
  ParametersPointsRules: 'tie', // tu avais 'no-tie' | 'tie'
  ParametersWordsListSelection: {
    veryCommon: true,
    lessCommon: true,
    rarelyCommon: false,
  },
};

// 🧠 état de jeu par défaut — conforme à TON GameState
const defaultGameState: GameState = {
  // "Mise à zéro…" comme dans ton commentaire
  isPlaying: false,
  currentRound: initialRound,
  scores: { red: 0, blue: 0 },
  // on part sur le max de propositions comme nb de tentatives
  remainingGuesses: defaultGameParameters.ParametersTeamMaxPropositions,
  // winner: undefined
};

// 🏠 room vide conforme à TON interface Room
export const emptyRoom: Room = {
  code: '',
  users: [],
  messages: [] as Message[],
  gameParameters: defaultGameParameters,
  gameState: defaultGameState,
};
