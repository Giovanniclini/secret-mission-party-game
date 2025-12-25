// Validation utility functions with comprehensive error handling
import { Player, GameState, GameStatus, MissionState } from '../models';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
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
  MISSION_NOT_ASSIGNED: 'Nessuna missione assegnata a questo giocatore.'
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
  
  // Check game status
  if (gameState.status !== GameStatus.SETUP) {
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
  const validTransitions: Record<GameStatus, GameStatus[]> = {
    [GameStatus.SETUP]: [GameStatus.ASSIGNING],
    [GameStatus.ASSIGNING]: [GameStatus.IN_PROGRESS],
    [GameStatus.IN_PROGRESS]: [GameStatus.FINISHED],
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

// Mission assignment validation
export const validatePlayerHasMission = (player: Player): ValidationResult => {
  if (!player.currentMission) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.MISSION_NOT_ASSIGNED
    };
  }
  
  return { isValid: true };
};

// Comprehensive game state validation
export const validateGameState = (gameState: any): ValidationResult => {
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
  
  if (typeof gameState.targetCompleted !== 'number' || gameState.targetCompleted < 1) {
    return {
      isValid: false,
      error: 'Obiettivo di completamento non valido.'
    };
  }
  
  if (!Object.values(GameStatus).includes(gameState.status)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_GAME_STATUS
    };
  }
  
  // Validate each player
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
    
    if (!Object.values(MissionState).includes(player.missionState)) {
      return {
        isValid: false,
        error: VALIDATION_MESSAGES.INVALID_MISSION_STATE
      };
    }
    
    if (typeof player.completedCount !== 'number' || player.completedCount < 0) {
      return {
        isValid: false,
        error: 'Conteggio missioni completate non valido.'
      };
    }
  }
  
  return { isValid: true };
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