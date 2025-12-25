// Game reducer for state management
import { 
  GameState, 
  GameStatus, 
  MissionState, 
  createInitialGameState,
  isValidMissionStateTransition,
  isValidGameStatusTransition,
  determineWinner,
  calculateCompletionTime,
  calculateMissionScore,
  hasPlayerReachedMissionLimit,
  createPlayerMission,
  DifficultyMode,
  DifficultyLevel
} from '../models';
import { GameAction, GameActionType } from './gameActions';
import { 
  validateGameConfiguration, 
  validateMissionTiming, 
  validateMissionPoints,
  sanitizeCompletionTime,
  sanitizePlayerScoring
} from '../utils/validation';
import { logError, createAppError } from '../utils/errorUtils';

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  const now = new Date();
  
  switch (action.type) {
    case GameActionType.CREATE_GAME:
      return createInitialGameState();

    case GameActionType.CONFIGURE_GAME:
      const { configuration } = action.payload;
      
      // Validate configuration
      const configValidation = validateGameConfiguration(configuration);
      if (!configValidation.isValid) {
        logError(createAppError('VALIDATION', configValidation.error), 'gameReducer:CONFIGURE_GAME');
        return state; // Don't update state with invalid configuration
      }

      // Update existing players' targetMissionCount to match new configuration
      const updatedPlayersWithNewTarget = state.players.map(player => ({
        ...player,
        targetMissionCount: configuration.missionsPerPlayer
      }));

      return {
        ...state,
        configuration,
        players: updatedPlayersWithNewTarget,
        status: GameStatus.CONFIGURING,
        updatedAt: now
      };

    case GameActionType.ADD_PLAYER:
      // Check for duplicate names
      const existingPlayer = state.players.find(p => 
        p.name.toLowerCase() === action.payload.player.name.toLowerCase()
      );
      
      if (existingPlayer) {
        return state; // Don't add duplicate names
      }

      const newPlayer = {
        ...action.payload.player,
        targetMissionCount: state.configuration.missionsPerPlayer
      };

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

    case GameActionType.ASSIGN_MISSION_WITH_DIFFICULTY:
      const { playerId, mission, difficulty } = action.payload;
      
      const updatedPlayersWithMission = state.players.map(player => {
        if (player.id !== playerId) {
          return player;
        }

        // Check if player has reached mission limit
        if (hasPlayerReachedMissionLimit(player)) {
          return player; // Don't assign more missions
        }

        // Create mission with appropriate difficulty
        let finalMission = mission;
        if (state.configuration.difficultyMode === DifficultyMode.MIXED && difficulty) {
          // In mixed mode, use player-selected difficulty
          finalMission = {
            ...mission,
            difficulty,
            points: difficulty === DifficultyLevel.EASY ? 1 : 
                   difficulty === DifficultyLevel.MEDIUM ? 2 : 3
          };
        } else if (state.configuration.difficultyMode === DifficultyMode.UNIFORM && state.configuration.uniformDifficulty) {
          // In uniform mode, use configured difficulty
          finalMission = {
            ...mission,
            difficulty: state.configuration.uniformDifficulty,
            points: state.configuration.uniformDifficulty === DifficultyLevel.EASY ? 1 : 
                   state.configuration.uniformDifficulty === DifficultyLevel.MEDIUM ? 2 : 3
          };
        }

        const playerMission = createPlayerMission(finalMission, now);
        playerMission.state = MissionState.ACTIVE; // Mission becomes active when assigned

        return {
          ...player,
          missions: [...player.missions, playerMission]
        };
      });

      return {
        ...state,
        players: updatedPlayersWithMission,
        status: state.status === GameStatus.ASSIGNING ? GameStatus.IN_PROGRESS : state.status,
        updatedAt: now
      };

    case GameActionType.COMPLETE_MISSION_WITH_TIMING:
      const { playerId: completingPlayerId, missionId, state: newMissionState, completedAt } = action.payload;
      
      const playersWithCompletedMission = state.players.map(player => {
        if (player.id !== completingPlayerId) {
          return player;
        }

        const updatedMissions = player.missions.map(playerMission => {
          if (playerMission.mission.id !== missionId) {
            return playerMission;
          }

          // Validate state transition
          if (!isValidMissionStateTransition(playerMission.state, newMissionState)) {
            logError(createAppError('VALIDATION', `Invalid mission state transition from ${playerMission.state} to ${newMissionState}`), 'gameReducer:COMPLETE_MISSION_WITH_TIMING');
            return playerMission; // Invalid transition, don't update
          }

          // Validate and sanitize timing
          let completionTimeMs = 0;
          let pointsAwarded = 0;

          if (newMissionState === MissionState.COMPLETED) {
            // Validate timing
            const timingValidation = validateMissionTiming(playerMission.assignedAt, completedAt);
            if (timingValidation.isValid) {
              completionTimeMs = timingValidation.correctedTime || calculateCompletionTime(playerMission.assignedAt, completedAt);
            } else {
              logError(createAppError('VALIDATION', timingValidation.error), 'gameReducer:COMPLETE_MISSION_WITH_TIMING');
              completionTimeMs = sanitizeCompletionTime(playerMission.assignedAt, completedAt);
            }

            // Calculate points
            pointsAwarded = calculateMissionScore(playerMission.mission.difficulty, newMissionState);

            // Validate points
            const pointsValidation = validateMissionPoints(
              playerMission.mission.difficulty,
              pointsAwarded,
              newMissionState
            );
            if (!pointsValidation.isValid) {
              logError(createAppError('VALIDATION', pointsValidation.error), 'gameReducer:COMPLETE_MISSION_WITH_TIMING');
              pointsAwarded = 0; // Fallback to 0 points on validation error
            }
          }

          return {
            ...playerMission,
            state: newMissionState,
            completedAt,
            completionTimeMs,
            pointsAwarded
          };
        });

        // Recalculate player totals with validation
        const completedMissions = updatedMissions.filter(pm => pm.state === MissionState.COMPLETED).length;
        const totalPoints = updatedMissions.reduce((sum, pm) => sum + pm.pointsAwarded, 0);

        const updatedPlayer = {
          ...player,
          missions: updatedMissions,
          completedMissions,
          totalPoints
        };

        // Apply sanitization to ensure data integrity
        return sanitizePlayerScoring(updatedPlayer);
      });

      return {
        ...state,
        players: playersWithCompletedMission,
        updatedAt: now
      };

    case GameActionType.END_GAME_MANUALLY:
      try {
        const winner = determineWinner(state.players);
        
        return {
          ...state,
          status: GameStatus.FINISHED,
          winner: winner || undefined,
          endedAt: now,
          updatedAt: now
        };
      } catch (error) {
        logError(createAppError('UNKNOWN', 'Error ending game manually', error instanceof Error ? error : undefined), 'gameReducer:END_GAME_MANUALLY');
        
        // Still end the game but without winner determination
        return {
          ...state,
          status: GameStatus.FINISHED,
          endedAt: now,
          updatedAt: now
        };
      }

    case GameActionType.LOAD_GAME:
      try {
        const loadedState = {
          ...action.payload.gameState,
          // Ensure dates are Date objects
          createdAt: new Date(action.payload.gameState.createdAt),
          updatedAt: new Date(action.payload.gameState.updatedAt),
          endedAt: action.payload.gameState.endedAt ? new Date(action.payload.gameState.endedAt) : undefined
        };

        // Sanitize player data to ensure integrity
        const sanitizedPlayers = loadedState.players.map(player => sanitizePlayerScoring(player));
        
        return {
          ...loadedState,
          players: sanitizedPlayers
        };
      } catch (error) {
        logError(createAppError('UNKNOWN', 'Error loading game state', error instanceof Error ? error : undefined), 'gameReducer:LOAD_GAME');
        return state; // Return current state on error
      }

    case GameActionType.UPDATE_GAME_STATUS:
      const { status } = action.payload;
      
      // Validate status transition
      if (!isValidGameStatusTransition(state.status, status)) {
        logError(createAppError('VALIDATION', `Invalid game status transition from ${state.status} to ${status}`), 'gameReducer:UPDATE_GAME_STATUS');
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

    case GameActionType.CLEAR_ALL_MISSIONS:
      // Clear all missions from all players and reset their stats
      const playersWithClearedMissions = state.players.map(player => ({
        ...player,
        missions: [],
        totalPoints: 0,
        completedMissions: 0
      }));

      return {
        ...state,
        players: playersWithClearedMissions,
        updatedAt: now
      };

    default:
      return state;
  }
};