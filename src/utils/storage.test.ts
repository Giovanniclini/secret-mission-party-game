// Tests for enhanced storage utilities
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveGameState,
  loadGameState,
  clearGameState,
  checkStorageAvailability
} from './storage';
import {
  createInitialGameState,
  createPlayer,
  createMission,
  createPlayerMission,
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
    it('should save game state successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      
      const gameState = createInitialGameState();
      const result = await saveGameState(gameState);
      
      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(2); // Main + backup
    });

    it('should handle main storage failure with backup', async () => {
      mockAsyncStorage.setItem
        .mockRejectedValueOnce(new Error('Main storage failed'))
        .mockResolvedValueOnce(); // Backup succeeds
      
      const gameState = createInitialGameState();
      const result = await saveGameState(gameState);
      
      expect(result.success).toBe(true);
      expect(result.error).toContain('backup');
    });

    it('should handle complete storage failure', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage failed'));
      
      const gameState = createInitialGameState();
      const result = await saveGameState(gameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Impossibile salvare');
    });
  });

  describe('loadGameState', () => {
    it('should load valid game state', async () => {
      const gameState = createInitialGameState();
      gameState.configuration = {
        missionsPerPlayer: 3,
        difficultyMode: DifficultyMode.MIXED
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(gameState));
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(gameState.id);
    });

    it('should return initial state when no data exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.players).toEqual([]);
    });

    it('should handle corrupted data with sanitization', async () => {
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
        status: 'SETUP',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(corruptedData));
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data?.players[0].totalPoints).toBe(0); // Sanitized
      expect(result.error).toContain('riparati');
    });

    it('should recover from backup when main data is corrupted', async () => {
      const validGameState = createInitialGameState();
      validGameState.configuration = {
        missionsPerPlayer: 3,
        difficultyMode: DifficultyMode.MIXED
      };
      
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('invalid json') // Main storage corrupted
        .mockResolvedValueOnce(JSON.stringify(validGameState)); // Backup valid
      
      const result = await loadGameState();
      
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(validGameState.id);
      expect(result.error).toContain('recuperati');
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
    it('should sanitize player scoring data during load', async () => {
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
        status: 'IN_PROGRESS',
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

    it('should handle missing required fields with defaults', async () => {
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
        status: 'SETUP',
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
  });
});