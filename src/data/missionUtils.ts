// Mission utilities for scoring, timing, and game logic
import { 
  Player, 
  PlayerMission, 
  MissionState, 
  DifficultyLevel,
  getDifficultyPoints,
  calculateCompletionTime,
  calculateAverageCompletionTime
} from '../models';
import { 
  validateMissionTiming, 
  validateMissionPoints, 
  sanitizeCompletionTime 
} from '../utils/validation';
import { createAppError, logError } from '../utils/errorUtils';

// Scoring System Utilities

/**
 * Calculate points for a mission based on difficulty and completion state
 * Enhanced with validation and error handling
 */
export const calculateMissionPoints = (
  difficulty: DifficultyLevel,
  state: MissionState
): number => {
  try {
    if (state === MissionState.COMPLETED) {
      const points = getDifficultyPoints(difficulty);
      
      // Validate points calculation
      const validation = validateMissionPoints(difficulty, points, state);
      if (!validation.isValid) {
        logError(createAppError('VALIDATION', validation.error), 'calculateMissionPoints');
        return 0; // Fallback to 0 points on validation error
      }
      
      return points;
    }
    return 0;
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error calculating mission points', error instanceof Error ? error : undefined), 'calculateMissionPoints');
    return 0;
  }
};

/**
 * Calculate total points for a player with error recovery
 */
export const calculatePlayerTotalPoints = (player: Player): number => {
  try {
    return player.missions.reduce((total, playerMission) => {
      const points = calculateMissionPoints(playerMission.mission.difficulty, playerMission.state);
      return total + points;
    }, 0);
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error calculating player total points', error instanceof Error ? error : undefined), 'calculatePlayerTotalPoints');
    return 0;
  }
};

/**
 * Update player's total points and completed missions count with validation
 */
export const updatePlayerStats = (player: Player): Player => {
  try {
    const totalPoints = calculatePlayerTotalPoints(player);
    const completedMissions = player.missions.filter(
      pm => pm.state === MissionState.COMPLETED
    ).length;

    return {
      ...player,
      totalPoints,
      completedMissions
    };
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error updating player stats', error instanceof Error ? error : undefined), 'updatePlayerStats');
    return player; // Return original player on error
  }
};

// Timing System Utilities

/**
 * Start timing for a mission (when it becomes ACTIVE) with validation
 */
export const startMissionTiming = (playerMission: PlayerMission): PlayerMission => {
  try {
    const now = new Date();
    
    return {
      ...playerMission,
      state: MissionState.ACTIVE,
      assignedAt: now
    };
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error starting mission timing', error instanceof Error ? error : undefined), 'startMissionTiming');
    return playerMission; // Return original on error
  }
};

/**
 * Complete mission timing and calculate completion time with validation
 */
export const completeMissionTiming = (
  playerMission: PlayerMission,
  completedAt: Date = new Date()
): PlayerMission => {
  try {
    // Validate timing data
    const timingValidation = validateMissionTiming(playerMission.assignedAt, completedAt);
    
    let completionTimeMs: number;
    if (timingValidation.isValid) {
      completionTimeMs = timingValidation.correctedTime || calculateCompletionTime(playerMission.assignedAt, completedAt);
    } else {
      // Log validation error but continue with sanitized time
      logError(createAppError('VALIDATION', timingValidation.error), 'completeMissionTiming');
      completionTimeMs = sanitizeCompletionTime(playerMission.assignedAt, completedAt);
    }

    const pointsAwarded = calculateMissionPoints(
      playerMission.mission.difficulty,
      MissionState.COMPLETED
    );

    return {
      ...playerMission,
      state: MissionState.COMPLETED,
      completedAt,
      completionTimeMs,
      pointsAwarded
    };
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error completing mission timing', error instanceof Error ? error : undefined), 'completeMissionTiming');
    
    // Return mission with minimal safe completion data
    return {
      ...playerMission,
      state: MissionState.COMPLETED,
      completedAt,
      completionTimeMs: 0,
      pointsAwarded: 0
    };
  }
};

/**
 * Mark mission as caught (no points, no completion time) with error handling
 */
export const markMissionAsCaught = (playerMission: PlayerMission): PlayerMission => {
  try {
    return {
      ...playerMission,
      state: MissionState.CAUGHT,
      completedAt: new Date(),
      pointsAwarded: 0
    };
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error marking mission as caught', error instanceof Error ? error : undefined), 'markMissionAsCaught');
    return playerMission; // Return original on error
  }
};

// Tiebreaker Logic

/**
 * Compare two players for ranking (higher points wins, faster time breaks ties)
 * Enhanced with error handling
 */
export const comparePlayersForRanking = (playerA: Player, playerB: Player): number => {
  try {
    // Primary: highest total points
    if (playerA.totalPoints !== playerB.totalPoints) {
      return playerB.totalPoints - playerA.totalPoints;
    }

    // Tiebreaker: fastest average completion time
    const avgTimeA = calculateAverageCompletionTime(playerA);
    const avgTimeB = calculateAverageCompletionTime(playerB);
    
    return avgTimeA - avgTimeB;
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error comparing players for ranking', error instanceof Error ? error : undefined), 'comparePlayersForRanking');
    return 0; // Equal ranking on error
  }
};

/**
 * Get player rankings sorted by points and time with error recovery
 */
export const getPlayerRankings = (players: Player[]): Player[] => {
  try {
    return [...players].sort(comparePlayersForRanking);
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error getting player rankings', error instanceof Error ? error : undefined), 'getPlayerRankings');
    return [...players]; // Return original order on error
  }
};

/**
 * Get player's current rank in the game with error handling
 */
export const getPlayerRank = (player: Player, allPlayers: Player[]): number => {
  try {
    const rankings = getPlayerRankings(allPlayers);
    const rank = rankings.findIndex(p => p.id === player.id) + 1;
    return rank > 0 ? rank : allPlayers.length; // Default to last place if not found
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error getting player rank', error instanceof Error ? error : undefined), 'getPlayerRank');
    return 1; // Default to first place on error
  }
};

// Mission Assignment Utilities

/**
 * Check if player has completed all their assigned missions
 */
export const hasPlayerCompletedAllMissions = (player: Player): boolean => {
  return player.completedMissions >= player.targetMissionCount;
};

/**
 * Check if player needs a new mission assignment
 */
export const needsNewMission = (player: Player): boolean => {
  const activeMissions = player.missions.filter(
    pm => pm.state === MissionState.ACTIVE || pm.state === MissionState.WAITING
  );
  
  return activeMissions.length === 0 && !hasPlayerCompletedAllMissions(player);
};

/**
 * Get all mission IDs already used by a player
 */
export const getUsedMissionIds = (player: Player): string[] => {
  return player.missions.map(pm => pm.mission.id);
};

/**
 * Get all mission IDs used across all players
 */
export const getAllUsedMissionIds = (players: Player[]): string[] => {
  const allIds = players.flatMap(player => getUsedMissionIds(player));
  return [...new Set(allIds)]; // Remove duplicates
};

// Game Progress Utilities

/**
 * Calculate overall game completion percentage with error handling
 */
export const calculateGameProgress = (players: Player[]): number => {
  try {
    if (players.length === 0) {
      return 0;
    }

    const totalTargetMissions = players.reduce(
      (sum, player) => sum + (player.targetMissionCount || 0),
      0
    );
    
    const totalCompletedMissions = players.reduce(
      (sum, player) => sum + (player.completedMissions || 0),
      0
    );

    if (totalTargetMissions <= 0) {
      return 0;
    }

    const progress = (totalCompletedMissions / totalTargetMissions) * 100;
    return Math.min(100, Math.max(0, progress)); // Clamp between 0 and 100
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error calculating game progress', error instanceof Error ? error : undefined), 'calculateGameProgress');
    return 0;
  }
};

/**
 * Check if any player has completed all their missions with error handling
 */
export const hasAnyPlayerFinished = (players: Player[]): boolean => {
  try {
    return players.some(player => hasPlayerCompletedAllMissions(player));
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error checking if any player finished', error instanceof Error ? error : undefined), 'hasAnyPlayerFinished');
    return false;
  }
};

/**
 * Get game statistics for end game display with comprehensive error handling
 */
export const getGameStatistics = (players: Player[], gameStartTime: Date): {
  totalDuration: number;
  totalMissionsCompleted: number;
  averageCompletionTime: number;
  topPerformer: Player | null;
} => {
  try {
    const now = Date.now();
    const startTime = gameStartTime instanceof Date ? gameStartTime.getTime() : Date.now();
    const totalDuration = Math.max(0, now - startTime);
    
    const totalMissionsCompleted = players.reduce(
      (sum, player) => sum + (player.completedMissions || 0),
      0
    );

    // Calculate overall average completion time
    const allCompletionTimes = players.flatMap(player =>
      (player.missions || [])
        .filter(pm => pm.state === MissionState.COMPLETED && pm.completionTimeMs && pm.completionTimeMs > 0)
        .map(pm => pm.completionTimeMs!)
    );

    const averageCompletionTime = allCompletionTimes.length > 0
      ? allCompletionTimes.reduce((sum, time) => sum + time, 0) / allCompletionTimes.length
      : 0;

    const topPerformer = players.length > 0 ? getPlayerRankings(players)[0] : null;

    return {
      totalDuration,
      totalMissionsCompleted,
      averageCompletionTime,
      topPerformer
    };
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error getting game statistics', error instanceof Error ? error : undefined), 'getGameStatistics');
    
    // Return safe defaults on error
    return {
      totalDuration: 0,
      totalMissionsCompleted: 0,
      averageCompletionTime: 0,
      topPerformer: null
    };
  }
};

// Validation Utilities

/**
 * Validate mission completion data with enhanced error checking
 */
export const isValidMissionCompletion = (playerMission: PlayerMission): boolean => {
  try {
    if (playerMission.state !== MissionState.COMPLETED) {
      return false;
    }

    // Check required completion data
    if (!playerMission.completedAt) {
      return false;
    }

    if (playerMission.completionTimeMs === undefined || playerMission.completionTimeMs < 0) {
      return false;
    }

    if (playerMission.pointsAwarded < 0) {
      return false;
    }

    // Validate timing
    const timingValidation = validateMissionTiming(
      playerMission.assignedAt,
      playerMission.completedAt
    );

    if (!timingValidation.isValid) {
      return false;
    }

    // Validate points
    const pointsValidation = validateMissionPoints(
      playerMission.mission.difficulty,
      playerMission.pointsAwarded,
      playerMission.state
    );

    return pointsValidation.isValid;
  } catch (error) {
    logError(createAppError('VALIDATION', 'Error validating mission completion', error instanceof Error ? error : undefined), 'isValidMissionCompletion');
    return false;
  }
};

/**
 * Validate player mission data integrity with comprehensive checks
 */
export const validatePlayerMissionData = (player: Player): boolean => {
  try {
    // Check that total points match sum of mission points
    const calculatedPoints = calculatePlayerTotalPoints(player);
    if (player.totalPoints !== calculatedPoints) {
      logError(createAppError('VALIDATION', `Player ${player.name} total points mismatch: expected ${calculatedPoints}, got ${player.totalPoints}`), 'validatePlayerMissionData');
      return false;
    }

    // Check that completed missions count matches actual completed missions
    const actualCompletedCount = player.missions.filter(
      pm => pm.state === MissionState.COMPLETED
    ).length;
    if (player.completedMissions !== actualCompletedCount) {
      logError(createAppError('VALIDATION', `Player ${player.name} completed count mismatch: expected ${actualCompletedCount}, got ${player.completedMissions}`), 'validatePlayerMissionData');
      return false;
    }

    // Validate each completed mission
    const completedMissions = player.missions.filter(
      pm => pm.state === MissionState.COMPLETED
    );
    
    const allValid = completedMissions.every(isValidMissionCompletion);
    if (!allValid) {
      logError(createAppError('VALIDATION', `Player ${player.name} has invalid mission completion data`), 'validatePlayerMissionData');
    }

    return allValid;
  } catch (error) {
    logError(createAppError('VALIDATION', 'Error validating player mission data', error instanceof Error ? error : undefined), 'validatePlayerMissionData');
    return false;
  }
};

/**
 * Repair player mission data with error recovery
 */
export const repairPlayerMissionData = (player: Player): Player => {
  try {
    // Recalculate and fix mission data
    const repairedMissions = player.missions.map(pm => {
      let repairedMission = { ...pm };

      // Fix points based on difficulty and state
      if (pm.state === MissionState.COMPLETED) {
        const expectedPoints = getDifficultyPoints(pm.mission.difficulty);
        repairedMission.pointsAwarded = expectedPoints;

        // Fix timing if needed
        if (pm.completedAt && pm.assignedAt) {
          const sanitizedTime = sanitizeCompletionTime(pm.assignedAt, pm.completedAt);
          repairedMission.completionTimeMs = sanitizedTime;
        } else if (pm.state === MissionState.COMPLETED && !pm.completedAt) {
          // Set completion time to assignment time if missing
          repairedMission.completedAt = pm.assignedAt;
          repairedMission.completionTimeMs = 0;
        }
      } else {
        repairedMission.pointsAwarded = 0;
      }

      return repairedMission;
    });

    // Recalculate totals
    const totalPoints = repairedMissions.reduce((sum, pm) => sum + pm.pointsAwarded, 0);
    const completedMissions = repairedMissions.filter(pm => pm.state === MissionState.COMPLETED).length;

    const repairedPlayer = {
      ...player,
      missions: repairedMissions,
      totalPoints,
      completedMissions
    };

    // Log repair if changes were made
    if (player.totalPoints !== totalPoints || player.completedMissions !== completedMissions) {
      logError(createAppError('VALIDATION', `Repaired player ${player.name} data: points ${player.totalPoints} -> ${totalPoints}, completed ${player.completedMissions} -> ${completedMissions}`), 'repairPlayerMissionData');
    }

    return repairedPlayer;
  } catch (error) {
    logError(createAppError('UNKNOWN', 'Error repairing player mission data', error instanceof Error ? error : undefined), 'repairPlayerMissionData');
    return player; // Return original on error
  }
};