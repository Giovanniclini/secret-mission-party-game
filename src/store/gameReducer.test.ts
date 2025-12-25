// Tests for game reducer functionality
import { gameReducer } from './gameReducer';
import { 
  createGame, 
  configureGame,
  addPlayer, 
  removePlayer, 
  assignMissionWithDifficulty, 
  completeMissionWithTiming,
  updateGameStatus 
} from './gameActions';
import { 
  createInitialGameState, 
  createPlayer, 
  createGameConfiguration,
  GameStatus, 
  MissionState,
  DifficultyMode,
  DifficultyLevel
} from '../models';
import { loadMissions } from '../data/missions';

// Mock the error utilities to avoid React Native dependencies
jest.mock('../utils/errorUtils', () => ({
  createAppError: jest.fn((type, message) => ({ type, message })),
  logError: jest.fn()
}));

// Mock validation utilities
jest.mock('../utils/validation', () => ({
  validateGameConfiguration: jest.fn(() => ({ isValid: true })),
  validateMissionTiming: jest.fn(() => ({ isValid: true })),
  validateMissionPoints: jest.fn(() => ({ isValid: true })),
  sanitizeCompletionTime: jest.fn((start, end) => Math.max(0, end.getTime() - start.getTime())),
  sanitizePlayerScoring: jest.fn((player) => player),
  validateEnhancedGameState: jest.fn(() => ({ isValid: true }))
}));

describe('Game Reducer', () => {
  test('should create initial game state', () => {
    const initialState = createInitialGameState();
    const action = createGame();
    const newState = gameReducer(initialState, action);
    
    expect(newState.players).toEqual([]);
    expect(newState.status).toBe(GameStatus.SETUP);
    expect(newState.configuration.missionsPerPlayer).toBe(3);
    expect(newState.id).toBeDefined();
  });

  test('should configure game', () => {
    const initialState = createInitialGameState();
    const configuration = createGameConfiguration(5, DifficultyMode.UNIFORM, DifficultyLevel.MEDIUM);
    const action = configureGame(configuration);
    const newState = gameReducer(initialState, action);
    
    expect(newState.configuration).toEqual(configuration);
    expect(newState.status).toBe(GameStatus.CONFIGURING);
  });

  test('should add player to game', () => {
    const initialState = createInitialGameState();
    const player = createPlayer('Alice');
    const action = addPlayer(player);
    const newState = gameReducer(initialState, action);
    
    expect(newState.players).toHaveLength(1);
    expect(newState.players[0].name).toBe('Alice');
    expect(newState.players[0].targetMissionCount).toBe(3); // From initial config
  });

  test('should not add duplicate player names', () => {
    const initialState = createInitialGameState();
    const player1 = createPlayer('Alice');
    const player2 = createPlayer('alice'); // Same name, different case
    
    let state = gameReducer(initialState, addPlayer(player1));
    state = gameReducer(state, addPlayer(player2));
    
    expect(state.players).toHaveLength(1);
    expect(state.players[0].name).toBe('Alice');
  });

  test('should remove player from game', () => {
    const initialState = createInitialGameState();
    const player = createPlayer('Alice');
    
    let state = gameReducer(initialState, addPlayer(player));
    expect(state.players).toHaveLength(1);
    
    state = gameReducer(state, removePlayer(player.id));
    expect(state.players).toHaveLength(0);
  });

  test('should assign mission with difficulty to player', () => {
    const initialState = createInitialGameState();
    const player = createPlayer('Alice');
    const missions = loadMissions();
    const mission = missions[0];
    
    let state = gameReducer(initialState, addPlayer(player));
    state = gameReducer(state, assignMissionWithDifficulty(player.id, mission, DifficultyLevel.HARD));
    
    expect(state.players[0].missions).toHaveLength(1);
    expect(state.players[0].missions[0].mission.difficulty).toBe(DifficultyLevel.HARD);
    expect(state.players[0].missions[0].mission.points).toBe(3);
    expect(state.players[0].missions[0].state).toBe(MissionState.ACTIVE);
  });

  test('should complete mission with timing and update player totals', () => {
    const initialState = createInitialGameState();
    const player = createPlayer('Alice');
    const missions = loadMissions();
    const mission = missions[0];
    
    let state = gameReducer(initialState, addPlayer(player));
    state = gameReducer(state, assignMissionWithDifficulty(player.id, mission, DifficultyLevel.MEDIUM));
    
    // Complete the mission
    const completedAt = new Date();
    state = gameReducer(state, completeMissionWithTiming(player.id, mission.id, MissionState.COMPLETED, completedAt));
    
    expect(state.players[0].missions[0].state).toBe(MissionState.COMPLETED);
    expect(state.players[0].missions[0].pointsAwarded).toBe(2); // Medium difficulty
    expect(state.players[0].totalPoints).toBe(2);
    expect(state.players[0].completedMissions).toBe(1);
    expect(state.players[0].missions[0].completedAt).toEqual(completedAt);
  });

  test('should validate game status transitions', () => {
    const initialState = createInitialGameState();
    
    // Valid transition: SETUP -> CONFIGURING
    let state = gameReducer(initialState, updateGameStatus(GameStatus.CONFIGURING));
    expect(state.status).toBe(GameStatus.CONFIGURING);
    
    // Invalid transition: CONFIGURING -> FINISHED (should skip ASSIGNING and IN_PROGRESS)
    state = gameReducer(state, updateGameStatus(GameStatus.FINISHED));
    expect(state.status).toBe(GameStatus.CONFIGURING); // Should not change
  });

  describe('Mission Assignment Logic', () => {
    test('should assign correct number of missions per player', () => {
      const initialState = createInitialGameState();
      const configuration = createGameConfiguration(2, DifficultyMode.UNIFORM, DifficultyLevel.EASY);
      const player1 = createPlayer('Alice');
      const player2 = createPlayer('Bob');
      const missions = loadMissions();
      
      let state = gameReducer(initialState, configureGame(configuration));
      state = gameReducer(state, addPlayer(player1));
      state = gameReducer(state, addPlayer(player2));
      
      // Assign missions to first player
      state = gameReducer(state, assignMissionWithDifficulty(player1.id, missions[0], DifficultyLevel.EASY));
      state = gameReducer(state, assignMissionWithDifficulty(player1.id, missions[1], DifficultyLevel.EASY));
      
      // Assign missions to second player
      state = gameReducer(state, assignMissionWithDifficulty(player2.id, missions[2], DifficultyLevel.EASY));
      state = gameReducer(state, assignMissionWithDifficulty(player2.id, missions[3], DifficultyLevel.EASY));
      
      // Verify both players have correct number of missions
      expect(state.players[0].missions).toHaveLength(2);
      expect(state.players[1].missions).toHaveLength(2);
      expect(state.players[0].targetMissionCount).toBe(2);
      expect(state.players[1].targetMissionCount).toBe(2);
    });

    test('should prevent assigning more missions than target count', () => {
      const initialState = createInitialGameState();
      const configuration = createGameConfiguration(1, DifficultyMode.UNIFORM, DifficultyLevel.EASY);
      const player = createPlayer('Alice');
      const missions = loadMissions();
      
      let state = gameReducer(initialState, configureGame(configuration));
      state = gameReducer(state, addPlayer(player));
      
      // Assign first mission (should succeed)
      state = gameReducer(state, assignMissionWithDifficulty(player.id, missions[0], DifficultyLevel.EASY));
      expect(state.players[0].missions).toHaveLength(1);
      
      // Try to assign second mission (should be prevented)
      state = gameReducer(state, assignMissionWithDifficulty(player.id, missions[1], DifficultyLevel.EASY));
      expect(state.players[0].missions).toHaveLength(1); // Should still be 1
    });

    test('should handle mixed difficulty mode correctly', () => {
      const initialState = createInitialGameState();
      const configuration = createGameConfiguration(3, DifficultyMode.MIXED);
      const player = createPlayer('Alice');
      const missions = loadMissions();
      
      let state = gameReducer(initialState, configureGame(configuration));
      state = gameReducer(state, addPlayer(player));
      
      // Assign missions with different difficulties
      state = gameReducer(state, assignMissionWithDifficulty(player.id, missions[0], DifficultyLevel.EASY));
      state = gameReducer(state, assignMissionWithDifficulty(player.id, missions[1], DifficultyLevel.MEDIUM));
      state = gameReducer(state, assignMissionWithDifficulty(player.id, missions[2], DifficultyLevel.HARD));
      
      expect(state.players[0].missions).toHaveLength(3);
      expect(state.players[0].missions[0].mission.difficulty).toBe(DifficultyLevel.EASY);
      expect(state.players[0].missions[0].mission.points).toBe(1);
      expect(state.players[0].missions[1].mission.difficulty).toBe(DifficultyLevel.MEDIUM);
      expect(state.players[0].missions[1].mission.points).toBe(2);
      expect(state.players[0].missions[2].mission.difficulty).toBe(DifficultyLevel.HARD);
      expect(state.players[0].missions[2].mission.points).toBe(3);
    });

    test('should handle uniform difficulty mode correctly', () => {
      const initialState = createInitialGameState();
      const configuration = createGameConfiguration(2, DifficultyMode.UNIFORM, DifficultyLevel.MEDIUM);
      const player = createPlayer('Alice');
      const missions = loadMissions();
      
      let state = gameReducer(initialState, configureGame(configuration));
      state = gameReducer(state, addPlayer(player));
      
      // Assign missions (difficulty should be overridden to uniform)
      state = gameReducer(state, assignMissionWithDifficulty(player.id, missions[0], DifficultyLevel.EASY));
      state = gameReducer(state, assignMissionWithDifficulty(player.id, missions[1], DifficultyLevel.HARD));
      
      expect(state.players[0].missions).toHaveLength(2);
      // Both missions should have uniform difficulty
      expect(state.players[0].missions[0].mission.difficulty).toBe(DifficultyLevel.MEDIUM);
      expect(state.players[0].missions[0].mission.points).toBe(2);
      expect(state.players[0].missions[1].mission.difficulty).toBe(DifficultyLevel.MEDIUM);
      expect(state.players[0].missions[1].mission.points).toBe(2);
    });

    test('should update player targetMissionCount when configuration changes', () => {
      const initialState = createInitialGameState();
      const player1 = createPlayer('Alice');
      const player2 = createPlayer('Bob');
      
      let state = gameReducer(initialState, addPlayer(player1));
      state = gameReducer(state, addPlayer(player2));
      
      // Initial target should be 3 (default)
      expect(state.players[0].targetMissionCount).toBe(3);
      expect(state.players[1].targetMissionCount).toBe(3);
      
      // Change configuration
      const newConfiguration = createGameConfiguration(5, DifficultyMode.UNIFORM, DifficultyLevel.EASY);
      state = gameReducer(state, configureGame(newConfiguration));
      
      // Target should be updated for all existing players
      expect(state.players[0].targetMissionCount).toBe(5);
      expect(state.players[1].targetMissionCount).toBe(5);
    });

    test('should maintain mission count consistency during assignment flow', () => {
      const initialState = createInitialGameState();
      const configuration = createGameConfiguration(2, DifficultyMode.UNIFORM, DifficultyLevel.EASY);
      const player1 = createPlayer('Alice');
      const player2 = createPlayer('Bob');
      const player3 = createPlayer('Charlie');
      const missions = loadMissions();
      
      let state = gameReducer(initialState, configureGame(configuration));
      state = gameReducer(state, addPlayer(player1));
      state = gameReducer(state, addPlayer(player2));
      state = gameReducer(state, addPlayer(player3));
      
      // Simulate assignment flow like in AssignMissionsScreen
      // Player 1 - Mission 1
      state = gameReducer(state, assignMissionWithDifficulty(player1.id, missions[0], DifficultyLevel.EASY));
      expect(state.players[0].missions.length).toBe(1);
      
      // Player 1 - Mission 2
      state = gameReducer(state, assignMissionWithDifficulty(player1.id, missions[1], DifficultyLevel.EASY));
      expect(state.players[0].missions.length).toBe(2);
      
      // Player 2 - Mission 1
      state = gameReducer(state, assignMissionWithDifficulty(player2.id, missions[2], DifficultyLevel.EASY));
      expect(state.players[1].missions.length).toBe(1);
      expect(state.players[0].missions.length).toBe(2); // Should remain unchanged
      
      // Player 2 - Mission 2
      state = gameReducer(state, assignMissionWithDifficulty(player2.id, missions[3], DifficultyLevel.EASY));
      expect(state.players[1].missions.length).toBe(2);
      expect(state.players[0].missions.length).toBe(2); // Should remain unchanged
      
      // Player 3 - Mission 1
      state = gameReducer(state, assignMissionWithDifficulty(player3.id, missions[4], DifficultyLevel.EASY));
      expect(state.players[2].missions.length).toBe(1);
      expect(state.players[1].missions.length).toBe(2); // Should remain unchanged
      expect(state.players[0].missions.length).toBe(2); // Should remain unchanged
      
      // Player 3 - Mission 2
      state = gameReducer(state, assignMissionWithDifficulty(player3.id, missions[5], DifficultyLevel.EASY));
      expect(state.players[2].missions.length).toBe(2);
      expect(state.players[1].missions.length).toBe(2); // Should remain unchanged
      expect(state.players[0].missions.length).toBe(2); // Should remain unchanged
      
      // Verify all players have correct target and actual counts
      state.players.forEach((player, index) => {
        expect(player.missions.length).toBe(2);
        expect(player.targetMissionCount).toBe(2);
        expect(player.missions.every(pm => pm.state === MissionState.ACTIVE)).toBe(true);
      });
    });

  test('should handle single mission per player assignment flow correctly', () => {
    // This test reproduces the exact bug scenario described by the user
    const missions = loadMissions();
    let state = createInitialGameState();
    
    // Step 1: Configure game (1 mission per player, uniform difficulty)
    const configuration = createGameConfiguration(1, DifficultyMode.UNIFORM, DifficultyLevel.MEDIUM);
    state = gameReducer(state, configureGame(configuration));
    
    // Step 2: Add 3 players
    const player1 = createPlayer('Alice');
    const player2 = createPlayer('Bob');  
    const player3 = createPlayer('Charlie');
    
    state = gameReducer(state, addPlayer(player1));
    state = gameReducer(state, addPlayer(player2));
    state = gameReducer(state, addPlayer(player3));
    
    // Verify initial state
    expect(state.players).toHaveLength(3);
    expect(state.players[0].targetMissionCount).toBe(1);
    expect(state.players[1].targetMissionCount).toBe(1);
    expect(state.players[2].targetMissionCount).toBe(1);
    
    // Step 3: Simulate the exact assignment flow that was causing bugs
    
    // Player 1 - Should get exactly 1 mission
    state = gameReducer(state, assignMissionWithDifficulty(player1.id, missions[0], DifficultyLevel.MEDIUM));
    expect(state.players[0].missions.length).toBe(1);
    expect(state.players[0].targetMissionCount).toBe(1);
    
    // Player 2 - Should get exactly 1 mission  
    state = gameReducer(state, assignMissionWithDifficulty(player2.id, missions[1], DifficultyLevel.MEDIUM));
    expect(state.players[1].missions.length).toBe(1);
    expect(state.players[1].targetMissionCount).toBe(1);
    expect(state.players[0].missions.length).toBe(1); // Player 1 should be unchanged
    
    // Player 3 - Should get exactly 1 mission
    state = gameReducer(state, assignMissionWithDifficulty(player3.id, missions[2], DifficultyLevel.MEDIUM));
    expect(state.players[2].missions.length).toBe(1);
    expect(state.players[2].targetMissionCount).toBe(1);
    expect(state.players[1].missions.length).toBe(1); // Player 2 should be unchanged
    expect(state.players[0].missions.length).toBe(1); // Player 1 should be unchanged
    
    // Verify final state - each player should have exactly 1 mission
    state.players.forEach((player, index) => {
      expect(player.missions.length).toBe(1);
      expect(player.targetMissionCount).toBe(1);
      expect(player.missions[0].state).toBe(MissionState.ACTIVE);
      expect(player.missions[0].mission.difficulty).toBe(DifficultyLevel.MEDIUM);
    });
    
    // Try to assign additional missions (should be prevented)
    const initialMissionCounts = state.players.map(p => p.missions.length);
    
    state = gameReducer(state, assignMissionWithDifficulty(player1.id, missions[3], DifficultyLevel.MEDIUM));
    state = gameReducer(state, assignMissionWithDifficulty(player2.id, missions[4], DifficultyLevel.MEDIUM));
    state = gameReducer(state, assignMissionWithDifficulty(player3.id, missions[5], DifficultyLevel.MEDIUM));
    
    // Mission counts should remain unchanged
    state.players.forEach((player, index) => {
      expect(player.missions.length).toBe(initialMissionCounts[index]);
    });
  });
  });
});