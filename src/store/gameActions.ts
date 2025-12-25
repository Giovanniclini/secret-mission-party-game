// Game actions for state management
import { GameState, Player, Mission, GameStatus, MissionState } from '../models';

export enum GameActionType {
  CREATE_GAME = 'CREATE_GAME',
  ADD_PLAYER = 'ADD_PLAYER',
  REMOVE_PLAYER = 'REMOVE_PLAYER',
  ASSIGN_MISSIONS = 'ASSIGN_MISSIONS',
  UPDATE_MISSION_STATE = 'UPDATE_MISSION_STATE',
  LOAD_GAME = 'LOAD_GAME',
  UPDATE_GAME_STATUS = 'UPDATE_GAME_STATUS',
  CLEAR_FINISHED_GAME = 'CLEAR_FINISHED_GAME'
}

export interface CreateGameAction {
  type: GameActionType.CREATE_GAME;
}

export interface AddPlayerAction {
  type: GameActionType.ADD_PLAYER;
  payload: {
    player: Player;
    mission?: Mission; // Optional mission for players added during active games
  };
}

export interface RemovePlayerAction {
  type: GameActionType.REMOVE_PLAYER;
  payload: {
    playerId: string;
  };
}

export interface AssignMissionsAction {
  type: GameActionType.ASSIGN_MISSIONS;
  payload: {
    missions: Mission[];
  };
}

export interface UpdateMissionStateAction {
  type: GameActionType.UPDATE_MISSION_STATE;
  payload: {
    playerId: string;
    newState: MissionState;
  };
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

export type GameAction = 
  | CreateGameAction
  | AddPlayerAction
  | RemovePlayerAction
  | AssignMissionsAction
  | UpdateMissionStateAction
  | LoadGameAction
  | UpdateGameStatusAction
  | ClearFinishedGameAction;

// Action creators
export const createGame = (): CreateGameAction => ({
  type: GameActionType.CREATE_GAME
});

export const addPlayer = (player: Player, mission?: Mission): AddPlayerAction => ({
  type: GameActionType.ADD_PLAYER,
  payload: { player, mission }
});

export const removePlayer = (playerId: string): RemovePlayerAction => ({
  type: GameActionType.REMOVE_PLAYER,
  payload: { playerId }
});

export const assignMissions = (missions: Mission[]): AssignMissionsAction => ({
  type: GameActionType.ASSIGN_MISSIONS,
  payload: { missions }
});

export const updateMissionState = (playerId: string, newState: MissionState): UpdateMissionStateAction => ({
  type: GameActionType.UPDATE_MISSION_STATE,
  payload: { playerId, newState }
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