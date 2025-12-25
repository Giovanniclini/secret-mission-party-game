import * as fc from 'fast-check';
import {
  createInitialGameState,
  createPlayer,
  GameStatus,
  MissionState,
  isValidPlayerName,
  hasMinimumPlayers,
  isValidMissionStateTransition,
  isValidGameStatusTransition,
  getWinner,
  GameState,
  Player
} from './index';
import { gameReducer } from '../store/gameReducer';
import { updateMissionState, GameActionType } from '../store/gameActions';

describe('Game Models', () => {
  describe('Property 1: Game initialization consistency', () => {
    // Feature: party-game-app, Property 1: Game initialization consistency
    it('should initialize game state with consistent default values', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const gameState = createInitialGameState();
          
          // Validates: Requirements 1.2
          expect(gameState.id).toMatch(/^game_\d+$/);
          expect(gameState.players).toEqual([]);
          expect(gameState.targetCompleted).toBe(1);
          expect(gameState.status).toBe(GameStatus.SETUP);
          expect(gameState.createdAt).toBeInstanceOf(Date);
          expect(gameState.updatedAt).toBeInstanceOf(Date);
          expect(gameState.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
          expect(gameState.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Win condition detection', () => {
    // Feature: party-game-app, Property 5: Win condition detection
    it('should automatically declare winner and transition to FINISHED when player reaches targetCompleted', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({
            name: fc.string({ minLength: 2, maxLength: 20 }),
            completedCount: fc.integer({ min: 0, max: 2 })
          }), { minLength: 3, maxLength: 8 }),
          fc.integer({ min: 1, max: 3 }),
          (playerData, targetCompleted) => {
            // Create initial game state with players
            const initialState = createInitialGameState();
            const players = playerData.map(data => ({
              ...createPlayer(data.name),
              completedCount: data.completedCount,
              missionState: MissionState.ACTIVE
            }));
            
            const gameState: GameState = {
              ...initialState,
              players,
              targetCompleted,
              status: GameStatus.IN_PROGRESS
            };

            // Check if there's already a winner before any updates
            const initialWinner = getWinner(players, targetCompleted);
            
            if (initialWinner) {
              // If there's already a winner, any mission state update should keep game FINISHED
              const action = updateMissionState(players[0].id, MissionState.COMPLETED);
              const newState = gameReducer(gameState, action);
              
              expect(newState.status).toBe(GameStatus.FINISHED);
              const winner = getWinner(newState.players, targetCompleted);
              expect(winner).not.toBeNull();
              expect(winner!.completedCount).toBeGreaterThanOrEqual(targetCompleted);
            } else {
              // No initial winner - find a player who hasn't reached the target yet
              const playerToUpdate = players.find(p => p.completedCount < targetCompleted);
              
              if (playerToUpdate) {
                // Update their mission state to COMPLETED, which should increment completedCount
                const action = updateMissionState(playerToUpdate.id, MissionState.COMPLETED);
                const newState = gameReducer(gameState, action);
                
                // Find the updated player
                const updatedPlayer = newState.players.find(p => p.id === playerToUpdate.id);
                
                if (updatedPlayer && updatedPlayer.completedCount >= targetCompleted) {
                  // If this player now meets the win condition, game should be FINISHED
                  expect(newState.status).toBe(GameStatus.FINISHED);
                  
                  // Verify there is a winner
                  const winner = getWinner(newState.players, targetCompleted);
                  expect(winner).not.toBeNull();
                  expect(winner!.completedCount).toBeGreaterThanOrEqual(targetCompleted);
                } else {
                  // If no player meets win condition, game should still be IN_PROGRESS
                  expect(newState.status).toBe(GameStatus.IN_PROGRESS);
                  
                  const winner = getWinner(newState.players, targetCompleted);
                  expect(winner).toBeNull();
                }
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Player creation', () => {
    it('should create valid players with proper defaults', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2),
          (name) => {
            const player = createPlayer(name);
            
            expect(player.id).toMatch(/^player_\d+_[a-z0-9]+$/);
            expect(player.name).toBe(name.trim());
            expect(player.currentMission).toBeUndefined();
            expect(player.missionState).toBe(MissionState.WAITING);
            expect(player.completedCount).toBe(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation functions', () => {
    it('should validate player names correctly', () => {
      fc.assert(
        fc.property(fc.string(), (name) => {
          const isValid = isValidPlayerName(name);
          const trimmedLength = name.trim().length;
          
          if (trimmedLength >= 2 && trimmedLength <= 20) {
            expect(isValid).toBe(true);
          } else {
            expect(isValid).toBe(false);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate minimum players correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 2, maxLength: 20 }), { maxLength: 10 }),
          (names) => {
            const players = names.map(name => createPlayer(name));
            const hasMinimum = hasMinimumPlayers(players);
            
            if (players.length >= 3) {
              expect(hasMinimum).toBe(true);
            } else {
              expect(hasMinimum).toBe(false);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('State transitions', () => {
    it('should validate mission state transitions correctly', () => {
      const validTransitions = [
        [MissionState.WAITING, MissionState.ACTIVE],
        [MissionState.ACTIVE, MissionState.COMPLETED],
        [MissionState.ACTIVE, MissionState.CAUGHT]
      ];

      const invalidTransitions = [
        [MissionState.WAITING, MissionState.COMPLETED],
        [MissionState.WAITING, MissionState.CAUGHT],
        [MissionState.COMPLETED, MissionState.ACTIVE],
        [MissionState.COMPLETED, MissionState.CAUGHT],
        [MissionState.CAUGHT, MissionState.ACTIVE],
        [MissionState.CAUGHT, MissionState.COMPLETED]
      ];

      validTransitions.forEach(([from, to]) => {
        expect(isValidMissionStateTransition(from, to)).toBe(true);
      });

      invalidTransitions.forEach(([from, to]) => {
        expect(isValidMissionStateTransition(from, to)).toBe(false);
      });
    });

    it('should validate game status transitions correctly', () => {
      const validTransitions = [
        [GameStatus.SETUP, GameStatus.ASSIGNING],
        [GameStatus.ASSIGNING, GameStatus.IN_PROGRESS],
        [GameStatus.IN_PROGRESS, GameStatus.FINISHED],
        [GameStatus.FINISHED, GameStatus.SETUP]
      ];

      const invalidTransitions = [
        [GameStatus.SETUP, GameStatus.IN_PROGRESS],
        [GameStatus.SETUP, GameStatus.FINISHED],
        [GameStatus.ASSIGNING, GameStatus.SETUP],
        [GameStatus.ASSIGNING, GameStatus.FINISHED],
        [GameStatus.IN_PROGRESS, GameStatus.SETUP],
        [GameStatus.IN_PROGRESS, GameStatus.ASSIGNING]
      ];

      validTransitions.forEach(([from, to]) => {
        expect(isValidGameStatusTransition(from, to)).toBe(true);
      });

      invalidTransitions.forEach(([from, to]) => {
        expect(isValidGameStatusTransition(from, to)).toBe(false);
      });
    });
  });

  describe('Winner detection', () => {
    it('should correctly identify winners', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({
            name: fc.string({ minLength: 2, maxLength: 20 }),
            completedCount: fc.integer({ min: 0, max: 5 })
          }), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 1, max: 3 }),
          (playerData, targetCompleted) => {
            const players = playerData.map(data => ({
              ...createPlayer(data.name),
              completedCount: data.completedCount
            }));
            
            const winner = getWinner(players, targetCompleted);
            const expectedWinner = players.find(p => p.completedCount >= targetCompleted);
            
            expect(winner).toEqual(expectedWinner || null);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});