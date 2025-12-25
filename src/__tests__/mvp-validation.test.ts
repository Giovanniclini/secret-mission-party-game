// MVP Validation and QA Tests
// This test suite validates the complete game flow and all MVP requirements

// Mock AsyncStorage before any imports
import { 
  createInitialGameState, 
  createPlayer, 
  GameStatus, 
  MissionState,
  determineWinner,
  GameState,
  Player,
  DifficultyLevel,
  DifficultyMode,
  createGameConfiguration,
  createPlayerMission,
  isValidGameConfiguration,
  hasMinimumPlayers,
  canGameEnd,
  calculateAverageCompletionTime
} from '../models';
import { loadMissions, getAllMissions } from '../data/missions';
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
      expect(gameState.configuration.missionsPerPlayer).toBe(3);

      // 2. Configure game (GameConfigurationScreen functionality)
      const config = createGameConfiguration(2, DifficultyMode.UNIFORM, DifficultyLevel.EASY);
      expect(isValidGameConfiguration(config)).toBe(true);
      expect(config.missionsPerPlayer).toBe(2);
      expect(config.difficultyMode).toBe(DifficultyMode.UNIFORM);
      expect(config.uniformDifficulty).toBe(DifficultyLevel.EASY);

      // 3. Add players (SetupPlayersScreen functionality)
      const playerNames = ['Alice', 'Bob', 'Charlie'];
      const players: Player[] = [];
      
      for (const name of playerNames) {
        const player = createPlayer(name, config.missionsPerPlayer);
        players.push(player);
      }
      
      expect(players).toHaveLength(3);
      expect(players.map(p => p.name)).toEqual(playerNames);
      expect(hasMinimumPlayers(players)).toBe(true);

      // 4. Assign missions (AssignMissionsScreen functionality)
      const missions = loadMissions();
      expect(missions).toHaveLength(25);
      
      // Assign first mission to each player
      const playersWithMissions = players.map((player, index) => {
        const mission = missions[index];
        const playerMission = createPlayerMission(mission);
        playerMission.state = MissionState.ACTIVE; // Simulate mission activation
        return {
          ...player,
          missions: [playerMission]
        };
      });
      
      expect(playersWithMissions.every(p => p.missions.length > 0)).toBe(true);
      expect(playersWithMissions.every(p => p.missions[0].state === MissionState.ACTIVE)).toBe(true);

      // 5. Game progression (MyTurnScreen functionality)
      // Complete first player's mission
      const firstPlayer = playersWithMissions[0];
      const completedMission = {
        ...firstPlayer.missions[0],
        state: MissionState.COMPLETED,
        completedAt: new Date(),
        completionTimeMs: 5000,
        pointsAwarded: 1 // Easy mission = 1 point
      };
      
      const updatedFirstPlayer = {
        ...firstPlayer,
        missions: [completedMission],
        totalPoints: 1,
        completedMissions: 1
      };
      
      expect(updatedFirstPlayer.missions[0].state).toBe(MissionState.COMPLETED);
      expect(updatedFirstPlayer.completedMissions).toBe(1);
      expect(updatedFirstPlayer.totalPoints).toBe(1);
      
      // Since target is 2, game should continue
      expect(canGameEnd([updatedFirstPlayer])).toBe(false);
      
      // Complete second mission to reach target
      const secondMission = missions[3]; // Use a different mission
      const secondPlayerMission = createPlayerMission(secondMission);
      secondPlayerMission.state = MissionState.COMPLETED;
      secondPlayerMission.completedAt = new Date();
      secondPlayerMission.completionTimeMs = 3000;
      secondPlayerMission.pointsAwarded = 1;
      
      const finalPlayer = {
        ...updatedFirstPlayer,
        missions: [completedMission, secondPlayerMission],
        totalPoints: 2,
        completedMissions: 2
      };
      
      expect(finalPlayer.completedMissions).toBe(2);
      expect(canGameEnd([finalPlayer])).toBe(true);
      
      // 6. Winner detection (EndGameScreen functionality)
      const allPlayers = [finalPlayer, ...playersWithMissions.slice(1)];
      const winner = determineWinner(allPlayers);
      expect(winner).not.toBeNull();
      expect(winner?.id).toBe(firstPlayer.id);
      expect(winner?.completedMissions).toBe(2);
    });

    it('should handle multiple players completing missions', async () => {
      // Setup game with higher target
      const config = createGameConfiguration(3, DifficultyMode.MIXED); // 3 missions per player
      expect(isValidGameConfiguration(config)).toBe(true);
      
      // Add players
      const playerNames = ['Alice', 'Bob', 'Charlie', 'David'];
      const players = playerNames.map(name => createPlayer(name, config.missionsPerPlayer));
      
      // Assign missions
      const missions = loadMissions();
      const playersWithMissions = players.map((player, index) => {
        const mission = missions[index];
        const playerMission = createPlayerMission(mission);
        playerMission.state = MissionState.ACTIVE;
        return {
          ...player,
          missions: [playerMission]
        };
      });
      
      // Complete missions for different players
      const alice = playersWithMissions.find(p => p.name === 'Alice')!;
      const bob = playersWithMissions.find(p => p.name === 'Bob')!;
      const charlie = playersWithMissions.find(p => p.name === 'Charlie')!;
      
      // Alice completes 1 mission
      const aliceCompleted = {
        ...alice,
        missions: [{
          ...alice.missions[0],
          state: MissionState.COMPLETED,
          completedAt: new Date(),
          completionTimeMs: 4000,
          pointsAwarded: 2 // Medium mission
        }],
        totalPoints: 2,
        completedMissions: 1
      };
      
      // Bob gets caught
      const bobCaught = {
        ...bob,
        missions: [{
          ...bob.missions[0],
          state: MissionState.CAUGHT,
          completedAt: new Date(),
          pointsAwarded: 0
        }],
        totalPoints: 0,
        completedMissions: 0
      };
      
      // Charlie completes 1 mission
      const charlieCompleted = {
        ...charlie,
        missions: [{
          ...charlie.missions[0],
          state: MissionState.COMPLETED,
          completedAt: new Date(),
          completionTimeMs: 6000,
          pointsAwarded: 2 // Medium mission
        }],
        totalPoints: 2,
        completedMissions: 1
      };
      
      const allPlayers = [aliceCompleted, bobCaught, charlieCompleted, playersWithMissions[3]];
      
      // Game should continue since no one has reached target of 3
      const hasFinishedPlayer = allPlayers.some(p => p.completedMissions >= 3);
      expect(hasFinishedPlayer).toBe(false);
      
      // Verify winner determination logic works
      const testWinner = determineWinner(allPlayers);
      expect(testWinner).not.toBeNull(); // Should have a winner based on current points
      expect(testWinner?.totalPoints).toBeGreaterThan(0);
    });
  });

  describe('Privacy Constraints Validation', () => {
    it('should never expose multiple missions simultaneously', () => {
      const missions = loadMissions();
      const players = [
        createPlayer('Alice', 3),
        createPlayer('Bob', 3),
        createPlayer('Charlie', 3)
      ];
      
      // Assign one mission to each player
      const playersWithMissions = players.map((player, index) => {
        const mission = missions[index];
        const playerMission = createPlayerMission(mission);
        return {
          ...player,
          missions: [playerMission]
        };
      });
      
      // Verify each player has exactly one mission
      playersWithMissions.forEach(player => {
        expect(player.missions).toHaveLength(1);
        expect(player.missions[0].mission.text).toBeDefined();
        expect(typeof player.missions[0].mission.text).toBe('string');
        expect(player.missions[0].mission.text.length).toBeGreaterThan(0);
      });
      
      // Verify missions are different (privacy through uniqueness when possible)
      const missionTexts = playersWithMissions.map(p => p.missions[0].mission.text);
      const uniqueTexts = new Set(missionTexts);
      
      // With 25 missions and 3 players, all should be unique
      expect(uniqueTexts.size).toBe(3);
    });

    it('should maintain mission privacy in game state', () => {
      const config = createGameConfiguration(1, DifficultyMode.MIXED);
      expect(isValidGameConfiguration(config)).toBe(true);
      
      // Add players
      const players = ['Alice', 'Bob', 'Charlie'].map(name => createPlayer(name, 1));
      expect(hasMinimumPlayers(players)).toBe(true);
      
      // Assign missions
      const missions = loadMissions();
      const playersWithMissions = players.map((player, index) => {
        const mission = missions[index];
        const playerMission = createPlayerMission(mission);
        return {
          ...player,
          missions: [playerMission]
        };
      });
      
      // Verify that each player only has access to their own mission
      playersWithMissions.forEach(player => {
        expect(player.missions).toHaveLength(1);
        expect(player.missions[0].mission).toBeDefined();
        
        // In a real UI, only the current player's mission should be visible
        // The game state contains all missions, but UI should filter appropriately
        const otherPlayers = playersWithMissions.filter(p => p.id !== player.id);
        otherPlayers.forEach(otherPlayer => {
          // Missions should be different to maintain privacy
          expect(otherPlayer.missions[0].mission.id).not.toBe(player.missions[0].mission.id);
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
      const gameState = createInitialGameState();
      const config = createGameConfiguration(2, DifficultyMode.UNIFORM, DifficultyLevel.MEDIUM);
      const stateWithConfig = {
        ...gameState,
        configuration: config,
        status: GameStatus.CONFIGURING
      };
      
      const players = ['Alice', 'Bob', 'Charlie'].map(name => createPlayer(name, 2));
      const missions = loadMissions();
      
      const playersWithMissions = players.map((player, index) => {
        const mission = missions[index];
        const playerMission = createPlayerMission(mission);
        playerMission.state = MissionState.ACTIVE;
        return {
          ...player,
          missions: [playerMission]
        };
      });
      
      const finalState = {
        ...stateWithConfig,
        players: playersWithMissions,
        status: GameStatus.IN_PROGRESS
      };
      
      // Save the state
      const saveResult = await saveGameState(finalState);
      expect(saveResult.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      
      // Load the state
      const loadResult = await loadGameState();
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toBeDefined();
      
      const loadedState = loadResult.data!;
      expect(loadedState.id).toBe(finalState.id);
      expect(loadedState.players).toHaveLength(3);
      expect(loadedState.status).toBe(GameStatus.IN_PROGRESS);
      expect(loadedState.configuration.missionsPerPlayer).toBe(finalState.configuration.missionsPerPlayer);
      
      // Verify players are correctly restored
      loadedState.players.forEach((player, index) => {
        const originalPlayer = finalState.players[index];
        expect(player.id).toBe(originalPlayer.id);
        expect(player.name).toBe(originalPlayer.name);
        expect(player.missions.length).toBe(originalPlayer.missions.length);
        expect(player.completedMissions).toBe(originalPlayer.completedMissions);
        expect(player.totalPoints).toBe(originalPlayer.totalPoints);
        if (player.missions.length > 0 && originalPlayer.missions.length > 0) {
          expect(player.missions[0].mission.id).toBe(originalPlayer.missions[0].mission.id);
        }
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
        
        const players = ['Alice', 'Bob', 'Charlie'].map(name => createPlayer(name, 3));
        expect(players).toHaveLength(3);
        
        // Test mission assignment without network
        const playersWithMissions = players.map((player, index) => {
          const mission = missions[index];
          const playerMission = createPlayerMission(mission);
          return {
            ...player,
            missions: [playerMission]
          };
        });
        expect(playersWithMissions.every(p => p.missions.length > 0)).toBe(true);
        
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
        expect(['EASY', 'MEDIUM', 'HARD']).toContain(mission.difficulty);
      });
    });
  });

  describe('Game State Validation', () => {
    it('should maintain valid state transitions', () => {
      const gameState = createInitialGameState();
      expect(gameState.status).toBe(GameStatus.SETUP);
      
      // Configure game
      const config = createGameConfiguration(1, DifficultyMode.UNIFORM, DifficultyLevel.EASY);
      expect(isValidGameConfiguration(config)).toBe(true);
      
      const configuredState = {
        ...gameState,
        configuration: config,
        status: GameStatus.CONFIGURING
      };
      expect(configuredState.status).toBe(GameStatus.CONFIGURING);
      
      // Add minimum players
      const players = [];
      for (let i = 0; i < 3; i++) {
        const player = createPlayer(`Player${i + 1}`, 1);
        players.push(player);
      }
      
      expect(hasMinimumPlayers(players)).toBe(true);
      
      // Transition to ASSIGNING
      const assigningState = {
        ...configuredState,
        players,
        status: GameStatus.ASSIGNING
      };
      expect(assigningState.status).toBe(GameStatus.ASSIGNING);
      
      // Assign missions (should transition to IN_PROGRESS)
      const missions = loadMissions();
      const playersWithMissions = players.map((player, index) => {
        const mission = missions[index];
        const playerMission = createPlayerMission(mission);
        playerMission.state = MissionState.ACTIVE;
        return {
          ...player,
          missions: [playerMission]
        };
      });
      
      const inProgressState = {
        ...assigningState,
        players: playersWithMissions,
        status: GameStatus.IN_PROGRESS
      };
      expect(inProgressState.status).toBe(GameStatus.IN_PROGRESS);
      
      // Complete a mission (should allow transition to FINISHED due to targetMissionCount = 1)
      const firstPlayer = playersWithMissions[0];
      const completedMission = {
        ...firstPlayer.missions[0],
        state: MissionState.COMPLETED,
        completedAt: new Date(),
        completionTimeMs: 5000,
        pointsAwarded: 1
      };
      
      const updatedPlayer = {
        ...firstPlayer,
        missions: [completedMission],
        totalPoints: 1,
        completedMissions: 1
      };
      
      expect(updatedPlayer.completedMissions).toBe(1);
      expect(canGameEnd([updatedPlayer])).toBe(true);
    });

    it('should validate player management operations', () => {
      const gameState = createInitialGameState();
      let players: Player[] = [];
      
      // Add players
      const alice = createPlayer('Alice', 3);
      const bob = createPlayer('Bob', 3);
      
      players.push(alice);
      expect(players).toHaveLength(1);
      
      players.push(bob);
      expect(players).toHaveLength(2);
      expect(hasMinimumPlayers(players)).toBe(false); // Need 3 minimum
      
      const charlie = createPlayer('Charlie', 3);
      players.push(charlie);
      expect(players).toHaveLength(3);
      expect(hasMinimumPlayers(players)).toBe(true);
      
      // Remove player
      players = players.filter(p => p.id !== alice.id);
      expect(players).toHaveLength(2);
      expect(players.find(p => p.id === bob.id)).toBeDefined();
      expect(players.find(p => p.id === alice.id)).toBeUndefined();
      
      // Validate configuration
      const validConfig = createGameConfiguration(5, DifficultyMode.MIXED);
      expect(isValidGameConfiguration(validConfig)).toBe(true);
      
      const invalidConfig = createGameConfiguration(15, DifficultyMode.MIXED); // Too many missions
      expect(isValidGameConfiguration(invalidConfig)).toBe(false);
    });
  });
});