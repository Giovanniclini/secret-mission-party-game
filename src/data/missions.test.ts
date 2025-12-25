// Tests for mission loading and assignment utilities
import { loadMissions, getAllMissions, getMissionsByDifficulty } from './missions';
import { shuffleMissions, assignMissionsToPlayers, getRandomMission, hasNoDuplicateMissions } from './missionUtils';
import { createPlayer, MissionState, Player } from '../models';

describe('Mission Loading', () => {
  test('should load missions from JSON data', () => {
    const missions = loadMissions();
    expect(missions).toBeDefined();
    expect(Array.isArray(missions)).toBe(true);
    expect(missions.length).toBeGreaterThan(0);
  });

  test('should load exactly 25 missions', () => {
    const missions = loadMissions();
    expect(missions.length).toBe(25);
  });

  test('should have missions with required properties', () => {
    const missions = loadMissions();
    missions.forEach(mission => {
      expect(mission).toHaveProperty('id');
      expect(mission).toHaveProperty('text');
      expect(mission).toHaveProperty('difficulty');
      expect(['easy', 'medium', 'hard']).toContain(mission.difficulty);
      expect(typeof mission.text).toBe('string');
      expect(mission.text.length).toBeGreaterThan(0);
    });
  });

  test('should filter missions by difficulty', () => {
    const easyMissions = getMissionsByDifficulty('easy');
    const mediumMissions = getMissionsByDifficulty('medium');
    const hardMissions = getMissionsByDifficulty('hard');
    
    expect(easyMissions.every(m => m.difficulty === 'easy')).toBe(true);
    expect(mediumMissions.every(m => m.difficulty === 'medium')).toBe(true);
    expect(hardMissions.every(m => m.difficulty === 'hard')).toBe(true);
  });
});

describe('Mission Utilities', () => {
  test('should shuffle missions randomly', () => {
    const missions = loadMissions();
    const shuffled1 = shuffleMissions(missions);
    const shuffled2 = shuffleMissions(missions);
    
    expect(shuffled1.length).toBe(missions.length);
    expect(shuffled2.length).toBe(missions.length);
    
    // Check that all original missions are still present
    const originalIds = missions.map(m => m.id).sort();
    const shuffled1Ids = shuffled1.map(m => m.id).sort();
    expect(shuffled1Ids).toEqual(originalIds);
  });

  test('should assign missions to players', () => {
    const players = [
      createPlayer('Alice'),
      createPlayer('Bob'),
      createPlayer('Charlie')
    ];
    
    const playersWithMissions = assignMissionsToPlayers(players);
    
    expect(playersWithMissions.length).toBe(3);
    playersWithMissions.forEach((player: Player) => {
      expect(player.currentMission).toBeDefined();
      expect(player.missionState).toBe(MissionState.ACTIVE);
    });
  });

  test('should avoid duplicate missions when possible', () => {
    const players = [
      createPlayer('Alice'),
      createPlayer('Bob'),
      createPlayer('Charlie')
    ];
    
    const playersWithMissions = assignMissionsToPlayers(players);
    const hasDuplicates = !hasNoDuplicateMissions(playersWithMissions);
    
    // With 25 missions and 3 players, there should be no duplicates
    expect(hasDuplicates).toBe(false);
  });

  test('should handle more players than missions', () => {
    // Create more players than available missions (25)
    const players = Array.from({ length: 30 }, (_, i) => createPlayer(`Player${i + 1}`));
    
    const playersWithMissions = assignMissionsToPlayers(players);
    
    expect(playersWithMissions.length).toBe(30);
    playersWithMissions.forEach((player: Player) => {
      expect(player.currentMission).toBeDefined();
      expect(player.missionState).toBe(MissionState.ACTIVE);
    });
  });

  test('should return random missions', () => {
    const mission1 = getRandomMission();
    const mission2 = getRandomMission();
    
    expect(mission1).toBeDefined();
    expect(mission2).toBeDefined();
    expect(mission1).toHaveProperty('id');
    expect(mission1).toHaveProperty('text');
    expect(mission1).toHaveProperty('difficulty');
  });
});