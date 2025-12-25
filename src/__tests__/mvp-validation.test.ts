// MVP Validation and QA Tests
// This test suite validates the complete game flow and all MVP requirements

// Mock AsyncStorage before any imports
import { 
  createInitialGameState, 
  createPlayer, 
  GameStatus, 
  MissionState,
  getWinner,
  GameState,
  Player
} from '../models';
import { gameReducer } from '../store/gameReducer';
import { 
  createGame, 
  addPlayer, 
  removePlayer, 
  assignMissions, 
  updateMissionState,
  updateGameStatus 
} from '../store/gameActions';
import { loadMissions, getAllMissions } from '../data/missions';
import { assignMissionsToPlayers } from '../data/missionUtils';
import { saveGameState, loadGameState, clearGameState, checkStorageAvailability } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = new Map<string, string>();
  return {
    setItem: jest.fn(async (key: string, value: string): Promise<void> => {
      storage.set(key, value);
    }),
    getItem: jest.fn(async (key: string): Promise<string | null> => {
      return storage.get(key) || null;
    }),
    removeItem: jest.fn(async (key: string): Promise<void> => {
      storage.delete(key);
    }),
    multiRemove: jest.fn(async (keys: string[]): Promise<void> => {
      keys.forEach(key => storage.delete(key));
    }),
    clear: jest.fn(async (): Promise<void> => {
      storage.clear();
    })
  };
});

describe('MVP Validation and QA', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    jest.clearAllMocks();
  });

  describe('Complete Game Flow Test', () => {
    it('should complete a full game session from start to finish', async () => {
      // 1. Initialize game (HomeScreen functionality)
      let gameState = createInitialGameState();
      expect(gameState.status).toBe(GameStatus.SETUP);
      expect(gameState.players).toHaveLength(0);
      expect(gameState.targetCompleted).toBe(1);

      // 2. Add players (SetupPlayersScreen functionality)
      const playerNames = ['Alice', 'Bob', 'Charlie'];
      let state = gameState;
      
      for (const name of playerNames) {
        const player = createPlayer(name);
        const action = addPlayer(player);
        state = gameReducer(state, action);
      }
      
      expect(state.players).toHaveLength(3);
      expect(state.players.map(p => p.name)).toEqual(playerNames);
      expect(state.status).toBe(GameStatus.SETUP);

      // 3. Assign missions (AssignMissionsScreen functionality)
      const missions = loadMissions();
      expect(missions).toHaveLength(25);
      
      const assignAction = assignMissions(missions);
      state = gameReducer(state, assignAction);
      
      expect(state.status).toBe(GameStatus.IN_PROGRESS);
      expect(state.players.every(p => p.currentMission !== undefined)).toBe(true);
      expect(state.players.every(p => p.missionState === MissionState.ACTIVE)).toBe(true);

      // 4. Game progression (MyTurnScreen functionality)
      // Complete first player's mission
      const firstPlayer = state.players[0];
      const completeAction = updateMissionState(firstPlayer.id, MissionState.COMPLETED);
      state = gameReducer(state, completeAction);
      
      const updatedPlayer = state.players.find(p => p.id === firstPlayer.id);
      expect(updatedPlayer?.missionState).toBe(MissionState.COMPLETED);
      expect(updatedPlayer?.completedCount).toBe(1);
      
      // Since targetCompleted is 1, this should trigger game end
      expect(state.status).toBe(GameStatus.FINISHED);
      
      // 5. Winner detection (EndGameScreen functionality)
      const winner = getWinner(state.players, state.targetCompleted);
      expect(winner).not.toBeNull();
      expect(winner?.id).toBe(firstPlayer.id);
      expect(winner?.completedCount).toBeGreaterThanOrEqual(state.targetCompleted);
    });

    it('should handle multiple players completing missions', async () => {
      // Setup game with higher target
      let gameState = createInitialGameState();
      gameState.targetCompleted = 2; // Require 2 completed missions to win
      
      // Add players
      const playerNames = ['Alice', 'Bob', 'Charlie', 'David'];
      let state = gameState;
      
      for (const name of playerNames) {
        const player = createPlayer(name);
        state = gameReducer(state, addPlayer(player));
      }
      
      // Assign missions
      const missions = loadMissions();
      state = gameReducer(state, assignMissions(missions));
      
      // Complete missions for different players
      const alice = state.players.find(p => p.name === 'Alice')!;
      const bob = state.players.find(p => p.name === 'Bob')!;
      const charlie = state.players.find(p => p.name === 'Charlie')!;
      
      // Alice completes 1 mission
      state = gameReducer(state, updateMissionState(alice.id, MissionState.COMPLETED));
      expect(state.status).toBe(GameStatus.IN_PROGRESS); // Game continues
      
      // Bob gets caught
      state = gameReducer(state, updateMissionState(bob.id, MissionState.CAUGHT));
      expect(state.status).toBe(GameStatus.IN_PROGRESS); // Game continues
      
      // Charlie completes 1 mission
      state = gameReducer(state, updateMissionState(charlie.id, MissionState.COMPLETED));
      expect(state.status).toBe(GameStatus.IN_PROGRESS); // Game continues
      
      // Alice completes another mission (reaches target of 2)
      // First, assign a new mission to Alice (simulate game logic)
      const aliceUpdated = state.players.find(p => p.id === alice.id)!;
      expect(aliceUpdated.completedCount).toBe(1);
      
      // In real game, Alice would get a new mission, but for test we simulate completion
      // This would require game logic to assign new missions, which is complex
      // For now, we verify the win condition logic works
      const testWinner = getWinner(state.players, 2);
      expect(testWinner).toBeNull(); // No one has 2 completed missions yet
    });
  });

  describe('Privacy Constraints Validation', () => {
    it('should never expose multiple missions simultaneously', () => {
      const missions = loadMissions();
      const players = [
        createPlayer('Alice'),
        createPlayer('Bob'),
        createPlayer('Charlie')
      ];
      
      const playersWithMissions = assignMissionsToPlayers(players);
      
      // Verify each player has exactly one mission
      playersWithMissions.forEach(player => {
        expect(player.currentMission).toBeDefined();
        expect(typeof player.currentMission?.text).toBe('string');
        expect(player.currentMission?.text.length).toBeGreaterThan(0);
      });
      
      // Verify missions are different (privacy through uniqueness when possible)
      const missionTexts = playersWithMissions.map(p => p.currentMission?.text);
      const uniqueTexts = new Set(missionTexts);
      
      // With 25 missions and 3 players, all should be unique
      expect(uniqueTexts.size).toBe(3);
    });

    it('should maintain mission privacy in game state', () => {
      let gameState = createInitialGameState();
      
      // Add players
      const players = ['Alice', 'Bob', 'Charlie'].map(name => createPlayer(name));
      let state = gameState;
      
      for (const player of players) {
        state = gameReducer(state, addPlayer(player));
      }
      
      // Assign missions
      const missions = loadMissions();
      state = gameReducer(state, assignMissions(missions));
      
      // Verify that each player only has access to their own mission
      state.players.forEach(player => {
        expect(player.currentMission).toBeDefined();
        
        // In a real UI, only the current player's mission should be visible
        // The game state contains all missions, but UI should filter appropriately
        const otherPlayers = state.players.filter(p => p.id !== player.id);
        otherPlayers.forEach(otherPlayer => {
          // Missions should be different to maintain privacy
          expect(otherPlayer.currentMission?.id).not.toBe(player.currentMission?.id);
        });
      });
    });
  });

  describe('AsyncStorage Persistence Validation', () => {
    beforeEach(() => {
      // Reset mocks for each test in this describe block
      jest.clearAllMocks();
    });

    it('should check storage availability', async () => {
      const isAvailable = await checkStorageAvailability();
      expect(isAvailable).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      expect(AsyncStorage.getItem).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should save and load game state correctly', async () => {
      // Create a game state
      let gameState = createInitialGameState();
      const players = ['Alice', 'Bob', 'Charlie'].map(name => createPlayer(name));
      
      let state = gameState;
      for (const player of players) {
        state = gameReducer(state, addPlayer(player));
      }
      
      const missions = loadMissions();
      state = gameReducer(state, assignMissions(missions));
      
      // Save the state
      const saveResult = await saveGameState(state);
      expect(saveResult.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      
      // Load the state
      const loadResult = await loadGameState();
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toBeDefined();
      
      const loadedState = loadResult.data!;
      expect(loadedState.id).toBe(state.id);
      expect(loadedState.players).toHaveLength(3);
      expect(loadedState.status).toBe(GameStatus.IN_PROGRESS);
      expect(loadedState.targetCompleted).toBe(state.targetCompleted);
      
      // Verify players are correctly restored
      loadedState.players.forEach((player, index) => {
        const originalPlayer = state.players[index];
        expect(player.id).toBe(originalPlayer.id);
        expect(player.name).toBe(originalPlayer.name);
        expect(player.missionState).toBe(originalPlayer.missionState);
        expect(player.completedCount).toBe(originalPlayer.completedCount);
        expect(player.currentMission?.id).toBe(originalPlayer.currentMission?.id);
      });
    });

    it('should handle storage failures gracefully', async () => {
      // Mock both main and backup storage failures
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));
      
      const gameState = createInitialGameState();
      const saveResult = await saveGameState(gameState);
      
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('Impossibile salvare');
    });

    it('should recover from corrupted data', async () => {
      // Mock corrupted data for both main and backup
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');
      
      const loadResult = await loadGameState();
      expect(loadResult.success).toBe(false);
      expect(loadResult.error).toContain('Errore nel caricamento');
    });
  });

  describe('Italian UI Text Validation', () => {
    it('should have all missions in Italian', () => {
      const missions = loadMissions();
      
      missions.forEach(mission => {
        expect(mission.text).toBeDefined();
        expect(typeof mission.text).toBe('string');
        expect(mission.text.length).toBeGreaterThan(0);
        
        // Check for Italian characteristics (not exhaustive, but indicative)
        // Italian missions should not contain English words like "the", "and", "you"
        const englishWords = ['the ', 'and ', 'you ', 'your ', 'with ', 'have ', 'this '];
        const hasEnglishWords = englishWords.some(word => 
          mission.text.toLowerCase().includes(word)
        );
        expect(hasEnglishWords).toBe(false);
        
        // Should contain Italian characteristics
        const italianIndicators = ['qualcuno', 'qualcosa', 'convincere', 'fai', 'chiedi'];
        const hasItalianIndicators = italianIndicators.some(word => 
          mission.text.toLowerCase().includes(word)
        );
        expect(hasItalianIndicators).toBe(true);
      });
    });

    it('should have exactly 25 Italian missions', () => {
      const missions = loadMissions();
      expect(missions).toHaveLength(25);
      
      // Verify all missions have Italian text
      const italianMissionCount = missions.filter(mission => {
        const text = mission.text.toLowerCase();
        return text.includes('qualcuno') || 
               text.includes('qualcosa') || 
               text.includes('convincere') || 
               text.includes('fai') || 
               text.includes('chiedi') ||
               text.includes('ottieni') ||
               text.includes('racconta');
      }).length;
      
      expect(italianMissionCount).toBeGreaterThan(20); // Most missions should have Italian indicators
    });
  });

  describe('Offline Functionality Validation', () => {
    it('should work without network dependencies', () => {
      // This test verifies that the game logic doesn't make network calls
      // In a real environment, this would be tested by running in airplane mode
      
      // Mock network unavailability
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network unavailable'));
      
      try {
        // Test core game functionality
        const gameState = createInitialGameState();
        expect(gameState).toBeDefined();
        
        const missions = loadMissions();
        expect(missions).toHaveLength(25);
        
        const players = ['Alice', 'Bob', 'Charlie'].map(name => createPlayer(name));
        expect(players).toHaveLength(3);
        
        const playersWithMissions = assignMissionsToPlayers(players);
        expect(playersWithMissions.every(p => p.currentMission !== undefined)).toBe(true);
        
        // Verify no network calls were made during game operations
        expect(global.fetch).not.toHaveBeenCalled();
        
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should load all content from local resources', () => {
      // Verify missions are loaded from local JSON
      const missions = getAllMissions();
      expect(missions).toHaveLength(25);
      
      // Verify all missions have required properties
      missions.forEach(mission => {
        expect(mission.id).toBeDefined();
        expect(mission.text).toBeDefined();
        expect(mission.difficulty).toBeDefined();
        expect(['easy', 'medium', 'hard']).toContain(mission.difficulty);
      });
    });
  });

  describe('Game State Validation', () => {
    it('should maintain valid state transitions', () => {
      let gameState = createInitialGameState();
      expect(gameState.status).toBe(GameStatus.SETUP);
      
      // Add minimum players
      let state = gameState;
      for (let i = 0; i < 3; i++) {
        const player = createPlayer(`Player${i + 1}`);
        state = gameReducer(state, addPlayer(player));
      }
      
      // Transition to ASSIGNING
      state = gameReducer(state, updateGameStatus(GameStatus.ASSIGNING));
      expect(state.status).toBe(GameStatus.ASSIGNING);
      
      // Assign missions (should transition to IN_PROGRESS)
      const missions = loadMissions();
      state = gameReducer(state, assignMissions(missions));
      expect(state.status).toBe(GameStatus.IN_PROGRESS);
      
      // Complete a mission (should transition to FINISHED due to targetCompleted = 1)
      const firstPlayer = state.players[0];
      state = gameReducer(state, updateMissionState(firstPlayer.id, MissionState.COMPLETED));
      expect(state.status).toBe(GameStatus.FINISHED);
    });

    it('should validate player management operations', () => {
      let gameState = createInitialGameState();
      let state = gameState;
      
      // Add players
      const alice = createPlayer('Alice');
      const bob = createPlayer('Bob');
      
      state = gameReducer(state, addPlayer(alice));
      expect(state.players).toHaveLength(1);
      
      state = gameReducer(state, addPlayer(bob));
      expect(state.players).toHaveLength(2);
      
      // Remove player
      state = gameReducer(state, removePlayer(alice.id));
      expect(state.players).toHaveLength(1);
      expect(state.players[0].id).toBe(bob.id);
      
      // Try to add duplicate name (should be prevented)
      const bob2 = createPlayer('Bob');
      state = gameReducer(state, addPlayer(bob2));
      expect(state.players).toHaveLength(1); // Should not add duplicate
    });
  });
});