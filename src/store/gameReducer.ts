// Game reducer for state management
import { 
  GameState, 
  GameStatus, 
  MissionState, 
  createInitialGameState,
  isValidMissionStateTransition,
  isValidGameStatusTransition,
  getWinner
} from '../models';
import { GameAction, GameActionType } from './gameActions';

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  const now = new Date();
  
  switch (action.type) {
    case GameActionType.CREATE_GAME:
      return createInitialGameState();

    case GameActionType.ADD_PLAYER:
      // Check for duplicate names
      const existingPlayer = state.players.find(p => 
        p.name.toLowerCase() === action.payload.player.name.toLowerCase()
      );
      
      if (existingPlayer) {
        return state; // Don't add duplicate names
      }

      let newPlayer = action.payload.player;
      
      // If game is in progress, assign a mission to the new player
      if (state.status === GameStatus.IN_PROGRESS && action.payload.mission) {
        newPlayer = {
          ...newPlayer,
          currentMission: action.payload.mission,
          missionState: MissionState.ACTIVE
        };
      }

      return {
        ...state,
        players: [...state.players, newPlayer],
        updatedAt: now
      };

    case GameActionType.REMOVE_PLAYER:
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload.playerId),
        updatedAt: now
      };

    case GameActionType.ASSIGN_MISSIONS:
      const { missions } = action.payload;
      const shuffledMissions = [...missions].sort(() => Math.random() - 0.5);
      
      const playersWithMissions = state.players.map((player, index) => ({
        ...player,
        currentMission: shuffledMissions[index % shuffledMissions.length],
        missionState: MissionState.ACTIVE
      }));

      return {
        ...state,
        players: playersWithMissions,
        status: GameStatus.IN_PROGRESS,
        updatedAt: now
      };

    case GameActionType.UPDATE_MISSION_STATE:
      const { playerId, newState } = action.payload;
      
      const updatedPlayers = state.players.map(player => {
        if (player.id !== playerId) {
          return player;
        }

        // Validate state transition
        if (!isValidMissionStateTransition(player.missionState, newState)) {
          return player; // Invalid transition, don't update
        }

        const updatedPlayer = {
          ...player,
          missionState: newState
        };

        // Increment completed count if mission completed
        if (newState === MissionState.COMPLETED) {
          updatedPlayer.completedCount = player.completedCount + 1;
        }

        return updatedPlayer;
      });

      // Check for winner
      const winner = getWinner(updatedPlayers, state.targetCompleted);
      const newStatus = winner ? GameStatus.FINISHED : state.status;

      return {
        ...state,
        players: updatedPlayers,
        status: newStatus,
        updatedAt: now
      };

    case GameActionType.LOAD_GAME:
      return {
        ...action.payload.gameState,
        // Ensure dates are Date objects
        createdAt: new Date(action.payload.gameState.createdAt),
        updatedAt: new Date(action.payload.gameState.updatedAt)
      };

    case GameActionType.UPDATE_GAME_STATUS:
      const { status } = action.payload;
      
      // Validate status transition
      if (!isValidGameStatusTransition(state.status, status)) {
        return state; // Invalid transition, don't update
      }

      return {
        ...state,
        status,
        updatedAt: now
      };

    case GameActionType.CLEAR_FINISHED_GAME:
      // Only clear if game is finished
      if (state.status === GameStatus.FINISHED) {
        return createInitialGameState();
      }
      return state;

    default:
      return state;
  }
};