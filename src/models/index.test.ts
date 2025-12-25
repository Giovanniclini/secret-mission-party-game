import * as fc from 'fast-check';
import {
  createInitialGameState,
  createPlayer,
  createGameConfiguration,
  createPlayerMission,
  createMission,
  GameStatus,
  MissionState,
  DifficultyLevel,
  DifficultyMode,
  isValidPlayerName,
  hasMinimumPlayers,
  isValidMissionStateTransition,
  isValidGameStatusTransition,
  isValidGameConfiguration,
  determineWinner,
  calculateMissionScore,
  calculateCompletionTime,
  calculateAverageCompletionTime,
  getDifficultyPoints,
  hasPlayerReachedMissionLimit,
  canGameEnd,
  GameState,
  Player,
  GameConfiguration
} from './index';

describe('Game Models', () => {
  describe('Property 2: Mission scoring system', () => {
    // Feature: party-game-app, Property 2: Mission scoring system
    it('should award points based on difficulty (Easy: 1, Medium: 2, Hard: 3) and record completion time accurately', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(DifficultyLevel.EASY),
            fc.constant(DifficultyLevel.MEDIUM),
            fc.constant(DifficultyLevel.HARD)
          ),
          fc.oneof(
            fc.constant(MissionState.COMPLETED),
            fc.constant(MissionState.CAUGHT),
            fc.constant(MissionState.ACTIVE),
            fc.constant(MissionState.WAITING)
          ),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).filter(d => !isNaN(d.getTime())),
          fc.integer({ min: 1000, max: 300000 }), // 1 second to 5 minutes
          (difficulty, state, assignedAt, durationMs) => {
            // Ensure we have a valid date
            if (isNaN(assignedAt.getTime())) {
              return true; // Skip invalid dates
            }
            
            const completedAt = new Date(assignedAt.getTime() + durationMs);
            
            // Test mission score calculation
            const score = calculateMissionScore(difficulty, state);
            
            if (state === MissionState.COMPLETED) {
              const expectedPoints = getDifficultyPoints(difficulty);
              expect(score).toBe(expectedPoints);
            } else {
              expect(score).toBe(0);
            }
            
            // Test completion time calculation
            const calculatedTime = calculateCompletionTime(assignedAt, completedAt);
            expect(calculatedTime).toBe(durationMs);
            
            // Test that difficulty points are consistent
            const difficultyPoints = getDifficultyPoints(difficulty);
            switch (difficulty) {
              case DifficultyLevel.EASY:
                expect(difficultyPoints).toBe(1);
                break;
              case DifficultyLevel.MEDIUM:
                expect(difficultyPoints).toBe(2);
                break;
              case DifficultyLevel.HARD:
                expect(difficultyPoints).toBe(3);
                break;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 1: Game configuration validation', () => {
    it('should accept valid mission counts (1-10) and difficulty modes (UNIFORM/MIXED), and reject invalid configurations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -5, max: 15 }), // Include invalid values
          fc.oneof(
            fc.constant(DifficultyMode.UNIFORM),
            fc.constant(DifficultyMode.MIXED),
            fc.constant('INVALID' as any) // Invalid difficulty mode
          ),
          fc.option(fc.oneof(
            fc.constant(DifficultyLevel.EASY),
            fc.constant(DifficultyLevel.MEDIUM),
            fc.constant(DifficultyLevel.HARD),
            fc.constant('INVALID' as any) // Invalid difficulty level
          )),
          (missionsPerPlayer, difficultyMode, uniformDifficulty) => {
            const config: GameConfiguration = {
              missionsPerPlayer,
              difficultyMode,
              uniformDifficulty
            };
            
            const isValid = isValidGameConfiguration(config);
            
            // Valid configuration requirements:
            // 1. missionsPerPlayer must be 1-10
            // 2. difficultyMode must be UNIFORM or MIXED
            // 3. If UNIFORM mode, uniformDifficulty must be a valid DifficultyLevel
            
            const validMissionCount = missionsPerPlayer >= 1 && missionsPerPlayer <= 10;
            const validDifficultyMode = Object.values(DifficultyMode).includes(difficultyMode);
            const validUniformDifficulty = difficultyMode !== DifficultyMode.UNIFORM || 
              (uniformDifficulty !== null && uniformDifficulty !== undefined && Object.values(DifficultyLevel).includes(uniformDifficulty));
            
            const shouldBeValid = validMissionCount && validDifficultyMode && validUniformDifficulty;
            
            expect(isValid).toBe(shouldBeValid);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Game initialization', () => {
    it('should initialize game state with consistent default values', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const gameState = createInitialGameState();
          
          expect(gameState.id).toMatch(/^game_\d+$/);
          expect(gameState.players).toEqual([]);
          expect(gameState.configuration.missionsPerPlayer).toBe(3);
          expect(gameState.configuration.difficultyMode).toBe(DifficultyMode.MIXED);
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

  describe('Player creation', () => {
    it('should create valid players with proper defaults', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2),
          fc.integer({ min: 1, max: 10 }),
          (name, targetMissionCount) => {
            const player = createPlayer(name, targetMissionCount);
            
            expect(player.id).toMatch(/^player_\d+_[a-z0-9]+$/);
            expect(player.name).toBe(name.trim());
            expect(player.missions).toEqual([]);
            expect(player.totalPoints).toBe(0);
            expect(player.completedMissions).toBe(0);
            expect(player.targetMissionCount).toBe(targetMissionCount);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Mission and scoring utilities', () => {
    it('should calculate correct points for difficulty levels', () => {
      expect(getDifficultyPoints(DifficultyLevel.EASY)).toBe(1);
      expect(getDifficultyPoints(DifficultyLevel.MEDIUM)).toBe(2);
      expect(getDifficultyPoints(DifficultyLevel.HARD)).toBe(3);
    });

    it('should calculate mission scores correctly', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(DifficultyLevel.EASY),
            fc.constant(DifficultyLevel.MEDIUM),
            fc.constant(DifficultyLevel.HARD)
          ),
          fc.oneof(
            fc.constant(MissionState.COMPLETED),
            fc.constant(MissionState.CAUGHT),
            fc.constant(MissionState.ACTIVE),
            fc.constant(MissionState.WAITING)
          ),
          (difficulty, state) => {
            const score = calculateMissionScore(difficulty, state);
            
            if (state === MissionState.COMPLETED) {
              expect(score).toBe(getDifficultyPoints(difficulty));
            } else {
              expect(score).toBe(0);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate completion time correctly', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }),
          fc.integer({ min: 1000, max: 300000 }), // 1 second to 5 minutes
          (assignedAt, durationMs) => {
            // Skip invalid dates
            if (isNaN(assignedAt.getTime())) {
              return true;
            }
            
            const completedAt = new Date(assignedAt.getTime() + durationMs);
            const calculatedTime = calculateCompletionTime(assignedAt, completedAt);
            
            expect(calculatedTime).toBe(durationMs);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Winner determination logic', () => {
    // Feature: party-game-app, Property 4: Winner determination logic
    it('should determine the winner based on highest total points, using average completion time as tiebreaker for tied scores', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({
            name: fc.string({ minLength: 2, maxLength: 20 }),
            totalPoints: fc.integer({ min: 0, max: 10 }),
            avgCompletionTime: fc.integer({ min: 1000, max: 60000 })
          }), { minLength: 1, maxLength: 8 }),
          (playerData) => {
            const players = playerData.map(data => {
              const player = createPlayer(data.name, 3);
              player.totalPoints = data.totalPoints;
              
              // Create mock completed missions to simulate average completion time
              if (data.totalPoints > 0) {
                const mission = createMission('test', 'Test mission', DifficultyLevel.EASY);
                const playerMission = createPlayerMission(mission);
                playerMission.state = MissionState.COMPLETED;
                playerMission.completionTimeMs = data.avgCompletionTime;
                player.missions = [playerMission];
              }
              
              return player;
            });
            
            const winner = determineWinner(players);
            
            if (players.length === 0) {
              expect(winner).toBeNull();
            } else {
              expect(winner).not.toBeNull();
              
              // Winner should have highest points, or if tied, fastest average time
              const maxPoints = Math.max(...players.map(p => p.totalPoints));
              const topPlayers = players.filter(p => p.totalPoints === maxPoints);
              
              if (topPlayers.length === 1) {
                expect(winner).toBe(topPlayers[0]);
              } else {
                // Among tied players, winner should have fastest average completion time
                const winnerAvgTime = calculateAverageCompletionTime(winner!);
                topPlayers.forEach(player => {
                  const playerAvgTime = calculateAverageCompletionTime(player);
                  expect(winnerAvgTime).toBeLessThanOrEqual(playerAvgTime);
                });
              }
            }
            
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
            const players = names.map(name => createPlayer(name, 3));
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
        [GameStatus.SETUP, GameStatus.CONFIGURING],
        [GameStatus.CONFIGURING, GameStatus.ASSIGNING],
        [GameStatus.CONFIGURING, GameStatus.SETUP], // Allow back to setup
        [GameStatus.ASSIGNING, GameStatus.IN_PROGRESS],
        [GameStatus.ASSIGNING, GameStatus.CONFIGURING], // Allow back to configuring
        [GameStatus.IN_PROGRESS, GameStatus.FINISHED],
        [GameStatus.IN_PROGRESS, GameStatus.ASSIGNING], // Allow back to assigning
        [GameStatus.FINISHED, GameStatus.SETUP],
        // Same status transitions (no-op)
        [GameStatus.SETUP, GameStatus.SETUP],
        [GameStatus.CONFIGURING, GameStatus.CONFIGURING],
        [GameStatus.ASSIGNING, GameStatus.ASSIGNING],
        [GameStatus.IN_PROGRESS, GameStatus.IN_PROGRESS],
        [GameStatus.FINISHED, GameStatus.FINISHED]
      ];

      const invalidTransitions = [
        [GameStatus.SETUP, GameStatus.ASSIGNING],
        [GameStatus.SETUP, GameStatus.IN_PROGRESS],
        [GameStatus.SETUP, GameStatus.FINISHED],
        [GameStatus.CONFIGURING, GameStatus.FINISHED],
        [GameStatus.ASSIGNING, GameStatus.SETUP],
        [GameStatus.ASSIGNING, GameStatus.FINISHED],
        [GameStatus.IN_PROGRESS, GameStatus.SETUP],
        [GameStatus.IN_PROGRESS, GameStatus.CONFIGURING],
        [GameStatus.FINISHED, GameStatus.CONFIGURING],
        [GameStatus.FINISHED, GameStatus.ASSIGNING],
        [GameStatus.FINISHED, GameStatus.IN_PROGRESS]
      ];

      validTransitions.forEach(([from, to]) => {
        expect(isValidGameStatusTransition(from, to)).toBe(true);
      });

      invalidTransitions.forEach(([from, to]) => {
        expect(isValidGameStatusTransition(from, to)).toBe(false);
      });
    });
  });

  describe('Property 5: Mission display with difficulty', () => {
    // Feature: party-game-app, Property 5: Mission display with difficulty
    it('should display both the mission text and its difficulty level with corresponding point value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }), // Mission text
          fc.oneof(
            fc.constant(DifficultyLevel.EASY),
            fc.constant(DifficultyLevel.MEDIUM),
            fc.constant(DifficultyLevel.HARD)
          ),
          (missionText, difficulty) => {
            const mission = createMission('test_mission', missionText, difficulty);
            
            // Test that mission has correct difficulty and points
            expect(mission.text).toBe(missionText);
            expect(mission.difficulty).toBe(difficulty);
            expect(mission.points).toBe(getDifficultyPoints(difficulty));
            
            // Test that difficulty points are consistent
            switch (difficulty) {
              case DifficultyLevel.EASY:
                expect(mission.points).toBe(1);
                break;
              case DifficultyLevel.MEDIUM:
                expect(mission.points).toBe(2);
                break;
              case DifficultyLevel.HARD:
                expect(mission.points).toBe(3);
                break;
            }
            
            // Test that mission data is complete for display
            expect(mission.id).toBeDefined();
            expect(mission.text).toBeDefined();
            expect(mission.difficulty).toBeDefined();
            expect(mission.points).toBeDefined();
            expect(mission.points).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Game progression utilities', () => {
    it('should detect when player has reached mission limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 0, max: 12 }),
          (targetMissionCount, actualMissionCount) => {
            const player = createPlayer('Test Player', targetMissionCount);
            
            // Add missions up to actualMissionCount
            for (let i = 0; i < actualMissionCount; i++) {
              const mission = createMission(`mission_${i}`, `Mission ${i}`, DifficultyLevel.EASY);
              const playerMission = createPlayerMission(mission);
              player.missions.push(playerMission);
            }
            
            const hasReachedLimit = hasPlayerReachedMissionLimit(player);
            
            if (actualMissionCount >= targetMissionCount) {
              expect(hasReachedLimit).toBe(true);
            } else {
              expect(hasReachedLimit).toBe(false);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect when game can end', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({
            name: fc.string({ minLength: 2, maxLength: 20 }),
            targetMissionCount: fc.integer({ min: 1, max: 5 }),
            completedMissions: fc.integer({ min: 0, max: 6 })
          }), { minLength: 1, maxLength: 8 }),
          (playerData) => {
            const players = playerData.map(data => {
              const player = createPlayer(data.name, data.targetMissionCount);
              player.completedMissions = data.completedMissions;
              return player;
            });
            
            const canEnd = canGameEnd(players);
            const hasPlayerCompletedAll = players.some(p => p.completedMissions >= p.targetMissionCount);
            
            expect(canEnd).toBe(hasPlayerCompletedAll);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Mission assignment progression', () => {
    // Feature: party-game-app, Property 3: Mission assignment progression
    it('should assign a new mission to any player who completes a mission if they haven\'t reached their mission count limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // targetMissionCount
          fc.integer({ min: 0, max: 4 }), // currentMissionCount (less than target)
          fc.string({ minLength: 2, maxLength: 20 }), // playerName
          (targetMissionCount, currentMissionCount, playerName) => {
            // Ensure currentMissionCount doesn't exceed targetMissionCount
            const actualCurrentCount = Math.min(currentMissionCount, targetMissionCount);
            
            const player = createPlayer(playerName, targetMissionCount);
            
            // Add current missions to player
            for (let i = 0; i < actualCurrentCount; i++) {
              const mission = createMission(`mission_${i}`, `Mission ${i}`, DifficultyLevel.EASY);
              const playerMission = createPlayerMission(mission);
              playerMission.state = MissionState.COMPLETED;
              playerMission.pointsAwarded = 1;
              player.missions.push(playerMission);
              player.completedMissions += 1;
              player.totalPoints += 1;
            }
            
            const initialMissionCount = player.missions.length;
            const hasReachedLimit = hasPlayerReachedMissionLimit(player);
            
            // Test the progression logic
            if (player.completedMissions < player.targetMissionCount) {
              // Player should be eligible for new mission assignment
              expect(hasReachedLimit).toBe(false);
              
              // Simulate completing a mission and getting a new one
              if (initialMissionCount < targetMissionCount) {
                const newMission = createMission('new_mission', 'New Mission', DifficultyLevel.MEDIUM);
                const newPlayerMission = createPlayerMission(newMission);
                newPlayerMission.state = MissionState.ACTIVE;
                player.missions.push(newPlayerMission);
                
                // Verify new mission was assigned
                expect(player.missions.length).toBe(initialMissionCount + 1);
                expect(player.missions[player.missions.length - 1].state).toBe(MissionState.ACTIVE);
              }
            } else {
              // Player has reached limit, should not get new missions
              expect(hasReachedLimit).toBe(true);
              expect(player.completedMissions).toBe(player.targetMissionCount);
            }
            
            // Verify mission count never exceeds target
            expect(player.missions.length).toBeLessThanOrEqual(player.targetMissionCount);
            expect(player.completedMissions).toBeLessThanOrEqual(player.targetMissionCount);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Tiebreaker calculation', () => {
    // Feature: party-game-app, Property 6: Tiebreaker calculation
    it('should rank the player with faster average completion time higher when two players have equal points', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // equalPoints
          fc.integer({ min: 5000, max: 30000 }), // player1AvgTime
          fc.integer({ min: 5000, max: 30000 }), // player2AvgTime
          fc.string({ minLength: 2, maxLength: 20 }), // player1Name
          fc.string({ minLength: 2, maxLength: 20 }), // player2Name
          (equalPoints, player1AvgTime, player2AvgTime, player1Name, player2Name) => {
            // Ensure different player names
            if (player1Name.toLowerCase() === player2Name.toLowerCase()) {
              return true; // Skip this test case
            }
            
            const player1 = createPlayer(player1Name, 3);
            const player2 = createPlayer(player2Name, 3);
            
            // Give both players the same total points
            player1.totalPoints = equalPoints;
            player2.totalPoints = equalPoints;
            
            // Create completed missions with specific completion times to achieve desired averages
            const mission1 = createMission('mission1', 'Mission 1', DifficultyLevel.EASY);
            const mission2 = createMission('mission2', 'Mission 2', DifficultyLevel.EASY);
            
            // Player 1 mission
            const player1Mission = createPlayerMission(mission1, new Date(Date.now() - 60000));
            player1Mission.state = MissionState.COMPLETED;
            player1Mission.completedAt = new Date();
            player1Mission.completionTimeMs = player1AvgTime;
            player1Mission.pointsAwarded = 1;
            player1.missions = [player1Mission];
            player1.completedMissions = 1;
            
            // Player 2 mission
            const player2Mission = createPlayerMission(mission2, new Date(Date.now() - 60000));
            player2Mission.state = MissionState.COMPLETED;
            player2Mission.completedAt = new Date();
            player2Mission.completionTimeMs = player2AvgTime;
            player2Mission.pointsAwarded = 1;
            player2.missions = [player2Mission];
            player2.completedMissions = 1;
            
            const players = [player1, player2];
            
            // Calculate average completion times
            const player1Avg = calculateAverageCompletionTime(player1);
            const player2Avg = calculateAverageCompletionTime(player2);
            
            expect(player1Avg).toBe(player1AvgTime);
            expect(player2Avg).toBe(player2AvgTime);
            
            // Determine winner using tiebreaker logic
            const winner = determineWinner(players);
            
            // Winner should be the player with faster (lower) average completion time
            if (player1AvgTime < player2AvgTime) {
              expect(winner).toBe(player1);
            } else if (player2AvgTime < player1AvgTime) {
              expect(winner).toBe(player2);
            } else {
              // If times are equal, either player can win (deterministic based on array order)
              expect(winner).toBeDefined();
              expect([player1, player2]).toContain(winner);
            }
            
            // Verify both players have equal points (tiebreaker scenario)
            expect(player1.totalPoints).toBe(player2.totalPoints);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Comprehensive progress tracking', () => {
    // Feature: party-game-app, Property 7: Comprehensive progress tracking
    it('should display each player\'s completed missions count, current points, remaining missions, and completion times, updating in real-time when missions are completed', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 1, max: 5 }).chain(targetMissionCount =>
              fc.record({
                name: fc.string({ minLength: 2, maxLength: 20 }),
                targetMissionCount: fc.constant(targetMissionCount),
                completedMissionCount: fc.integer({ min: 0, max: targetMissionCount }),
                activeMissionCount: fc.integer({ min: 0, max: 2 }),
                waitingMissionCount: fc.integer({ min: 0, max: 3 })
              })
            ),
            { minLength: 1, maxLength: 6 }
          ),
          (playerData) => {
            const players = playerData.map(data => {
              const player = createPlayer(data.name, data.targetMissionCount);
              
              // Add completed missions with points and completion times
              for (let i = 0; i < data.completedMissionCount; i++) {
                const difficulty = i % 3 === 0 ? DifficultyLevel.EASY : 
                                 i % 3 === 1 ? DifficultyLevel.MEDIUM : DifficultyLevel.HARD;
                const mission = createMission(`completed_${i}`, `Completed Mission ${i}`, difficulty);
                const playerMission = createPlayerMission(mission, new Date(Date.now() - 60000));
                playerMission.state = MissionState.COMPLETED;
                playerMission.completedAt = new Date();
                playerMission.completionTimeMs = 30000 + (i * 5000); // Varying completion times
                playerMission.pointsAwarded = getDifficultyPoints(difficulty);
                player.missions.push(playerMission);
                player.totalPoints += playerMission.pointsAwarded;
                player.completedMissions += 1;
              }
              
              // Add active missions
              for (let i = 0; i < data.activeMissionCount; i++) {
                const mission = createMission(`active_${i}`, `Active Mission ${i}`, DifficultyLevel.MEDIUM);
                const playerMission = createPlayerMission(mission);
                playerMission.state = MissionState.ACTIVE;
                player.missions.push(playerMission);
              }
              
              // Add waiting missions
              for (let i = 0; i < data.waitingMissionCount; i++) {
                const mission = createMission(`waiting_${i}`, `Waiting Mission ${i}`, DifficultyLevel.EASY);
                const playerMission = createPlayerMission(mission);
                playerMission.state = MissionState.WAITING;
                player.missions.push(playerMission);
              }
              
              return player;
            });
            
            // Test comprehensive progress tracking for each player
            players.forEach(player => {
              // Test completed missions count
              const actualCompletedCount = player.missions.filter(pm => pm.state === MissionState.COMPLETED).length;
              expect(player.completedMissions).toBe(actualCompletedCount);
              
              // Test current points calculation
              const expectedPoints = player.missions
                .filter(pm => pm.state === MissionState.COMPLETED)
                .reduce((sum, pm) => sum + pm.pointsAwarded, 0);
              expect(player.totalPoints).toBe(expectedPoints);
              
              // Test remaining missions calculation (now guaranteed to be >= 0)
              const remainingMissions = player.targetMissionCount - player.completedMissions;
              expect(remainingMissions).toBeGreaterThanOrEqual(0);
              expect(remainingMissions).toBeLessThanOrEqual(player.targetMissionCount);
              
              // Test completion times are recorded for completed missions
              const completedMissions = player.missions.filter(pm => pm.state === MissionState.COMPLETED);
              completedMissions.forEach(pm => {
                expect(pm.completedAt).toBeDefined();
                expect(pm.completionTimeMs).toBeDefined();
                expect(pm.completionTimeMs).toBeGreaterThan(0);
                expect(pm.pointsAwarded).toBeGreaterThan(0);
              });
              
              // Test that non-completed missions don't have completion data
              const nonCompletedMissions = player.missions.filter(pm => pm.state !== MissionState.COMPLETED);
              nonCompletedMissions.forEach(pm => {
                expect(pm.pointsAwarded).toBe(0);
              });
              
              // Test progress tracking data consistency
              expect(player.missions.length).toBeGreaterThanOrEqual(player.completedMissions);
              expect(player.totalPoints).toBeGreaterThanOrEqual(0);
              expect(player.targetMissionCount).toBeGreaterThan(0);
              expect(player.completedMissions).toBeLessThanOrEqual(player.targetMissionCount);
            });
            
            // Test real-time update capability by simulating mission completion
            if (players.length > 0) {
              const testPlayer = players[0];
              const initialCompletedCount = testPlayer.completedMissions;
              const initialPoints = testPlayer.totalPoints;
              
              // Find an active or waiting mission to complete, but only if player hasn't reached limit
              const missionToComplete = testPlayer.missions.find(pm => 
                pm.state === MissionState.ACTIVE || pm.state === MissionState.WAITING
              );
              
              if (missionToComplete && testPlayer.completedMissions < testPlayer.targetMissionCount) {
                // Simulate mission completion
                missionToComplete.state = MissionState.COMPLETED;
                missionToComplete.completedAt = new Date();
                missionToComplete.completionTimeMs = 25000;
                missionToComplete.pointsAwarded = getDifficultyPoints(missionToComplete.mission.difficulty);
                
                // Update player totals (simulating real-time update)
                testPlayer.completedMissions += 1;
                testPlayer.totalPoints += missionToComplete.pointsAwarded;
                
                // Verify the update
                expect(testPlayer.completedMissions).toBe(initialCompletedCount + 1);
                expect(testPlayer.totalPoints).toBe(initialPoints + missionToComplete.pointsAwarded);
                expect(missionToComplete.completedAt).toBeDefined();
                expect(missionToComplete.completionTimeMs).toBeDefined();
                
                // Ensure we don't exceed target mission count
                expect(testPlayer.completedMissions).toBeLessThanOrEqual(testPlayer.targetMissionCount);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});