// Tests for enhanced validation utilities
import {
  validateGameConfiguration,
  sanitizeGameConfiguration,
  validateMissionTiming,
  sanitizeCompletionTime,
  validateMissionPoints,
  validatePlayerScoring,
  sanitizePlayerScoring,
  validateEnhancedGameState
} from './validation';
import {
  DifficultyMode,
  DifficultyLevel,
  MissionState,
  createPlayer,
  createMission,
  createPlayerMission,
  createInitialGameState
} from '../models';

describe('Enhanced Validation', () => {
  describe('validateGameConfiguration', () => {
    it('should validate valid configuration', () => {
      const config = {
        missionsPerPlayer: 3,
        difficultyMode: DifficultyMode.MIXED
      };
      
      const result = validateGameConfiguration(config);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid mission count', () => {
      const config = {
        missionsPerPlayer: 0,
        difficultyMode: DifficultyMode.MIXED
      };
      
      const result = validateGameConfiguration(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('tra 1 e 10');
    });

    it('should require uniform difficulty in uniform mode', () => {
      const config = {
        missionsPerPlayer: 3,
        difficultyMode: DifficultyMode.UNIFORM
      };
      
      const result = validateGameConfiguration(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('richiesta');
    });
  });

  describe('sanitizeGameConfiguration', () => {
    it('should clamp mission count to valid range', () => {
      const config = sanitizeGameConfiguration({ missionsPerPlayer: 15 });
      expect(config.missionsPerPlayer).toBe(10);
    });

    it('should default to mixed mode for invalid difficulty mode', () => {
      const config = sanitizeGameConfiguration({ difficultyMode: 'INVALID' as any });
      expect(config.difficultyMode).toBe(DifficultyMode.MIXED);
    });
  });

  describe('validateMissionTiming', () => {
    it('should validate correct timing', () => {
      const assignedAt = new Date('2023-01-01T10:00:00Z');
      const completedAt = new Date('2023-01-01T10:05:00Z');
      
      const result = validateMissionTiming(assignedAt, completedAt);
      expect(result.isValid).toBe(true);
      expect(result.correctedTime).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should reject negative completion time', () => {
      const assignedAt = new Date('2023-01-01T10:05:00Z');
      const completedAt = new Date('2023-01-01T10:00:00Z');
      
      const result = validateMissionTiming(assignedAt, completedAt);
      expect(result.isValid).toBe(false);
      expect(result.correctedTime).toBe(0);
    });

    it('should cap excessive completion time', () => {
      const assignedAt = new Date('2023-01-01T10:00:00Z');
      const completedAt = new Date('2023-01-03T10:00:00Z'); // 2 days later
      
      const result = validateMissionTiming(assignedAt, completedAt);
      expect(result.isValid).toBe(false);
      expect(result.correctedTime).toBe(24 * 60 * 60 * 1000); // Capped at 24 hours
    });
  });

  describe('validateMissionPoints', () => {
    it('should validate correct points for completed mission', () => {
      const result = validateMissionPoints(DifficultyLevel.MEDIUM, 2, MissionState.COMPLETED);
      expect(result.isValid).toBe(true);
    });

    it('should reject incorrect points for difficulty', () => {
      const result = validateMissionPoints(DifficultyLevel.EASY, 3, MissionState.COMPLETED);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non corrispondono');
    });

    it('should reject points for non-completed mission', () => {
      const result = validateMissionPoints(DifficultyLevel.EASY, 1, MissionState.CAUGHT);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validatePlayerScoring', () => {
    it('should validate correct player scoring', () => {
      const mission = createMission('1', 'Test mission', DifficultyLevel.EASY);
      const playerMission = createPlayerMission(mission);
      playerMission.state = MissionState.COMPLETED;
      playerMission.pointsAwarded = 1;
      playerMission.completedAt = new Date();
      playerMission.completionTimeMs = 5000;

      const player = createPlayer('Test Player');
      player.missions = [playerMission];
      player.totalPoints = 1;
      player.completedMissions = 1;

      const result = validatePlayerScoring(player);
      expect(result.isValid).toBe(true);
    });

    it('should detect total points mismatch', () => {
      const mission = createMission('1', 'Test mission', DifficultyLevel.EASY);
      const playerMission = createPlayerMission(mission);
      playerMission.state = MissionState.COMPLETED;
      playerMission.pointsAwarded = 1;

      const player = createPlayer('Test Player');
      player.missions = [playerMission];
      player.totalPoints = 5; // Wrong total
      player.completedMissions = 1;

      const result = validatePlayerScoring(player);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non corrisponde');
    });
  });

  describe('sanitizePlayerScoring', () => {
    it('should correct player scoring data', () => {
      const mission = createMission('1', 'Test mission', DifficultyLevel.MEDIUM);
      const playerMission = createPlayerMission(mission);
      playerMission.state = MissionState.COMPLETED;
      playerMission.pointsAwarded = 5; // Wrong points
      playerMission.completedAt = new Date();

      const player = createPlayer('Test Player');
      player.missions = [playerMission];
      player.totalPoints = 10; // Wrong total
      player.completedMissions = 0; // Wrong count

      const sanitized = sanitizePlayerScoring(player);
      expect(sanitized.totalPoints).toBe(2); // Corrected to medium difficulty points
      expect(sanitized.completedMissions).toBe(1); // Corrected count
      expect(sanitized.missions[0].pointsAwarded).toBe(2); // Corrected mission points
    });
  });

  describe('validateEnhancedGameState', () => {
    it('should validate correct enhanced game state', () => {
      const gameState = createInitialGameState();
      gameState.configuration = {
        missionsPerPlayer: 3,
        difficultyMode: DifficultyMode.MIXED
      };

      const result = validateEnhancedGameState(gameState);
      expect(result.isValid).toBe(true);
    });

    it('should reject game state without configuration', () => {
      const gameState = createInitialGameState();
      (gameState as any).configuration = undefined;

      const result = validateEnhancedGameState(gameState);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('mancante');
    });
  });
});