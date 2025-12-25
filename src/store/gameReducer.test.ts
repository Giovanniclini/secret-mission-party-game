// Tests for game reducer functionality
import { gameReducer } from './gameReducer';
import { 
  createGame, 
  addPlayer, 
  removePlayer, 
  assignMissions, 
  updateMissionState,
  updateGameStatus 
} from './gameActions';
import { 
  createInitialGameState, 
  createPlayer, 
  GameStatus, 
  MissionState 
} from '../models';
import { loadMissions } from '../data/missions';

describe('Game Reducer', () => {
  test('should create initial game state', () => {
    const initialState = createInitialGameState();
    const action = createGame();
    const newState = gameReducer(initialState, action);
    
    expect(newState.players).toEqual([]);
    expect(newState.status).toBe(GameStatus.SETUP);
    expect(newState.targetCompleted).toBe(1);
    expect(newState.id).toBeDefined();
  });

  test('should add player to game', () => {
    const initialState = createInitialGameState();
    const player = createPlayer('Alice');
    const action = addPlayer(player);
    const newState = gameReducer(initialState, action);
    
    expect(newState.players).toHaveLength(1);
    expect(newState.players[0]).toEqual(player);
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

  test('should assign missions to players', () => {
    const initialState = createInitialGameState();
    const player1 = createPlayer('Alice');
    const player2 = createPlayer('Bob');
    const missions = loadMissions();
    
    let state = gameReducer(initialState, addPlayer(player1));
    state = gameReducer(state, addPlayer(player2));
    state = gameReducer(state, assignMissions(missions));
    
    expect(state.status).toBe(GameStatus.IN_PROGRESS);
    expect(state.players[0].currentMission).toBeDefined();
    expect(state.players[1].currentMission).toBeDefined();
    expect(state.players[0].missionState).toBe(MissionState.ACTIVE);
    expect(state.players[1].missionState).toBe(MissionState.ACTIVE);
  });

  test('should update mission state and detect winner', () => {
    const initialState = createInitialGameState();
    const player = createPlayer('Alice');
    const missions = loadMissions();
    
    let state = gameReducer(initialState, addPlayer(player));
    state = gameReducer(state, assignMissions(missions));
    
    // Complete the mission
    state = gameReducer(state, updateMissionState(player.id, MissionState.COMPLETED));
    
    expect(state.players[0].missionState).toBe(MissionState.COMPLETED);
    expect(state.players[0].completedCount).toBe(1);
    expect(state.status).toBe(GameStatus.FINISHED); // Winner detected
  });

  test('should validate game status transitions', () => {
    const initialState = createInitialGameState();
    
    // Valid transition: SETUP -> ASSIGNING
    let state = gameReducer(initialState, updateGameStatus(GameStatus.ASSIGNING));
    expect(state.status).toBe(GameStatus.ASSIGNING);
    
    // Invalid transition: ASSIGNING -> FINISHED (should skip IN_PROGRESS)
    state = gameReducer(state, updateGameStatus(GameStatus.FINISHED));
    expect(state.status).toBe(GameStatus.ASSIGNING); // Should not change
  });
});