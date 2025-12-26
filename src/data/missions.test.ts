// Tests for mission loading and assignment utilities
import { 
  loadMissions, 
  getAllMissions, 
  getMissionsByDifficulty,
  getRandomMissionByDifficulty,
  getRandomMission,
  getAvailableMissions,
  getAvailableMissionsByDifficulty,
  getRandomAvailableMissionByDifficulty,
  getRandomAvailableMission,
  getMissionCountByDifficulty,
  getTotalMissionCount,
  hasEnoughMissions
} from './missions';
import { 
  calculateMissionPoints,
  calculatePlayerTotalPoints,
  updatePlayerStats,
  startMissionTiming,
  completeMissionTiming,
  markMissionAsCaught,
  comparePlayersForRanking,
  getPlayerRankings,
  getPlayerRank,
  hasPlayerCompletedAllMissions,
  needsNewMission,
  getUsedMissionIds,
  getAllUsedMissionIds,
  calculateGameProgress,
  hasAnyPlayerFinished,
  getGameStatistics,
  isValidMissionCompletion,
  validatePlayerMissionData
} from './missionUtils';
import { 
  createPlayer, 
  createPlayerMission,
  createMission,
  MissionState, 
  DifficultyLevel,
  Player 
} from '../models';

describe('Mission Loading', () => {
  test('should load missions from JSON data', () => {
    const missions = loadMissions();
    expect(missions).toBeDefined();
    expect(Array.isArray(missions)).toBe(true);
    expect(missions.length).toBeGreaterThan(0);
  });

  test('should load exactly 150 missions', () => {
    const missions = loadMissions();
    expect(missions.length).toBe(150);
  });

  test('should have missions with required properties', () => {
    const missions = loadMissions();
    missions.forEach(mission => {
      expect(mission).toHaveProperty('id');
      expect(mission).toHaveProperty('text');
      expect(mission).toHaveProperty('difficulty');
      expect(mission).toHaveProperty('points');
      expect(['EASY', 'MEDIUM', 'HARD']).toContain(mission.difficulty);
      expect(typeof mission.text).toBe('string');
      expect(mission.text.length).toBeGreaterThan(0);
      expect(typeof mission.points).toBe('number');
      expect(mission.points).toBeGreaterThan(0);
    });
  });

  test('should filter missions by difficulty', () => {
    const easyMissions = getMissionsByDifficulty(DifficultyLevel.EASY);
    const mediumMissions = getMissionsByDifficulty(DifficultyLevel.MEDIUM);
    const hardMissions = getMissionsByDifficulty(DifficultyLevel.HARD);
    
    expect(easyMissions.every(m => m.difficulty === DifficultyLevel.EASY)).toBe(true);
    expect(mediumMissions.every(m => m.difficulty === DifficultyLevel.MEDIUM)).toBe(true);
    expect(hardMissions.every(m => m.difficulty === DifficultyLevel.HARD)).toBe(true);
  });

  test('should return random missions by difficulty', () => {
    const easyMission = getRandomMissionByDifficulty(DifficultyLevel.EASY);
    const mediumMission = getRandomMissionByDifficulty(DifficultyLevel.MEDIUM);
    const hardMission = getRandomMissionByDifficulty(DifficultyLevel.HARD);
    
    expect(easyMission?.difficulty).toBe(DifficultyLevel.EASY);
    expect(mediumMission?.difficulty).toBe(DifficultyLevel.MEDIUM);
    expect(hardMission?.difficulty).toBe(DifficultyLevel.HARD);
  });

  test('should get available missions excluding used ones', () => {
    const allMissions = getAllMissions();
    const usedIds = [allMissions[0].id, allMissions[1].id];
    const availableMissions = getAvailableMissions(usedIds);
    
    expect(availableMissions.length).toBe(allMissions.length - 2);
    expect(availableMissions.every(m => !usedIds.includes(m.id))).toBe(true);
  });

  test('should validate mission availability for game configuration', () => {
    const totalPlayers = 3;
    const missionsPerPlayer = 5;
    
    // Should have enough missions for mixed difficulty
    expect(hasEnoughMissions(totalPlayers, missionsPerPlayer)).toBe(true);
    
    // Should have enough easy missions for smaller requirement
    expect(hasEnoughMissions(totalPlayers, 3, DifficultyLevel.EASY)).toBe(true); // 3×3=9, we have 50
    
    // Should have enough easy missions for larger requirement too now
    expect(hasEnoughMissions(totalPlayers, missionsPerPlayer, DifficultyLevel.EASY)).toBe(true); // 3×5=15, we have 50
  });
});

describe('Mission Scoring Utilities', () => {
  test('should calculate mission points correctly', () => {
    expect(calculateMissionPoints(DifficultyLevel.EASY, MissionState.COMPLETED)).toBe(1);
    expect(calculateMissionPoints(DifficultyLevel.MEDIUM, MissionState.COMPLETED)).toBe(2);
    expect(calculateMissionPoints(DifficultyLevel.HARD, MissionState.COMPLETED)).toBe(3);
    expect(calculateMissionPoints(DifficultyLevel.EASY, MissionState.CAUGHT)).toBe(0);
  });

  test('should calculate player total points', () => {
    const player = createPlayer('Test Player', 3);
    const easyMission = createMission('1', 'Easy task', DifficultyLevel.EASY);
    const hardMission = createMission('2', 'Hard task', DifficultyLevel.HARD);
    
    player.missions = [
      { ...createPlayerMission(easyMission), state: MissionState.COMPLETED },
      { ...createPlayerMission(hardMission), state: MissionState.COMPLETED }
    ];
    
    expect(calculatePlayerTotalPoints(player)).toBe(4); // 1 + 3
  });

  test('should update player stats correctly', () => {
    const player = createPlayer('Test Player', 3);
    const easyMission = createMission('1', 'Easy task', DifficultyLevel.EASY);
    const hardMission = createMission('2', 'Hard task', DifficultyLevel.HARD);
    
    player.missions = [
      { ...createPlayerMission(easyMission), state: MissionState.COMPLETED },
      { ...createPlayerMission(hardMission), state: MissionState.CAUGHT }
    ];
    
    const updatedPlayer = updatePlayerStats(player);
    expect(updatedPlayer.totalPoints).toBe(1);
    expect(updatedPlayer.completedMissions).toBe(1);
  });
});

describe('Mission Timing Utilities', () => {
  test('should start mission timing', () => {
    const mission = createMission('1', 'Test task', DifficultyLevel.EASY);
    const playerMission = createPlayerMission(mission);
    
    const timedMission = startMissionTiming(playerMission);
    expect(timedMission.state).toBe(MissionState.ACTIVE);
    expect(timedMission.assignedAt).toBeInstanceOf(Date);
  });

  test('should complete mission timing', () => {
    const mission = createMission('1', 'Test task', DifficultyLevel.MEDIUM);
    const playerMission = createPlayerMission(mission);
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 5000); // 5 seconds later
    
    const activeMission = { ...playerMission, state: MissionState.ACTIVE, assignedAt: startTime };
    const completedMission = completeMissionTiming(activeMission, endTime);
    
    expect(completedMission.state).toBe(MissionState.COMPLETED);
    expect(completedMission.completedAt).toBe(endTime);
    expect(completedMission.completionTimeMs).toBe(5000);
    expect(completedMission.pointsAwarded).toBe(2);
  });

  test('should mark mission as caught', () => {
    const mission = createMission('1', 'Test task', DifficultyLevel.HARD);
    const playerMission = createPlayerMission(mission);
    
    const caughtMission = markMissionAsCaught(playerMission);
    expect(caughtMission.state).toBe(MissionState.CAUGHT);
    expect(caughtMission.pointsAwarded).toBe(0);
    expect(caughtMission.completedAt).toBeInstanceOf(Date);
  });
});

describe('Player Ranking Utilities', () => {
  test('should rank players by points and time', () => {
    const player1 = createPlayer('Player 1', 2);
    const player2 = createPlayer('Player 2', 2);
    const player3 = createPlayer('Player 3', 2);
    
    // Player 1: 3 points, 2000ms average
    player1.totalPoints = 3;
    player1.missions = [
      { 
        ...createPlayerMission(createMission('1', 'Task', DifficultyLevel.HARD)), 
        state: MissionState.COMPLETED, 
        completionTimeMs: 2000 
      }
    ];
    
    // Player 2: 3 points, 1000ms average (should rank higher due to faster time)
    player2.totalPoints = 3;
    player2.missions = [
      { 
        ...createPlayerMission(createMission('2', 'Task', DifficultyLevel.HARD)), 
        state: MissionState.COMPLETED, 
        completionTimeMs: 1000 
      }
    ];
    
    // Player 3: 2 points
    player3.totalPoints = 2;
    
    const rankings = getPlayerRankings([player1, player2, player3]);
    expect(rankings[0]).toBe(player2); // Highest points, fastest time
    expect(rankings[1]).toBe(player1); // Same points, slower time
    expect(rankings[2]).toBe(player3); // Lowest points
  });

  test('should get player rank', () => {
    const player1 = createPlayer('Player 1', 2);
    const player2 = createPlayer('Player 2', 2);
    
    player1.totalPoints = 5;
    player2.totalPoints = 3;
    
    const players = [player1, player2];
    expect(getPlayerRank(player1, players)).toBe(1);
    expect(getPlayerRank(player2, players)).toBe(2);
  });
});

describe('Game Progress Utilities', () => {
  test('should calculate game progress percentage', () => {
    const player1 = createPlayer('Player 1', 3);
    const player2 = createPlayer('Player 2', 3);
    
    player1.completedMissions = 2;
    player2.completedMissions = 1;
    
    const progress = calculateGameProgress([player1, player2]);
    expect(progress).toBe(50); // 3 out of 6 total missions completed
  });

  test('should detect if any player has finished', () => {
    const player1 = createPlayer('Player 1', 3);
    const player2 = createPlayer('Player 2', 3);
    
    player1.completedMissions = 3;
    player2.completedMissions = 1;
    
    expect(hasAnyPlayerFinished([player1, player2])).toBe(true);
    
    player1.completedMissions = 2;
    expect(hasAnyPlayerFinished([player1, player2])).toBe(false);
  });

  test('should generate game statistics', () => {
    const gameStartTime = new Date(Date.now() - 60000); // 1 minute ago
    const player1 = createPlayer('Player 1', 2);
    const player2 = createPlayer('Player 2', 2);
    
    player1.completedMissions = 2;
    player1.totalPoints = 4;
    player1.missions = [
      { 
        ...createPlayerMission(createMission('1', 'Task', DifficultyLevel.MEDIUM)), 
        state: MissionState.COMPLETED, 
        completionTimeMs: 3000 
      },
      { 
        ...createPlayerMission(createMission('2', 'Task', DifficultyLevel.MEDIUM)), 
        state: MissionState.COMPLETED, 
        completionTimeMs: 5000 
      }
    ];
    
    player2.completedMissions = 1;
    player2.totalPoints = 1;
    
    const stats = getGameStatistics([player1, player2], gameStartTime);
    
    expect(stats.totalMissionsCompleted).toBe(3);
    expect(stats.averageCompletionTime).toBe(4000); // (3000 + 5000) / 2
    expect(stats.topPerformer).toBe(player1);
    expect(stats.totalDuration).toBeGreaterThan(50000); // At least 50 seconds
  });
});

describe('Mission Validation Utilities', () => {
  test('should validate mission completion data', () => {
    const mission = createMission('1', 'Test task', DifficultyLevel.EASY);
    const playerMission = createPlayerMission(mission);
    
    // Invalid: not completed
    expect(isValidMissionCompletion(playerMission)).toBe(false);
    
    // Valid: completed with all required data
    const completedMission = {
      ...playerMission,
      state: MissionState.COMPLETED,
      completedAt: new Date(),
      completionTimeMs: 5000,
      pointsAwarded: 1
    };
    expect(isValidMissionCompletion(completedMission)).toBe(true);
    
    // Invalid: completed but missing completion time
    const invalidMission = {
      ...completedMission,
      completionTimeMs: undefined
    };
    expect(isValidMissionCompletion(invalidMission)).toBe(false);
  });

  test('should validate player mission data integrity', () => {
    const player = createPlayer('Test Player', 2);
    const mission1 = createMission('1', 'Easy task', DifficultyLevel.EASY);
    const mission2 = createMission('2', 'Hard task', DifficultyLevel.HARD);
    
    player.missions = [
      {
        ...createPlayerMission(mission1),
        state: MissionState.COMPLETED,
        completedAt: new Date(),
        completionTimeMs: 3000,
        pointsAwarded: 1
      },
      {
        ...createPlayerMission(mission2),
        state: MissionState.COMPLETED,
        completedAt: new Date(),
        completionTimeMs: 5000,
        pointsAwarded: 3
      }
    ];
    
    player.totalPoints = 4;
    player.completedMissions = 2;
    
    expect(validatePlayerMissionData(player)).toBe(true);
    
    // Invalid: wrong total points
    player.totalPoints = 5;
    expect(validatePlayerMissionData(player)).toBe(false);
  });
});