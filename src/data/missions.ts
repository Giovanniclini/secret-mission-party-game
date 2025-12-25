// Mission data and loading utilities
import { Mission } from '../models';
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
export const getMissionsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): Mission[] => {
  return loadMissions().filter(mission => mission.difficulty === difficulty);
};