// Validation utility functions with comprehensive error handling
import { 
  Player, 
  GameState, 
  GameStatus, 
  MissionState, 
  GameConfiguration,
  DifficultyMode,
  DifficultyLevel,
  PlayerMission,
  isValidGameConfiguration
} from '../models';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface TimingValidationResult extends ValidationResult {
  correctedTime?: number;
}

// Italian validation error messages
const VALIDATION_MESSAGES = {
  PLAYER_NAME_TOO_SHORT: 'Il nome del giocatore deve essere di almeno 2 caratteri.',
  PLAYER_NAME_TOO_LONG: 'Il nome del giocatore non può superare i 20 caratteri.',
  PLAYER_NAME_EMPTY: 'Il nome del giocatore non può essere vuoto.',
  PLAYER_NAME_DUPLICATE: 'Esiste già un giocatore con questo nome.',
  PLAYER_NAME_INVALID_CHARS: 'Il nome del giocatore contiene caratteri non validi.',
  MINIMUM_PLAYERS_NOT_MET: 'Servono almeno 3 giocatori per iniziare il gioco.',
  MAXIMUM_PLAYERS_EXCEEDED: 'Il numero massimo di giocatori è 20.',
  INVALID_MISSION_STATE: 'Stato della missione non valido.',
  INVALID_GAME_STATUS: 'Stato del gioco non valido.',
  INVALID_STATE_TRANSITION: 'Transizione di stato non consentita.',
  GAME_NOT_READY: 'Il gioco non è pronto per iniziare.',
  PLAYER_NOT_FOUND: 'Giocatore non trovato.',
  MISSION_NOT_ASSIGNED: 'Nessuna missione assegnata a questo giocatore.',
  // Configuration validation messages
  INVALID_MISSION_COUNT: 'Il numero di missioni per giocatore deve essere tra 1 e 10.',
  INVALID_DIFFICULTY_MODE: 'Modalità difficoltà non valida.',
  INVALID_UNIFORM_DIFFICULTY: 'Difficoltà uniforme non valida per la modalità selezionata.',
  MISSING_UNIFORM_DIFFICULTY: 'Difficoltà uniforme richiesta per la modalità uniforme.',
  // Timing system validation messages
  INVALID_COMPLETION_TIME: 'Tempo di completamento non valido.',
  NEGATIVE_COMPLETION_TIME: 'Il tempo di completamento non può essere negativo.',
  EXCESSIVE_COMPLETION_TIME: 'Tempo di completamento eccessivamente lungo (oltre 24 ore).',
  MISSING_TIMING_DATA: 'Dati di timing mancanti per la missione completata.',
  INVALID_ASSIGNMENT_TIME: 'Tempo di assegnazione missione non valido.',
  // Scoring system validation messages
  INVALID_POINTS_AWARDED: 'Punti assegnati non validi.',
  POINTS_DIFFICULTY_MISMATCH: 'I punti assegnati non corrispondono alla difficoltà della missione.',
  NEGATIVE_POINTS: 'I punti non possono essere negativi.',
  INVALID_TOTAL_POINTS: 'Totale punti giocatore non corrisponde alla somma delle missioni.',
  INVALID_COMPLETED_COUNT: 'Conteggio missioni completate non corrisponde alle missioni effettive.'
};

// Player name validation
export const validatePlayerName = (name: string, existingPlayers: Player[] = []): ValidationResult => {
  // Check if name is empty or only whitespace
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.PLAYER_NAME_EMPTY
    };
  }
  
  const trimmedName = name.trim();
  
  // Check minimum length
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.PLAYER_NAME_TOO_SHORT
    };
  }
  
  // Check maximum length
  if (trimmedName.length > 20) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.PLAYER_NAME_TOO_LONG
    };
  }
  
  // Check for invalid characters (allow letters, numbers, spaces, basic punctuation)
  const validNameRegex = /^[a-zA-ZÀ-ÿ0-9\s\-'\.]+$/;
  if (!validNameRegex.test(trimmedName)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.PLAYER_NAME_INVALID_CHARS
    };
  }
  
  // Check for duplicates (case-insensitive)
  const isDuplicate = existingPlayers.some(player => 
    player.name.toLowerCase() === trimmedName.toLowerCase()
  );
  
  if (isDuplicate) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.PLAYER_NAME_DUPLICATE
    };
  }
  
  return { isValid: true };
};

// Game state validation
export const validateGameStart = (gameState: GameState): ValidationResult => {
  // Check minimum players
  if (gameState.players.length < 3) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.MINIMUM_PLAYERS_NOT_MET
    };
  }
  
  // Check maximum players
  if (gameState.players.length > 20) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.MAXIMUM_PLAYERS_EXCEEDED
    };
  }
  
  // Allow game to start from CONFIGURING, SETUP, or ASSIGNING status
  // ASSIGNING is allowed to support re-entering mission assignment after going back
  if (gameState.status !== GameStatus.CONFIGURING && 
      gameState.status !== GameStatus.SETUP && 
      gameState.status !== GameStatus.ASSIGNING) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.GAME_NOT_READY
    };
  }
  
  return { isValid: true };
};

// Mission state transition validation
export const validateMissionStateTransition = (
  currentState: MissionState,
  newState: MissionState
): ValidationResult => {
  const validTransitions: Record<MissionState, MissionState[]> = {
    [MissionState.WAITING]: [MissionState.ACTIVE],
    [MissionState.ACTIVE]: [MissionState.COMPLETED, MissionState.CAUGHT],
    [MissionState.COMPLETED]: [], // Terminal state
    [MissionState.CAUGHT]: [] // Terminal state
  };
  
  if (!validTransitions[currentState].includes(newState)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_STATE_TRANSITION
    };
  }
  
  return { isValid: true };
};

// Game status transition validation
export const validateGameStatusTransition = (
  currentStatus: GameStatus,
  newStatus: GameStatus
): ValidationResult => {
  // Allow same status (no-op transitions)
  if (currentStatus === newStatus) {
    return { isValid: true };
  }
  
  const validTransitions: Record<GameStatus, GameStatus[]> = {
    [GameStatus.SETUP]: [GameStatus.CONFIGURING],
    [GameStatus.CONFIGURING]: [GameStatus.ASSIGNING, GameStatus.SETUP, GameStatus.IN_PROGRESS], // Allow direct to IN_PROGRESS for assignment completion
    [GameStatus.ASSIGNING]: [GameStatus.IN_PROGRESS, GameStatus.CONFIGURING], // Allow back to configuring
    [GameStatus.IN_PROGRESS]: [GameStatus.FINISHED, GameStatus.ASSIGNING], // Allow back to assigning
    [GameStatus.FINISHED]: [GameStatus.SETUP] // Allow restart
  };
  
  if (!validTransitions[currentStatus].includes(newStatus)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_STATE_TRANSITION
    };
  }
  
  return { isValid: true };
};

// Player existence validation
export const validatePlayerExists = (playerId: string, players: Player[]): ValidationResult => {
  const player = players.find(p => p.id === playerId);
  
  if (!player) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.PLAYER_NOT_FOUND
    };
  }
  
  return { isValid: true };
};

// Mission assignment validation - removed as it references old model structure
// This validation is no longer needed with the new multi-mission model

// Comprehensive game state validation (DEPRECATED - use validateEnhancedGameState)
export const validateGameState = (gameState: any): ValidationResult => {
  // This function is deprecated and kept for backward compatibility
  // Use validateEnhancedGameState for new enhanced game model
  return validateEnhancedGameState(gameState);
};

// Sanitize player name input
export const sanitizePlayerName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' '); // Remove extra whitespace
};

// Check if game can be resumed
export const canResumeGame = (gameState: GameState): boolean => {
  return gameState.status !== GameStatus.SETUP && 
         gameState.status !== GameStatus.FINISHED && 
         gameState.players.length > 0;
};

// Enhanced Configuration Validation

/**
 * Validate game configuration with comprehensive error checking
 */
export const validateGameConfiguration = (config: GameConfiguration): ValidationResult => {
  // Validate missions per player
  if (typeof config.missionsPerPlayer !== 'number' || 
      config.missionsPerPlayer < 1 || 
      config.missionsPerPlayer > 10) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_MISSION_COUNT
    };
  }

  // Validate difficulty mode
  if (!Object.values(DifficultyMode).includes(config.difficultyMode)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_DIFFICULTY_MODE
    };
  }

  // If uniform mode, validate uniform difficulty
  if (config.difficultyMode === DifficultyMode.UNIFORM) {
    if (!config.uniformDifficulty) {
      return {
        isValid: false,
        error: VALIDATION_MESSAGES.MISSING_UNIFORM_DIFFICULTY
      };
    }

    if (!Object.values(DifficultyLevel).includes(config.uniformDifficulty)) {
      return {
        isValid: false,
        error: VALIDATION_MESSAGES.INVALID_UNIFORM_DIFFICULTY
      };
    }
  }

  return { isValid: true };
};

/**
 * Sanitize and validate configuration input
 */
export const sanitizeGameConfiguration = (config: Partial<GameConfiguration>): GameConfiguration => {
  // Ensure missions per player is within bounds
  const missionsPerPlayer = Math.max(1, Math.min(10, Math.floor(config.missionsPerPlayer || 3)));
  
  // Ensure valid difficulty mode
  const difficultyMode = Object.values(DifficultyMode).includes(config.difficultyMode as DifficultyMode)
    ? config.difficultyMode as DifficultyMode
    : DifficultyMode.MIXED;

  // Ensure valid uniform difficulty if needed
  let uniformDifficulty: DifficultyLevel | undefined;
  if (difficultyMode === DifficultyMode.UNIFORM) {
    uniformDifficulty = Object.values(DifficultyLevel).includes(config.uniformDifficulty as DifficultyLevel)
      ? config.uniformDifficulty as DifficultyLevel
      : DifficultyLevel.MEDIUM;
  }

  return {
    missionsPerPlayer,
    difficultyMode,
    uniformDifficulty
  };
};

// Enhanced Timing System Validation

/**
 * Validate mission timing data
 */
export const validateMissionTiming = (
  assignedAt: Date,
  completedAt: Date
): TimingValidationResult => {
  // Check if dates are valid
  if (!(assignedAt instanceof Date) || isNaN(assignedAt.getTime())) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_ASSIGNMENT_TIME
    };
  }

  if (!(completedAt instanceof Date) || isNaN(completedAt.getTime())) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_COMPLETION_TIME
    };
  }

  const completionTimeMs = completedAt.getTime() - assignedAt.getTime();

  // Check for negative completion time
  if (completionTimeMs < 0) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.NEGATIVE_COMPLETION_TIME,
      correctedTime: 0 // Fallback to 0ms
    };
  }

  // Check for excessively long completion time (over 24 hours)
  const MAX_COMPLETION_TIME = 24 * 60 * 60 * 1000; // 24 hours in ms
  if (completionTimeMs > MAX_COMPLETION_TIME) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.EXCESSIVE_COMPLETION_TIME,
      correctedTime: MAX_COMPLETION_TIME // Cap at 24 hours
    };
  }

  return { 
    isValid: true,
    correctedTime: completionTimeMs
  };
};

/**
 * Validate and sanitize completion time
 */
export const sanitizeCompletionTime = (
  assignedAt: Date,
  completedAt: Date
): number => {
  const validation = validateMissionTiming(assignedAt, completedAt);
  return validation.correctedTime || 0;
};

/**
 * Validate player mission timing data
 */
export const validatePlayerMissionTiming = (playerMission: PlayerMission): ValidationResult => {
  if (playerMission.state === MissionState.COMPLETED) {
    if (!playerMission.completedAt) {
      return {
        isValid: false,
        error: VALIDATION_MESSAGES.MISSING_TIMING_DATA
      };
    }

    const timingValidation = validateMissionTiming(
      playerMission.assignedAt,
      playerMission.completedAt
    );

    if (!timingValidation.isValid) {
      return timingValidation;
    }
  }

  return { isValid: true };
};

// Enhanced Scoring System Validation

/**
 * Validate mission points against difficulty
 */
export const validateMissionPoints = (
  difficulty: DifficultyLevel,
  pointsAwarded: number,
  missionState: MissionState
): ValidationResult => {
  // Points should be 0 for non-completed missions
  if (missionState !== MissionState.COMPLETED && pointsAwarded !== 0) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_POINTS_AWARDED
    };
  }

  // Points cannot be negative
  if (pointsAwarded < 0) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.NEGATIVE_POINTS
    };
  }

  // For completed missions, points should match difficulty
  if (missionState === MissionState.COMPLETED) {
    const expectedPoints = difficulty === DifficultyLevel.EASY ? 1 :
                          difficulty === DifficultyLevel.MEDIUM ? 2 : 3;
    
    if (pointsAwarded !== expectedPoints) {
      return {
        isValid: false,
        error: VALIDATION_MESSAGES.POINTS_DIFFICULTY_MISMATCH
      };
    }
  }

  return { isValid: true };
};

/**
 * Validate player scoring data integrity
 */
export const validatePlayerScoring = (player: Player): ValidationResult => {
  // Calculate expected total points
  const expectedTotalPoints = player.missions.reduce((total, pm) => {
    if (pm.state === MissionState.COMPLETED) {
      const expectedPoints = pm.mission.difficulty === DifficultyLevel.EASY ? 1 :
                            pm.mission.difficulty === DifficultyLevel.MEDIUM ? 2 : 3;
      return total + expectedPoints;
    }
    return total;
  }, 0);

  // Check if total points match
  if (player.totalPoints !== expectedTotalPoints) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_TOTAL_POINTS
    };
  }

  // Calculate expected completed missions count
  const expectedCompletedCount = player.missions.filter(
    pm => pm.state === MissionState.COMPLETED
  ).length;

  // Check if completed count matches
  if (player.completedMissions !== expectedCompletedCount) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_COMPLETED_COUNT
    };
  }

  // Validate each mission's points
  for (const playerMission of player.missions) {
    const pointsValidation = validateMissionPoints(
      playerMission.mission.difficulty,
      playerMission.pointsAwarded,
      playerMission.state
    );

    if (!pointsValidation.isValid) {
      return pointsValidation;
    }

    // Validate timing for completed missions
    const timingValidation = validatePlayerMissionTiming(playerMission);
    if (!timingValidation.isValid) {
      return timingValidation;
    }
  }

  return { isValid: true };
};

/**
 * Sanitize and correct player scoring data
 */
export const sanitizePlayerScoring = (player: Player): Player => {
  // Recalculate missions with corrected data
  const correctedMissions = player.missions.map(pm => {
    let correctedMission = { ...pm };

    // Correct points based on difficulty and state
    if (pm.state === MissionState.COMPLETED) {
      const expectedPoints = pm.mission.difficulty === DifficultyLevel.EASY ? 1 :
                            pm.mission.difficulty === DifficultyLevel.MEDIUM ? 2 : 3;
      correctedMission.pointsAwarded = expectedPoints;

      // Correct timing if needed
      if (pm.completedAt) {
        correctedMission.completionTimeMs = sanitizeCompletionTime(
          pm.assignedAt,
          pm.completedAt
        );
      }
    } else {
      correctedMission.pointsAwarded = 0;
    }

    return correctedMission;
  });

  // Recalculate totals
  const totalPoints = correctedMissions.reduce((sum, pm) => sum + pm.pointsAwarded, 0);
  const completedMissions = correctedMissions.filter(pm => pm.state === MissionState.COMPLETED).length;

  return {
    ...player,
    missions: correctedMissions,
    totalPoints,
    completedMissions
  };
};

// Enhanced Game State Validation

/**
 * Comprehensive game state validation with enhanced data models
 */
export const validateEnhancedGameState = (gameState: any): ValidationResult => {
  // Check if gameState exists
  if (!gameState) {
    return {
      isValid: false,
      error: 'Stato del gioco non trovato.'
    };
  }

  // Check required fields
  if (!gameState.id || typeof gameState.id !== 'string') {
    return {
      isValid: false,
      error: 'ID del gioco non valido.'
    };
  }

  if (!Array.isArray(gameState.players)) {
    return {
      isValid: false,
      error: 'Lista giocatori non valida.'
    };
  }

  if (!gameState.configuration) {
    return {
      isValid: false,
      error: 'Configurazione del gioco mancante.'
    };
  }

  // Validate configuration
  const configValidation = validateGameConfiguration(gameState.configuration);
  if (!configValidation.isValid) {
    return configValidation;
  }

  if (!Object.values(GameStatus).includes(gameState.status)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_GAME_STATUS
    };
  }

  // Validate dates
  if (!gameState.createdAt || !gameState.updatedAt) {
    return {
      isValid: false,
      error: 'Date del gioco non valide.'
    };
  }

  // Validate each player with enhanced model
  for (const player of gameState.players) {
    if (!player.id || typeof player.id !== 'string') {
      return {
        isValid: false,
        error: 'ID giocatore non valido.'
      };
    }

    if (!player.name || typeof player.name !== 'string') {
      return {
        isValid: false,
        error: 'Nome giocatore non valido.'
      };
    }

    if (!Array.isArray(player.missions)) {
      return {
        isValid: false,
        error: 'Lista missioni giocatore non valida.'
      };
    }

    if (typeof player.totalPoints !== 'number' || player.totalPoints < 0) {
      return {
        isValid: false,
        error: 'Punti totali giocatore non validi.'
      };
    }

    if (typeof player.completedMissions !== 'number' || player.completedMissions < 0) {
      return {
        isValid: false,
        error: 'Conteggio missioni completate non valido.'
      };
    }

    if (typeof player.targetMissionCount !== 'number' || player.targetMissionCount < 1) {
      return {
        isValid: false,
        error: 'Obiettivo missioni giocatore non valido.'
      };
    }

    // Validate player scoring integrity
    const scoringValidation = validatePlayerScoring(player);
    if (!scoringValidation.isValid) {
      return scoringValidation;
    }
  }

  return { isValid: true };
};