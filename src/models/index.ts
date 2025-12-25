// Core data models and types for Secret Mission app
// Enhanced multi-mission version with difficulty configuration and scoring

export interface Player {
  id: string;
  name: string;
  missions: PlayerMission[];
  totalPoints: number;
  completedMissions: number;
  targetMissionCount: number;
}

export interface PlayerMission {
  mission: Mission;
  state: MissionState;
  assignedAt: Date;
  completedAt?: Date;
  completionTimeMs?: number;
  pointsAwarded: number;
}

export interface Mission {
  id: string;
  text: string;
  difficulty: DifficultyLevel;
  points: number;
}

export interface GameConfiguration {
  missionsPerPlayer: number;
  difficultyMode: DifficultyMode;
  uniformDifficulty?: DifficultyLevel;
}

export interface GameState {
  id: string;
  players: Player[];
  configuration: GameConfiguration;
  status: GameStatus;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  winner?: Player;
}

export enum MissionState {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CAUGHT = 'CAUGHT'
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum DifficultyMode {
  UNIFORM = 'UNIFORM',    // All missions same difficulty
  MIXED = 'MIXED'         // Players choose difficulty per mission
}

export enum GameStatus {
  SETUP = 'SETUP',
  CONFIGURING = 'CONFIGURING',
  ASSIGNING = 'ASSIGNING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED'
}

// Utility functions for scoring, timing, and winner determination

export const getDifficultyPoints = (difficulty: DifficultyLevel): number => {
  switch (difficulty) {
    case DifficultyLevel.EASY:
      return 1;
    case DifficultyLevel.MEDIUM:
      return 2;
    case DifficultyLevel.HARD:
      return 3;
    default:
      return 1;
  }
};

export const calculateMissionScore = (
  difficulty: DifficultyLevel,
  state: MissionState
): number => {
  if (state === MissionState.COMPLETED) {
    return getDifficultyPoints(difficulty);
  }
  return 0;
};

export const calculateCompletionTime = (
  assignedAt: Date,
  completedAt: Date
): number => {
  return completedAt.getTime() - assignedAt.getTime();
};

export const calculateAverageCompletionTime = (player: Player): number => {
  const completedMissions = player.missions.filter(
    pm => pm.state === MissionState.COMPLETED && pm.completionTimeMs !== undefined
  );
  
  if (completedMissions.length === 0) {
    return Infinity; // Players with no completed missions rank lowest
  }
  
  const totalTime = completedMissions.reduce(
    (sum, pm) => sum + (pm.completionTimeMs || 0),
    0
  );
  
  return totalTime / completedMissions.length;
};

export const determineWinner = (players: Player[]): Player | null => {
  if (players.length === 0) {
    return null;
  }
  
  // Sort players by total points (descending), then by average completion time (ascending)
  const sortedPlayers = [...players].sort((a, b) => {
    // Primary: highest total points
    if (a.totalPoints !== b.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    
    // Tiebreaker: fastest average completion time
    const avgTimeA = calculateAverageCompletionTime(a);
    const avgTimeB = calculateAverageCompletionTime(b);
    return avgTimeA - avgTimeB;
  });
  
  return sortedPlayers[0];
};

export const hasPlayerReachedMissionLimit = (player: Player): boolean => {
  return player.missions.length >= player.targetMissionCount;
};

export const canGameEnd = (players: Player[]): boolean => {
  // Game can end when at least one player has completed all their missions
  return players.some(player => 
    player.completedMissions >= player.targetMissionCount
  );
};

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
  // Allow same status (no-op transitions)
  if (from === to) {
    return true;
  }
  
  switch (from) {
    case GameStatus.SETUP:
      return to === GameStatus.CONFIGURING;
    case GameStatus.CONFIGURING:
      return to === GameStatus.ASSIGNING || to === GameStatus.SETUP || to === GameStatus.IN_PROGRESS; // Allow direct to IN_PROGRESS for assignment completion
    case GameStatus.ASSIGNING:
      return to === GameStatus.IN_PROGRESS || to === GameStatus.CONFIGURING; // Allow back to configuring
    case GameStatus.IN_PROGRESS:
      return to === GameStatus.FINISHED || to === GameStatus.ASSIGNING; // Allow back to assigning
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

export const isValidGameConfiguration = (config: GameConfiguration): boolean => {
  // Validate missions per player (1-10)
  if (config.missionsPerPlayer < 1 || config.missionsPerPlayer > 10) {
    return false;
  }
  
  // Validate difficulty mode
  if (!Object.values(DifficultyMode).includes(config.difficultyMode)) {
    return false;
  }
  
  // If uniform mode, must have a valid uniform difficulty
  if (config.difficultyMode === DifficultyMode.UNIFORM) {
    if (!config.uniformDifficulty || !Object.values(DifficultyLevel).includes(config.uniformDifficulty)) {
      return false;
    }
  }
  
  return true;
};

// Game state factory functions with configuration support
export const createInitialGameState = (): GameState => {
  const now = new Date();
  return {
    id: `game_${now.getTime()}`,
    players: [],
    configuration: {
      missionsPerPlayer: 3, // Default to 3 missions per player
      difficultyMode: DifficultyMode.MIXED, // Default to mixed difficulty
    },
    status: GameStatus.SETUP,
    createdAt: now,
    updatedAt: now
  };
};

export const createGameConfiguration = (
  missionsPerPlayer: number,
  difficultyMode: DifficultyMode,
  uniformDifficulty?: DifficultyLevel
): GameConfiguration => {
  return {
    missionsPerPlayer,
    difficultyMode,
    uniformDifficulty
  };
};

export const createPlayer = (name: string, targetMissionCount: number = 3): Player => {
  return {
    id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim(),
    missions: [],
    totalPoints: 0,
    completedMissions: 0,
    targetMissionCount
  };
};

export const createPlayerMission = (
  mission: Mission,
  assignedAt: Date = new Date()
): PlayerMission => {
  return {
    mission,
    state: MissionState.WAITING,
    assignedAt,
    pointsAwarded: 0
  };
};

export const createMission = (
  id: string,
  text: string,
  difficulty: DifficultyLevel
): Mission => {
  return {
    id,
    text,
    difficulty,
    points: getDifficultyPoints(difficulty)
  };
};