// Tests for enhanced storage utilities
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveGameState,
  loadGameState,
  clearGameState,
  clearNonProgressGameState,
  checkStorageAvailability
} from './storage';
import {
  createInitialGameState,
  GameStatus,
  DifficultyLevel,
  DifficultyMode,
  MissionState
} from '../models';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn()
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Enhanced Storage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveGameState', () => {
    it('should save IN_PROGRESS game state successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      
      const gameState = createInitialGameState();
      gameState.status = GameStatus.IN_PROGRESS;
      const result = await saveGameState(gameState);
      
      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(2); // Main + backup
    });

    it('should not save non-IN_PROGRESS game states', async () => {
      const gameState = createInitialGameState();
      gameState.status = GameStatus.SETUP;
      const result = await saveGameState(gameState);
      
      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should not save CONFIGURING game states', async () => {
      const gameState = createInitialGameState();
      gameState.status = GameStatus.CONFIGURING;
      const result = await saveGameState(gameState);
      
      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should not save ASSIGNING game states', async () => {
      const gameState = createInitialGameState();
      gameState.status = GameStatus.ASSIGNING;
      const result = await saveGameState(gameState);
      
      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle main storage failure with backup for IN_PROGRESS games', async () => {
      mockAsyncStorage.setItem
        .mockRejectedValueOnce(new Error('Main storage failed'))
        .mockResolvedValueOnce(); // Backup succeeds
      
      const gameState = createInitialGameState();
      gameState.status = GameStatus.IN_PROGRESS;
      const result = await saveGameState(gameState);
      
      expect(result.success).toBe(true);
      expect(result.error).toContain('backup');
    });

    it('should handle complete storage failure for IN_PROGRESS games', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage failed'));
      
      const gameState = createInitialGameState();
      gameState.status = GameStatus.IN_PROGRESS;
      const result = await saveGameState(gameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Impossibile salvare');
    });
  });

  describe('loadGameState', () => {
    it('should load valid IN_PROGRESS game state', async () => {
      const gameState = createInitialGameState();
      gameState.status = GameStatus.IN_PROGRESS;
      gameState.configuration = {
        missionsPerPlayer: 3,
        difficultyMode: DifficultyMode.MIXED
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(gameState));
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.status).toBe(GameStatus.IN_PROGRESS);
    });

    it('should clear and return fresh state for non-IN_PROGRESS games', async () => {
      const gameState = createInitialGameState();
      gameState.status = GameStatus.CONFIGURING;
      gameState.configuration = {
        missionsPerPlayer: 3,
        difficultyMode: DifficultyMode.MIXED
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(gameState));
      mockAsyncStorage.multiRemove.mockResolvedValue();
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.status).toBe(GameStatus.SETUP); // Fresh state
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalled();
    });

    it('should return initial state when no data exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.players).toEqual([]);
    });

    it('should handle corrupted data with sanitization for IN_PROGRESS games', async () => {
      const corruptedData = {
        id: 'test',
        players: [{
          id: 'player1',
          name: 'Test Player',
          missions: [],
          totalPoints: 10, // Wrong total
          completedMissions: 0,
          targetMissionCount: 3
        }],
        configuration: {
          missionsPerPlayer: 3,
          difficultyMode: DifficultyMode.MIXED
        },
        status: GameStatus.IN_PROGRESS, // Must be IN_PROGRESS to persist
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(corruptedData));
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data?.players[0].totalPoints).toBe(0); // Sanitized
    });

    it('should recover from backup when main data is corrupted', async () => {
      const validGameState = createInitialGameState();
      validGameState.status = GameStatus.IN_PROGRESS;
      validGameState.configuration = {
        missionsPerPlayer: 3,
        difficultyMode: DifficultyMode.MIXED
      };
      
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('invalid json') // Main storage corrupted
        .mockResolvedValueOnce(JSON.stringify(validGameState)); // Backup valid
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(GameStatus.IN_PROGRESS);
    });

    it('should handle complete storage failure', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage unavailable'));
      
      const result = await loadGameState();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Impossibile accedere');
    });

    it('should handle parse errors', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('invalid json')
        .mockResolvedValueOnce(null); // No backup
      
      const result = await loadGameState();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('caricamento');
    });
  });

  describe('clearGameState', () => {
    it('should clear game state successfully', async () => {
      mockAsyncStorage.multiRemove.mockResolvedValue();
      
      const result = await clearGameState();
      
      expect(result.success).toBe(true);
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'secret_mission_game_state',
        'secret_mission_game_state_backup'
      ]);
    });

    it('should handle clear failure', async () => {
      mockAsyncStorage.multiRemove.mockRejectedValue(new Error('Clear failed'));
      
      const result = await clearGameState();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('cancellare');
    });
  });

  describe('checkStorageAvailability', () => {
    it('should return true when storage is available', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue('test');
      mockAsyncStorage.removeItem.mockResolvedValue();
      
      const isAvailable = await checkStorageAvailability();
      
      expect(isAvailable).toBe(true);
    });

    it('should return false when storage is unavailable', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage unavailable'));
      
      const isAvailable = await checkStorageAvailability();
      
      expect(isAvailable).toBe(false);
    });

    it('should return false when retrieved value does not match', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue('wrong_value');
      mockAsyncStorage.removeItem.mockResolvedValue();
      
      const isAvailable = await checkStorageAvailability();
      
      expect(isAvailable).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize player scoring data during load for IN_PROGRESS games', async () => {
      const gameStateWithBadData = {
        id: 'test',
        players: [{
          id: 'player1',
          name: 'Test Player',
          missions: [{
            mission: {
              id: 'mission1',
              text: 'Test mission',
              difficulty: DifficultyLevel.MEDIUM,
              points: 2
            },
            state: MissionState.COMPLETED,
            assignedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            completionTimeMs: 5000,
            pointsAwarded: 5 // Wrong points for medium difficulty
          }],
          totalPoints: 10, // Wrong total
          completedMissions: 0, // Wrong count
          targetMissionCount: 3
        }],
        configuration: {
          missionsPerPlayer: 3,
          difficultyMode: DifficultyMode.MIXED
        },
        status: GameStatus.IN_PROGRESS, // Must be IN_PROGRESS to persist
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(gameStateWithBadData));
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data?.players[0].totalPoints).toBe(2); // Corrected
      expect(result.data?.players[0].completedMissions).toBe(1); // Corrected
      expect(result.data?.players[0].missions[0].pointsAwarded).toBe(2); // Corrected
    });

    it('should handle missing required fields with defaults for IN_PROGRESS games', async () => {
      const incompleteData = {
        id: 'test',
        players: [{
          id: 'player1',
          name: 'Test Player',
          missions: []
          // Missing totalPoints, completedMissions, targetMissionCount
        }],
        configuration: {
          missionsPerPlayer: 3,
          difficultyMode: DifficultyMode.MIXED
        },
        status: GameStatus.IN_PROGRESS, // Must be IN_PROGRESS to persist
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(incompleteData));
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data?.players[0].totalPoints).toBe(0); // Default
      expect(result.data?.players[0].completedMissions).toBe(0); // Default
      expect(result.data?.players[0].targetMissionCount).toBe(3); // Default
    });

    it('should clear non-IN_PROGRESS games even with valid data', async () => {
      const validButNonProgressData = {
        id: 'test',
        players: [{
          id: 'player1',
          name: 'Test Player',
          missions: [],
          totalPoints: 0,
          completedMissions: 0,
          targetMissionCount: 3
        }],
        configuration: {
          missionsPerPlayer: 3,
          difficultyMode: DifficultyMode.MIXED
        },
        status: GameStatus.ASSIGNING, // Not IN_PROGRESS
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(validButNonProgressData));
      mockAsyncStorage.multiRemove.mockResolvedValue();
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(GameStatus.SETUP); // Fresh state
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });
});