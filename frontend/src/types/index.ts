// Bijour les enfants
import { getDefaultParameters } from '@/utils/defaultParameters';
import { Socket } from 'socket.io-client';
// import pour emptyRoom

export type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

// Création de la Room pour commencer
export interface Room {
  code: string;
  users: User[];
  messages: Message[];
  gameMode: 'standard' | 'custom';
  parameters: GameParameters;
  gameState?: GameState | null;
  creatorToken: string;
  createdAt: number;
  isReady: boolean;
}
export const emptyRoom = {
  code: '',
  users: [],
  messages: [],
  gameMode: 'standard' as const, //ou custom
  parameters: getDefaultParameters(),
  gameState: null,
  creatorToken: '',
  createdAt: Date.now(),
  isReady: false,
};
// Création du joueur
export interface User {
  socketId: string;
  userToken: string;
  username: string;
  room: string;
  team?: 'red' | 'blue' | 'spectator';
  role?: 'sage' | 'disciple' | 'spectator';
  isAdmin?: boolean;
}

// le template vide pour les consts
export const emptyUser: User = {
  socketId: '',
  userToken: '',
  username: '',
  room: '',
  team: 'spectator',
  role: 'spectator',
  isAdmin: false,
};

// gestion messagerie des joueurs
export interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
}

// Toutes les variables paramétrables
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

// Déclaration des phases petit-enfant en lien
export interface PhaseState {
  phaseIndex: number;
  name: string;
  status: 'waiting' | 'in-progress' | 'finished';
  timer: number | null;
  timeRemaining: number;
}

// Déclaration des rounds enfant en lien
export interface RoundState {
  roundIndex: number;
  phases: PhaseState[];
  currentPhase: number;
  status: 'waiting' | 'in-progress' | 'finished';
}

// Déclaration des limites de rôle par équipe
export interface TeamState {
  sage: User | null;
  disciples: User[];
  score: number;
  word?: string;
}

// Le GameState parent
export interface GameState {
  status: 'waiting' | 'started' | 'ended';
  gameParameters: GameParameters;
  rounds: RoundState[];
  currentRound: number;
  teams: {
    red: TeamState;
    blue: TeamState;
  };
  spectators: User[];
  isPlaying: boolean;
  winner: 'red' | 'blue' | 'draw' | null;
  currentPhase?: number;
  phases?: string[];
  timer?: number | null;
  timeRemaining?: number;
  totalTime?: number;
  score?: { red: number; blue: number };
}
export interface ServerToClientEvents {
  roomJoined: (room: Room) => void;
  userJoined: (user: User) => void;
  userLeft: (userId: string) => void;
  newMessage: (message: Message) => void;
  roomNotFound: () => void;
  usernameTaken: () => void;
  usersUpdate: (users: User[]) => void;
  gameStateUpdate: (gameState: GameState) => void;
  teamJoinSuccess: (data: { team: string; role: string; gameState: GameState }) => void;
  teamJoinError: (error: string) => void;
  pong: (data: { timestamp: string; socketId: string; userExists: boolean; userInfo: User | null }) => void;
  //debugUsersResponse: (data: any) => void;
  gameParametersSet: (parameters: GameParameters) => void;
  userKicked: (data: { userId: string; reason: string }) => void;
  userBanned: (data: { userId: string; reason: string }) => void;
  gameTick: (data: { timeRemaining: number; totalTime?: number; currentPhase?: number }) => void;
}

export interface ClientToServerEvents {
  //chat pour params
  createRoom: (payload: {
    username: string;
    gameMode: 'standard' | 'custom';
    parameters: GameParameters;
    userToken?: string;
  }) => void;
  //bolt
  //createRoom: (username: string) => void;
  joinRoom: (username: string, roomCode: string) => void;
  sendMessage: (message: string) => void;
  disconnect: () => void;
  // Mise à jour: supporte payload + ack
  joinTeam: (
    payload: {
      roomCode: string;
      userToken: string;
      username?: string;
      team: 'red' | 'blue' | 'spectator';
      role: 'sage' | 'disciple' | 'spectator';
    },
    ack?: (resp: { success: boolean; message?: string }) => void
  ) => void;
  submitProposal: (proposal: string) => void;
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;
  gameError: (error: string) => void;
  ping: () => void;
  debugGetUsers: () => void;
  setGameParameters: (parameters: GameParameters) => void;
  //  changeUserRoomRole: (userId: string, newRole: RoomRole) => void;
  kickUser: (userId: string, reason: string) => void;
  banUser: (userId: string, reason: string) => void;
}

export interface ServerResetPayload {
  message: string;
}
export function createNewRound(index: number, gameParameters: GameParameters): RoundState {
  return {
    roundIndex: index,
    currentPhase: 0,
    status: 'waiting',
    phases: [
      {
        phaseIndex: 0,
        name: 'phase-1',
        status: 'waiting',
        timer: gameParameters.ParametersTimeFirst,
        timeRemaining: gameParameters.ParametersTimeFirst,
      },
      {
        phaseIndex: 1,
        name: 'phase-2',
        status: 'waiting',
        timer: gameParameters.ParametersTimeSecond,
        timeRemaining: gameParameters.ParametersTimeSecond,
      },
      {
        phaseIndex: 2,
        name: 'phase-3',
        status: 'waiting',
        timer: gameParameters.ParametersTimeThird,
        timeRemaining: gameParameters.ParametersTimeThird,
      },
    ],
  };
}

export function createInitialGameState(gameParameters: GameParameters): GameState {
  return {
    status: 'waiting',
    gameParameters,
    rounds: [createNewRound(0, gameParameters)],
    currentRound: 0,
    isPlaying: false,
    winner: null,
    teams: {
      red: { sage: null, disciples: [], score: 0 },
      blue: { sage: null, disciples: [], score: 0 },
    },
    spectators: [],
  };
}

export function resetGameState(previousState: GameState): GameState {
  return {
    ...previousState,
    status: 'waiting',
    isPlaying: false,
    winner: null,
    rounds: [createNewRound(0, previousState.gameParameters)],
    currentRound: 0,
    teams: {
      red: { ...previousState.teams.red, score: 0 },
      blue: { ...previousState.teams.blue, score: 0 },
    },
  };
}
