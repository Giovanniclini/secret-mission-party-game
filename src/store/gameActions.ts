// Game actions for state management
import { GameState, Player, Mission, GameStatus, MissionState, GameConfiguration, DifficultyLevel } from '../models';

export enum GameActionType {
  CREATE_GAME = 'CREATE_GAME',
  CONFIGURE_GAME = 'CONFIGURE_GAME',
  ADD_PLAYER = 'ADD_PLAYER',
  REMOVE_PLAYER = 'REMOVE_PLAYER',
  ASSIGN_MISSION_WITH_DIFFICULTY = 'ASSIGN_MISSION_WITH_DIFFICULTY',
  COMPLETE_MISSION_WITH_TIMING = 'COMPLETE_MISSION_WITH_TIMING',
  END_GAME_MANUALLY = 'END_GAME_MANUALLY',
  LOAD_GAME = 'LOAD_GAME',
  UPDATE_GAME_STATUS = 'UPDATE_GAME_STATUS',
  CLEAR_FINISHED_GAME = 'CLEAR_FINISHED_GAME',
  CLEAR_ALL_MISSIONS = 'CLEAR_ALL_MISSIONS'
}

export interface CreateGameAction {
  type: GameActionType.CREATE_GAME;
}

export interface ConfigureGameAction {
  type: GameActionType.CONFIGURE_GAME;
  payload: {
    configuration: GameConfiguration;
  };
}

export interface AddPlayerAction {
  type: GameActionType.ADD_PLAYER;
  payload: {
    player: Player;
  };
}

export interface RemovePlayerAction {
  type: GameActionType.REMOVE_PLAYER;
  payload: {
    playerId: string;
  };
}

export interface AssignMissionWithDifficultyAction {
  type: GameActionType.ASSIGN_MISSION_WITH_DIFFICULTY;
  payload: {
    playerId: string;
    mission: Mission;
    difficulty?: DifficultyLevel; // For mixed mode, player chooses difficulty
  };
}

export interface CompleteMissionWithTimingAction {
  type: GameActionType.COMPLETE_MISSION_WITH_TIMING;
  payload: {
    playerId: string;
    missionId: string;
    state: MissionState.COMPLETED | MissionState.CAUGHT;
    completedAt: Date;
  };
}

export interface EndGameManuallyAction {
  type: GameActionType.END_GAME_MANUALLY;
}

export interface LoadGameAction {
  type: GameActionType.LOAD_GAME;
  payload: {
    gameState: GameState;
  };
}

export interface UpdateGameStatusAction {
  type: GameActionType.UPDATE_GAME_STATUS;
  payload: {
    status: GameStatus;
  };
}

export interface ClearFinishedGameAction {
  type: GameActionType.CLEAR_FINISHED_GAME;
}

export interface ClearAllMissionsAction {
  type: GameActionType.CLEAR_ALL_MISSIONS;
}

export type GameAction = 
  | CreateGameAction
  | ConfigureGameAction
  | AddPlayerAction
  | RemovePlayerAction
  | AssignMissionWithDifficultyAction
  | CompleteMissionWithTimingAction
  | EndGameManuallyAction
  | LoadGameAction
  | UpdateGameStatusAction
  | ClearFinishedGameAction
  | ClearAllMissionsAction;

// Action creators
export const createGame = (): CreateGameAction => ({
  type: GameActionType.CREATE_GAME
});

export const configureGame = (configuration: GameConfiguration): ConfigureGameAction => ({
  type: GameActionType.CONFIGURE_GAME,
  payload: { configuration }
});

export const addPlayer = (player: Player): AddPlayerAction => ({
  type: GameActionType.ADD_PLAYER,
  payload: { player }
});

export const removePlayer = (playerId: string): RemovePlayerAction => ({
  type: GameActionType.REMOVE_PLAYER,
  payload: { playerId }
});

export const assignMissionWithDifficulty = (
  playerId: string, 
  mission: Mission, 
  difficulty?: DifficultyLevel
): AssignMissionWithDifficultyAction => ({
  type: GameActionType.ASSIGN_MISSION_WITH_DIFFICULTY,
  payload: { playerId, mission, difficulty }
});

export const completeMissionWithTiming = (
  playerId: string,
  missionId: string,
  state: MissionState.COMPLETED | MissionState.CAUGHT,
  completedAt: Date = new Date()
): CompleteMissionWithTimingAction => ({
  type: GameActionType.COMPLETE_MISSION_WITH_TIMING,
  payload: { playerId, missionId, state, completedAt }
});

export const endGameManually = (): EndGameManuallyAction => ({
  type: GameActionType.END_GAME_MANUALLY
});

export const loadGame = (gameState: GameState): LoadGameAction => ({
  type: GameActionType.LOAD_GAME,
  payload: { gameState }
});

export const updateGameStatus = (status: GameStatus): UpdateGameStatusAction => ({
  type: GameActionType.UPDATE_GAME_STATUS,
  payload: { status }
});

export const clearFinishedGame = (): ClearFinishedGameAction => ({
  type: GameActionType.CLEAR_FINISHED_GAME
});

export const clearAllMissions = (): ClearAllMissionsAction => ({
  type: GameActionType.CLEAR_ALL_MISSIONS
});