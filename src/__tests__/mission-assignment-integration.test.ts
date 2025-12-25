// Integration test for mission assignment flow - UI simulation
import { gameReducer } from '../store/gameReducer';
import { 
  createGame, 
  configureGame,
  addPlayer, 
  assignMissionWithDifficulty, 
  updateGameStatus 
} from '../store/gameActions';
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

// Helper function to simulate AssignMissionsScreen logic EXACTLY as implemented
function simulateAssignmentScreenState(gameState: any, currentPlayerIndex: number, currentPhase: string) {
  const currentPlayer = gameState.players[currentPlayerIndex];
  const currentPlayerTargetMissions = currentPlayer?.targetMissionCount || gameState.configuration.missionsPerPlayer;
  const currentPlayerMissionsAssigned = currentPlayer?.missions.length || 0;
  const currentMissionNumber = currentPlayerMissionsAssigned + 1; // For difficulty selection
  
  // This is the EXACT logic from the component
  const revealMissionNumber = currentPhase === 'MISSION_REVEAL' 
    ? Math.max(1, currentPlayerMissionsAssigned) // Ensure at least 1, in case of race condition
    : currentPlayerMissionsAssigned;
  
  const isLastMissionForCurrentPlayer = currentMissionNumber > currentPlayerTargetMissions;
  
  const allPlayersComplete = gameState.players.every((player: any) => 
    player.missions.length >= player.targetMissionCount
  );
  
  return {
    currentPlayer,
    currentPlayerTargetMissions,
    currentPlayerMissionsAssigned,
    currentMissionNumber,
    revealMissionNumber,
    isLastMissionForCurrentPlayer,
    allPlayersComplete,
    // Simulate what the UI would show
    difficultySelectionText: `Missione ${currentMissionNumber} di ${currentPlayerTargetMissions}`,
    missionRevealText: `Missione ${revealMissionNumber} di ${currentPlayerTargetMissions}`,
    buttonText: allPlayersComplete 
      ? 'Completa Assegnazione'
      : isLastMissionForCurrentPlayer
        ? 'Prossimo Giocatore' 
        : 'Prossima Missione'
  };
}

describe('Mission Assignment Integration - UI Simulation', () => {
  test('should handle exact user flow: 3 players, 1 mission each - CATCH THE BUG', () => {
    // This test simulates the EXACT user experience step by step
    const missions = loadMissions();
    let state = createInitialGameState();
    
    // Setup: 3 players, 1 mission each
    const configuration = createGameConfiguration(1, DifficultyMode.UNIFORM, DifficultyLevel.MEDIUM);
    state = gameReducer(state, configureGame(configuration));
    
    const player1 = createPlayer('Alice');
    const player2 = createPlayer('Bob');
    const player3 = createPlayer('Charlie');
    
    state = gameReducer(state, addPlayer(player1));
    state = gameReducer(state, addPlayer(player2));
    state = gameReducer(state, addPlayer(player3));
    
    // === PLAYER 1 FLOW ===
    let currentPlayerIndex = 0;
    
    // Step 1: Player 1 - Difficulty Selection Screen
    let uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'DIFFICULTY_SELECTION');
    expect(uiState.difficultySelectionText).toBe('Missione 1 di 1');
    expect(uiState.currentPlayer.name).toBe('Alice');
    
    // Step 2: Player 1 - Mission Assignment (happens when difficulty selected)
    state = gameReducer(state, assignMissionWithDifficulty(player1.id, missions[0], DifficultyLevel.MEDIUM));
    
    // Step 3: Player 1 - Mission Reveal Screen (after assignment)
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'MISSION_REVEAL');
    expect(uiState.missionRevealText).toBe('Missione 1 di 1'); // Should show mission 1, not 0
    expect(uiState.buttonText).toBe('Prossimo Giocatore'); // Player 1 is complete
    expect(uiState.allPlayersComplete).toBe(false); // Others still need missions
    
    // === PLAYER 2 FLOW ===
    currentPlayerIndex = 1;
    
    // Step 4: Player 2 - Difficulty Selection Screen
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'DIFFICULTY_SELECTION');
    expect(uiState.difficultySelectionText).toBe('Missione 1 di 1');
    expect(uiState.currentPlayer.name).toBe('Bob');
    
    // Step 5: Player 2 - Mission Assignment
    state = gameReducer(state, assignMissionWithDifficulty(player2.id, missions[1], DifficultyLevel.MEDIUM));
    
    // Step 6: Player 2 - Mission Reveal Screen - THIS IS WHERE THE BUG HAPPENS
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'MISSION_REVEAL');
    
    // The user reports seeing "Missione 0 di 1" here, but it should be "Missione 1 di 1"
    expect(uiState.missionRevealText).toBe('Missione 1 di 1'); // This should pass if the bug is fixed
    expect(uiState.buttonText).toBe('Prossimo Giocatore'); // Player 2 is complete
    expect(uiState.allPlayersComplete).toBe(false); // Player 3 still needs mission
    
    // === PLAYER 3 FLOW ===
    currentPlayerIndex = 2;
    
    // Step 7: Player 3 - Difficulty Selection Screen
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'DIFFICULTY_SELECTION');
    expect(uiState.difficultySelectionText).toBe('Missione 1 di 1');
    expect(uiState.currentPlayer.name).toBe('Charlie');
    
    // Step 8: Player 3 - Mission Assignment
    state = gameReducer(state, assignMissionWithDifficulty(player3.id, missions[2], DifficultyLevel.MEDIUM));
    
    // Step 9: Player 3 - Mission Reveal Screen
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'MISSION_REVEAL');
    expect(uiState.missionRevealText).toBe('Missione 1 di 1');
    expect(uiState.buttonText).toBe('Completa Assegnazione'); // All players complete
    expect(uiState.allPlayersComplete).toBe(true);
    
    // Final verification
    expect(state.players[0].missions.length).toBe(1);
    expect(state.players[1].missions.length).toBe(1);
    expect(state.players[2].missions.length).toBe(1);
  });

  test('should handle 2 missions per player correctly', () => {
    const missions = loadMissions();
    let state = createInitialGameState();
    
    // Setup: 2 players, 2 missions each
    const configuration = createGameConfiguration(2, DifficultyMode.UNIFORM, DifficultyLevel.EASY);
    state = gameReducer(state, configureGame(configuration));
    
    const player1 = createPlayer('Alice');
    const player2 = createPlayer('Bob');
    
    state = gameReducer(state, addPlayer(player1));
    state = gameReducer(state, addPlayer(player2));
    
    // === PLAYER 1 - MISSION 1 ===
    let currentPlayerIndex = 0;
    let uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'DIFFICULTY_SELECTION');
    expect(uiState.difficultySelectionText).toBe('Missione 1 di 2');
    
    state = gameReducer(state, assignMissionWithDifficulty(player1.id, missions[0], DifficultyLevel.EASY));
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'MISSION_REVEAL');
    expect(uiState.missionRevealText).toBe('Missione 1 di 2');
    expect(uiState.buttonText).toBe('Prossima Missione'); // Player 1 needs more missions
    
    // === PLAYER 1 - MISSION 2 ===
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'DIFFICULTY_SELECTION');
    expect(uiState.difficultySelectionText).toBe('Missione 2 di 2');
    
    state = gameReducer(state, assignMissionWithDifficulty(player1.id, missions[1], DifficultyLevel.EASY));
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'MISSION_REVEAL');
    expect(uiState.missionRevealText).toBe('Missione 2 di 2');
    expect(uiState.buttonText).toBe('Prossimo Giocatore'); // Player 1 is complete
    
    // === PLAYER 2 - MISSION 1 ===
    currentPlayerIndex = 1;
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'DIFFICULTY_SELECTION');
    expect(uiState.difficultySelectionText).toBe('Missione 1 di 2');
    
    state = gameReducer(state, assignMissionWithDifficulty(player2.id, missions[2], DifficultyLevel.EASY));
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'MISSION_REVEAL');
    expect(uiState.missionRevealText).toBe('Missione 1 di 2');
    expect(uiState.buttonText).toBe('Prossima Missione'); // Player 2 needs more missions
    
    // === PLAYER 2 - MISSION 2 ===
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'DIFFICULTY_SELECTION');
    expect(uiState.difficultySelectionText).toBe('Missione 2 di 2');
    
    state = gameReducer(state, assignMissionWithDifficulty(player2.id, missions[3], DifficultyLevel.EASY));
    uiState = simulateAssignmentScreenState(state, currentPlayerIndex, 'MISSION_REVEAL');
    expect(uiState.missionRevealText).toBe('Missione 2 di 2');
    expect(uiState.buttonText).toBe('Completa Assegnazione'); // All complete
    expect(uiState.allPlayersComplete).toBe(true);
  });

  test('should prevent silent errors with validation', () => {
    const missions = loadMissions();
    let state = createInitialGameState();
    
    const configuration = createGameConfiguration(1, DifficultyMode.UNIFORM, DifficultyLevel.EASY);
    state = gameReducer(state, configureGame(configuration));
    
    const player1 = createPlayer('Alice');
    state = gameReducer(state, addPlayer(player1));
    
    // Assign one mission
    state = gameReducer(state, assignMissionWithDifficulty(player1.id, missions[0], DifficultyLevel.EASY));
    
    // Verify state is exactly as expected
    expect(state.players[0].missions.length).toBe(1);
    expect(state.players[0].targetMissionCount).toBe(1);
    
    // UI state should be consistent
    const uiState = simulateAssignmentScreenState(state, 0, 'MISSION_REVEAL');
    expect(uiState.allPlayersComplete).toBe(true);
    expect(uiState.buttonText).toBe('Completa Assegnazione');
    
    // Try to assign extra mission (should be prevented)
    const beforeExtraAssignment = state.players[0].missions.length;
    state = gameReducer(state, assignMissionWithDifficulty(player1.id, missions[1], DifficultyLevel.EASY));
    const afterExtraAssignment = state.players[0].missions.length;
    
    expect(afterExtraAssignment).toBe(beforeExtraAssignment); // Should be unchanged
  });
});