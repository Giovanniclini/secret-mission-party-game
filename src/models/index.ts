// Core data models and types for Secret Mission app
// This file will contain Player, Mission, GameState interfaces and enums

export interface Player {
  id: string;
  name: string;
  currentMission?: Mission;
  missionState: MissionState;
  completedCount: number;
}

export interface Mission {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameState {
  id: string;
  players: Player[];
  targetCompleted: number;
  status: GameStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum MissionState {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CAUGHT = 'CAUGHT'
}

export enum GameStatus {
  SETUP = 'SETUP',
  ASSIGNING = 'ASSIGNING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED'
}

// Utility functions for game state validation
export const isValidMissionStateTransition = (
  from: MissionState,
  to: MissionState
): boolean => {
  switch (from) {
    case MissionState.WAITING:
      return to === MissionState.ACTIVE;
    case MissionState.ACTIVE:
      return to === MissionState.COMPLETED || to === MissionState.CAUGHT;
    case MissionState.COMPLETED:
    case MissionState.CAUGHT:
      return false; // Terminal states
    default:
      return false;
  }
};

export const isValidGameStatusTransition = (
  from: GameStatus,
  to: GameStatus
): boolean => {
  switch (from) {
    case GameStatus.SETUP:
      return to === GameStatus.ASSIGNING;
    case GameStatus.ASSIGNING:
      return to === GameStatus.IN_PROGRESS;
    case GameStatus.IN_PROGRESS:
      return to === GameStatus.FINISHED;
    case GameStatus.FINISHED:
      return to === GameStatus.SETUP; // Allow restart
    default:
      return false;
  }
};

export const isValidPlayerName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 20;
};

export const hasMinimumPlayers = (players: Player[]): boolean => {
  return players.length >= 3;
};

export const getWinner = (players: Player[], targetCompleted: number): Player | null => {
  return players.find(player => player.completedCount >= targetCompleted) || null;
};

// Initial game state factory functions
export const createInitialGameState = (): GameState => {
  const now = new Date();
  return {
    id: `game_${now.getTime()}`,
    players: [],
    targetCompleted: 1, // Reverted back to 1 for proper game experience
    status: GameStatus.SETUP,
    createdAt: now,
    updatedAt: now
  };
};

export const createPlayer = (name: string): Player => {
  return {
    id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim(),
    currentMission: undefined,
    missionState: MissionState.WAITING,
    completedCount: 0
  };
};