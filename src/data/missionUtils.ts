// Mission utility functions
import { Mission, Player, MissionState } from '../models';
import { loadMissions } from './missions';

// Fisher-Yates shuffle algorithm for randomizing missions
export const shuffleMissions = (missions: Mission[]): Mission[] => {
  const shuffled = [...missions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Assign missions to players (one per player, avoid duplicates when possible)
export const assignMissionsToPlayers = (players: Player[]): Player[] => {
  const allMissions = loadMissions();
  const shuffledMissions = shuffleMissions(allMissions);
  
  return players.map((player, index) => {
    // Use modulo to handle cases where players > missions
    const missionIndex = index % shuffledMissions.length;
    const assignedMission = shuffledMissions[missionIndex];
    
    return {
      ...player,
      currentMission: assignedMission,
      missionState: MissionState.ACTIVE
    };
  });
};

// Get a random mission (utility function)
export const getRandomMission = (): Mission => {
  const missions = loadMissions();
  const randomIndex = Math.floor(Math.random() * missions.length);
  return missions[randomIndex];
};

// Check if mission assignment avoids duplicates (when possible)
export const hasNoDuplicateMissions = (players: Player[]): boolean => {
  const missionIds = players
    .map(player => player.currentMission?.id)
    .filter(id => id !== undefined);
  
  const uniqueIds = new Set(missionIds);
  return uniqueIds.size === missionIds.length;
};