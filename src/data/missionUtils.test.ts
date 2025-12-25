// Tests for enhanced mission utilities
import {
  calculateMissionPoints,
  calculatePlayerTotalPoints,
  updatePlayerStats,
  completeMissionTiming,
  markMissionAsCaught,
  comparePlayersForRanking,
  getPlayerRankings,
  calculateGameProgress,
  isValidMissionCompletion,
  validatePlayerMissionData,
  repairPlayerMissionData
} from './missionUtils';
import {
  createPlayer,
  createMission,
  createPlayerMission,
  DifficultyLevel,
  MissionState
} from '../models';

// Mock the error utilities to avoid React Native dependencies
jest.mock('../utils/errorUtils', () => ({
  createAppError: jest.fn((type, message) => ({ type, message })),
  logError: jest.fn()
}));

describe('Enhanced Mission Utils', () => {
  describe('calculateMissionPoints', () => {
    it('should calculate correct points for completed mission', () => {
      const points = calculateMissionPoints(DifficultyLevel.MEDIUM, MissionState.COMPLETED);
      expect(points).toBe(2);
    });

    it('should return 0 points for caught mission', () => {
      const points = calculateMissionPoints(DifficultyLevel.HARD, MissionState.CAUGHT);
      expect(points).toBe(0);
    });

    it('should handle errors gracefully', () => {
      // Test with invalid difficulty (should not happen in practice)
      const points = calculateMissionPoints('INVALID' as any, MissionState.COMPLETED);
      expect(points).toBe(0); // Should fallback to 0 on error
    });
  });

  describe('calculatePlayerTotalPoints', () => {
    it('should calculate total points correctly', () => {
      const player = createPlayer('Test Player');
      
      const mission1 = createMission('1', 'Easy mission', DifficultyLevel.EASY);
      const playerMission1 = createPlayerMission(mission1);
      playerMission1.state = MissionState.COMPLETED;
      
      const mission2 = createMission('2', 'Hard mission', DifficultyLevel.HARD);
      const playerMission2 = createPlayerMission(mission2);
      playerMission2.state = MissionState.COMPLETED;

      player.missions = [playerMission1, playerMission2];

      const totalPoints = calculatePlayerTotalPoints(player);
      expect(totalPoints).toBe(4); // 1 + 3 = 4
    });

    it('should handle errors gracefully', () => {
      const player = createPlayer('Test Player');
      player.missions = null as any; // Invalid missions array

      const totalPoints = calculatePlayerTotalPoints(player);
      expect(totalPoints).toBe(0); // Should fallback to 0 on error
    });
  });

  describe('updatePlayerStats', () => {
    it('should update player stats correctly', () => {
      const player = createPlayer('Test Player');
      
      const mission = createMission('1', 'Test mission', DifficultyLevel.MEDIUM);
      const playerMission = createPlayerMission(mission);
      playerMission.state = MissionState.COMPLETED;

      player.missions = [playerMission];
      player.totalPoints = 0; // Incorrect initial value
      player.completedMissions = 0; // Incorrect initial value

      const updatedPlayer = updatePlayerStats(player);
      expect(updatedPlayer.totalPoints).toBe(2);
      expect(updatedPlayer.completedMissions).toBe(1);
    });
  });

  describe('completeMissionTiming', () => {
    it('should complete mission timing correctly', () => {
      const mission = createMission('1', 'Test mission', DifficultyLevel.EASY);
      const playerMission = createPlayerMission(mission);
      playerMission.assignedAt = new Date('2023-01-01T10:00:00Z');

      const completedAt = new Date('2023-01-01T10:05:00Z');
      const completed = completeMissionTiming(playerMission, completedAt);

      expect(completed.state).toBe(MissionState.COMPLETED);
      expect(completed.completedAt).toBe(completedAt);
      expect(completed.completionTimeMs).toBe(5 * 60 * 1000); // 5 minutes
      expect(completed.pointsAwarded).toBe(1);
    });

    it('should handle timing validation errors', () => {
      const mission = createMission('1', 'Test mission', DifficultyLevel.EASY);
      const playerMission = createPlayerMission(mission);
      playerMission.assignedAt = new Date('2023-01-01T10:05:00Z'); // After completion time

      const completedAt = new Date('2023-01-01T10:00:00Z'); // Before assignment
      const completed = completeMissionTiming(playerMission, completedAt);

      expect(completed.state).toBe(MissionState.COMPLETED);
      expect(completed.completionTimeMs).toBe(0); // Sanitized to 0
    });
  });

  describe('markMissionAsCaught', () => {
    it('should mark mission as caught correctly', () => {
      const mission = createMission('1', 'Test mission', DifficultyLevel.HARD);
      const playerMission = createPlayerMission(mission);

      const caught = markMissionAsCaught(playerMission);

      expect(caught.state).toBe(MissionState.CAUGHT);
      expect(caught.pointsAwarded).toBe(0);
      expect(caught.completedAt).toBeDefined();
    });
  });

  describe('comparePlayersForRanking', () => {
    it('should rank by points first', () => {
      const player1 = createPlayer('Player 1');
      player1.totalPoints = 5;

      const player2 = createPlayer('Player 2');
      player2.totalPoints = 3;

      const comparison = comparePlayersForRanking(player1, player2);
      expect(comparison).toBeLessThan(0); // player1 should rank higher
    });

    it('should use completion time as tiebreaker', () => {
      const player1 = createPlayer('Player 1');
      player1.totalPoints = 5;
      
      const mission1 = createMission('1', 'Mission 1', DifficultyLevel.EASY);
      const pm1 = createPlayerMission(mission1);
      pm1.state = MissionState.COMPLETED;
      pm1.completionTimeMs = 10000; // 10 seconds
      player1.missions = [pm1];

      const player2 = createPlayer('Player 2');
      player2.totalPoints = 5; // Same points
      
      const mission2 = createMission('2', 'Mission 2', DifficultyLevel.EASY);
      const pm2 = createPlayerMission(mission2);
      pm2.state = MissionState.COMPLETED;
      pm2.completionTimeMs = 5000; // 5 seconds (faster)
      player2.missions = [pm2];

      const comparison = comparePlayersForRanking(player1, player2);
      expect(comparison).toBeGreaterThan(0); // player2 should rank higher (faster)
    });
  });

  describe('getPlayerRankings', () => {
    it('should return players sorted by ranking', () => {
      const player1 = createPlayer('Player 1');
      player1.totalPoints = 3;

      const player2 = createPlayer('Player 2');
      player2.totalPoints = 5;

      const player3 = createPlayer('Player 3');
      player3.totalPoints = 1;

      const rankings = getPlayerRankings([player1, player2, player3]);
      
      expect(rankings[0].name).toBe('Player 2'); // Highest points
      expect(rankings[1].name).toBe('Player 1');
      expect(rankings[2].name).toBe('Player 3'); // Lowest points
    });
  });

  describe('calculateGameProgress', () => {
    it('should calculate progress correctly', () => {
      const player1 = createPlayer('Player 1');
      player1.targetMissionCount = 3;
      player1.completedMissions = 2;

      const player2 = createPlayer('Player 2');
      player2.targetMissionCount = 3;
      player2.completedMissions = 1;

      const progress = calculateGameProgress([player1, player2]);
      expect(progress).toBe(50); // 3 out of 6 total missions = 50%
    });

    it('should handle empty players array', () => {
      const progress = calculateGameProgress([]);
      expect(progress).toBe(0);
    });
  });

  describe('isValidMissionCompletion', () => {
    it('should validate correct mission completion', () => {
      const mission = createMission('1', 'Test mission', DifficultyLevel.EASY);
      const playerMission = createPlayerMission(mission);
      playerMission.state = MissionState.COMPLETED;
      playerMission.completedAt = new Date();
      playerMission.completionTimeMs = 5000;
      playerMission.pointsAwarded = 1;

      const isValid = isValidMissionCompletion(playerMission);
      expect(isValid).toBe(true);
    });

    it('should reject incomplete mission data', () => {
      const mission = createMission('1', 'Test mission', DifficultyLevel.EASY);
      const playerMission = createPlayerMission(mission);
      playerMission.state = MissionState.COMPLETED;
      // Missing completedAt and other completion data

      const isValid = isValidMissionCompletion(playerMission);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePlayerMissionData', () => {
    it('should validate correct player data', () => {
      const player = createPlayer('Test Player');
      
      const mission = createMission('1', 'Test mission', DifficultyLevel.EASY);
      const playerMission = createPlayerMission(mission);
      playerMission.state = MissionState.COMPLETED;
      playerMission.pointsAwarded = 1;
      playerMission.completedAt = new Date();
      playerMission.completionTimeMs = 5000;

      player.missions = [playerMission];
      player.totalPoints = 1;
      player.completedMissions = 1;

      const isValid = validatePlayerMissionData(player);
      expect(isValid).toBe(true);
    });

    it('should detect incorrect totals', () => {
      const player = createPlayer('Test Player');
      
      const mission = createMission('1', 'Test mission', DifficultyLevel.EASY);
      const playerMission = createPlayerMission(mission);
      playerMission.state = MissionState.COMPLETED;
      playerMission.pointsAwarded = 1;

      player.missions = [playerMission];
      player.totalPoints = 5; // Wrong total
      player.completedMissions = 1;

      const isValid = validatePlayerMissionData(player);
      expect(isValid).toBe(false);
    });
  });

  describe('repairPlayerMissionData', () => {
    it('should repair incorrect player data', () => {
      const player = createPlayer('Test Player');
      
      const mission = createMission('1', 'Test mission', DifficultyLevel.MEDIUM);
      const playerMission = createPlayerMission(mission);
      playerMission.state = MissionState.COMPLETED;
      playerMission.pointsAwarded = 5; // Wrong points
      playerMission.completedAt = new Date();
      playerMission.assignedAt = new Date(Date.now() - 10000); // 10 seconds ago

      player.missions = [playerMission];
      player.totalPoints = 10; // Wrong total
      player.completedMissions = 0; // Wrong count

      const repaired = repairPlayerMissionData(player);
      
      expect(repaired.totalPoints).toBe(2); // Corrected to medium difficulty
      expect(repaired.completedMissions).toBe(1); // Corrected count
      expect(repaired.missions[0].pointsAwarded).toBe(2); // Corrected mission points
    });
  });
});