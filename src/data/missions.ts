// Mission data and loading utilities
import { Mission, DifficultyLevel } from '../models';
import missionsData from './missions.json';

// Load missions from JSON data
export const loadMissions = (): Mission[] => {
  return missionsData.missions as Mission[];
};

// Get all available missions
export const getAllMissions = (): Mission[] => {
  return loadMissions();
};

// Get missions by difficulty
export const getMissionsByDifficulty = (difficulty: DifficultyLevel): Mission[] => {
  return loadMissions().filter(mission => mission.difficulty === difficulty);
};

// Get random mission by difficulty
export const getRandomMissionByDifficulty = (difficulty: DifficultyLevel): Mission | null => {
  const missions = getMissionsByDifficulty(difficulty);
  if (missions.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * missions.length);
  return missions[randomIndex];
};

// Get random mission from all missions
export const getRandomMission = (): Mission | null => {
  const missions = getAllMissions();
  if (missions.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * missions.length);
  return missions[randomIndex];
};

// Get missions excluding already used ones
export const getAvailableMissions = (usedMissionIds: string[]): Mission[] => {
  return getAllMissions().filter(mission => !usedMissionIds.includes(mission.id));
};

// Get available missions by difficulty excluding used ones
export const getAvailableMissionsByDifficulty = (
  difficulty: DifficultyLevel,
  usedMissionIds: string[]
): Mission[] => {
  return getMissionsByDifficulty(difficulty).filter(
    mission => !usedMissionIds.includes(mission.id)
  );
};

// Get random available mission by difficulty
export const getRandomAvailableMissionByDifficulty = (
  difficulty: DifficultyLevel,
  usedMissionIds: string[]
): Mission | null => {
  const availableMissions = getAvailableMissionsByDifficulty(difficulty, usedMissionIds);
  if (availableMissions.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * availableMissions.length);
  return availableMissions[randomIndex];
};

// Get random available mission from all difficulties
export const getRandomAvailableMission = (usedMissionIds: string[]): Mission | null => {
  const availableMissions = getAvailableMissions(usedMissionIds);
  if (availableMissions.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * availableMissions.length);
  return availableMissions[randomIndex];
};

// Get mission count by difficulty
export const getMissionCountByDifficulty = (difficulty: DifficultyLevel): number => {
  return getMissionsByDifficulty(difficulty).length;
};

// Get total mission count
export const getTotalMissionCount = (): number => {
  return getAllMissions().length;
};

// Validate if enough missions exist for game configuration
export const hasEnoughMissions = (
  totalPlayers: number,
  missionsPerPlayer: number,
  difficulty?: DifficultyLevel
): boolean => {
  const requiredMissions = totalPlayers * missionsPerPlayer;
  
  if (difficulty) {
    return getMissionCountByDifficulty(difficulty) >= requiredMissions;
  }
  
  return getTotalMissionCount() >= requiredMissions;
};