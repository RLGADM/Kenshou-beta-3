// Étendre les types existants
import { GameParameters as BaseGameParameters } from './index';

export interface GamePhase {
  index: 1 | 2 | 3;
  status: 'waiting' | 'in-progress' | 'finished';
}

export interface GameRound {
  index: number;
  currentPhase: GamePhase;
  redTeamWord?: string;
  blueTeamWord?: string;
  redTeamForbiddenWords: string[];
  blueTeamForbiddenWords: string[];
  // passes left (rerolls) available to each team during this round
  redTeamPassesLeft?: number;
  blueTeamPassesLeft?: number;
}

export interface GameState {
  isPlaying: boolean;
  currentRound: GameRound;
  scores: {
    red: number;
    blue: number;
  };
  currentTeam: 'red' | 'blue';
  remainingGuesses: number;
  isPaused: boolean;
}

// Re-export les types existants
export * from './index';
