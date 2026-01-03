// AsyncStorage utility functions with error handling and recovery
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, createInitialGameState, GameStatus } from '../models';
import { validateEnhancedGameState, sanitizePlayerScoring } from './validation';

const STORAGE_KEY = 'secret_mission_game_state';
const BACKUP_STORAGE_KEY = 'secret_mission_game_state_backup';

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StorageError {
  type: 'STORAGE_UNAVAILABLE' | 'CORRUPTED_DATA' | 'PARSE_ERROR' | 'SAVE_FAILED';
  message: string;
  originalError?: Error;
}

// Italian error messages
const ERROR_MESSAGES = {
  STORAGE_UNAVAILABLE: 'Impossibile accedere alla memoria del dispositivo. Il gioco continuerà senza salvare i progressi.',
  CORRUPTED_DATA: 'I dati salvati sono danneggiati. È stato creato un nuovo gioco.',
  PARSE_ERROR: 'Errore nel caricamento dei dati salvati. È stato creato un nuovo gioco.',
  SAVE_FAILED: 'Impossibile salvare i progressi. Il gioco continuerà normalmente.',
  RECOVERY_SUCCESS: 'Dati recuperati dal backup precedente.',
  BACKUP_FAILED: 'Impossibile creare il backup dei dati.'
};

// Validate game state structure with enhanced validation
const isValidGameState = (data: any): data is GameState => {
  const validation = validateEnhancedGameState(data);
  return validation.isValid;
};

// Sanitize and repair game state data
const sanitizeGameState = (data: any): GameState | null => {
  try {
    // Basic structure validation first
    if (!data || typeof data !== 'object') return null;
    if (!data.id || typeof data.id !== 'string') return null;
    if (!Array.isArray(data.players)) return null;
    if (!data.configuration) return null;
    if (!Object.values(GameStatus).includes(data.status)) return null;

    // Sanitize players with corrected scoring
    const sanitizedPlayers = data.players.map((player: any) => {
      if (!player || typeof player !== 'object') return null;
      if (!player.id || !player.name) return null;
      if (!Array.isArray(player.missions)) return null;

      // Ensure all required fields exist with defaults
      const playerWithDefaults = {
        ...player,
        totalPoints: typeof player.totalPoints === 'number' ? player.totalPoints : 0,
        completedMissions: typeof player.completedMissions === 'number' ? player.completedMissions : 0,
        targetMissionCount: typeof player.targetMissionCount === 'number' ? player.targetMissionCount : 3,
        missions: player.missions.map((pm: any) => ({
          ...pm,
          pointsAwarded: typeof pm.pointsAwarded === 'number' ? pm.pointsAwarded : 0,
          assignedAt: pm.assignedAt ? new Date(pm.assignedAt) : new Date(),
          completedAt: pm.completedAt ? new Date(pm.completedAt) : undefined,
          completionTimeMs: typeof pm.completionTimeMs === 'number' ? pm.completionTimeMs : undefined
        }))
      };

      // Apply scoring sanitization
      return sanitizePlayerScoring(playerWithDefaults);
    }).filter(Boolean);

    // Empty players array is valid for SETUP status
    // if (sanitizedPlayers.length === 0) return null;

    // Return sanitized game state
    return {
      ...data,
      players: sanitizedPlayers,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      endedAt: data.endedAt ? new Date(data.endedAt) : undefined
    };
  } catch (error) {
    console.error('Game state sanitization failed:', error);
    return null;
  }
};

// Save game state with backup and retry mechanism
// Only saves when game is IN_PROGRESS to avoid persisting setup states
export const saveGameState = async (gameState: GameState): Promise<StorageResult<void>> => {
  try {
    // Only persist games that are actually IN_PROGRESS
    // Games in SETUP, CONFIGURING, or ASSIGNING should not be saved
    if (gameState.status !== GameStatus.IN_PROGRESS) {
      return { success: true }; // Don't save, but don't error either
    }

    const serializedState = JSON.stringify(gameState);
    
    // Try to save main state
    try {
      await AsyncStorage.setItem(STORAGE_KEY, serializedState);
    } catch {
      // If main save fails, try backup location
      try {
        await AsyncStorage.setItem(BACKUP_STORAGE_KEY, serializedState);
        return {
          success: true,
          error: 'Salvato nel backup a causa di problemi con la memoria principale.'
        };
      } catch {
        throw new Error('Entrambi i tentativi di salvataggio sono falliti');
      }
    }
    
    // Create backup copy if main save succeeded
    try {
      await AsyncStorage.setItem(BACKUP_STORAGE_KEY, serializedState);
    } catch (backupError) {
      console.warn('Backup creation failed:', backupError);
      // Don't fail the main operation if backup fails
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Storage save failed:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.SAVE_FAILED
    };
  }
};

// Load game state with corruption detection and recovery
export const loadGameState = async (): Promise<StorageResult<GameState>> => {
  try {
    // Try to load main state first
    let rawData: string | null = null;
    let usingBackup = false;
    
    try {
      rawData = await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Main storage access failed, trying backup:', error);
      try {
        rawData = await AsyncStorage.getItem(BACKUP_STORAGE_KEY);
        usingBackup = true;
      } catch {
        return {
          success: false,
          error: ERROR_MESSAGES.STORAGE_UNAVAILABLE
        };
      }
    }
    
    // No saved data found
    if (!rawData) {
      return {
        success: true,
        data: createInitialGameState()
      };
    }
    
    // Try to parse the data
    let parsedData: any;
    try {
      parsedData = JSON.parse(rawData);
    } catch (parseError) {
      console.error('JSON parse failed:', parseError);
      
      // Try backup if main data is corrupted
      if (!usingBackup) {
        try {
          const backupData = await AsyncStorage.getItem(BACKUP_STORAGE_KEY);
          if (backupData) {
            parsedData = JSON.parse(backupData);
            usingBackup = true;
          } else {
            throw parseError;
          }
        } catch {
          return {
            success: false,
            error: ERROR_MESSAGES.PARSE_ERROR
          };
        }
      } else {
        return {
          success: false,
          error: ERROR_MESSAGES.PARSE_ERROR
        };
      }
    }
    
    // Try to sanitize the data first, then validate
    const sanitizedData = sanitizeGameState(parsedData);
    if (sanitizedData && isValidGameState(sanitizedData)) {
      // Check if the loaded game should be persisted
      // Only IN_PROGRESS games should persist, others should be cleared
      if (sanitizedData.status !== GameStatus.IN_PROGRESS) {
        // Clear the stored data and return fresh state
        await clearGameState();
        return {
          success: true,
          data: createInitialGameState()
        };
      }
      
      return {
        success: true,
        data: sanitizedData
      };
    }
    
    // If sanitization failed or sanitized data is still invalid
    console.error('Invalid game state structure:', parsedData);
      
    // Try backup if main data is corrupted and sanitization failed
    if (!usingBackup) {
      try {
        const backupData = await AsyncStorage.getItem(BACKUP_STORAGE_KEY);
        if (backupData) {
          const backupParsed = JSON.parse(backupData);
          const sanitizedBackup = sanitizeGameState(backupParsed);
          if (sanitizedBackup && isValidGameState(sanitizedBackup)) {
            // Check backup data status as well
            if (sanitizedBackup.status !== GameStatus.IN_PROGRESS) {
              await clearGameState();
              return {
                success: true,
                data: createInitialGameState()
              };
            }
            
            return {
              success: true,
              data: sanitizedBackup,
              error: ERROR_MESSAGES.RECOVERY_SUCCESS
            };
          }
        }
      } catch (backupError) {
        console.error('Backup recovery failed:', backupError);
      }
    }
      
    return {
      success: false,
      error: ERROR_MESSAGES.CORRUPTED_DATA
    };
    
  } catch (error) {
    console.error('Storage load failed:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.STORAGE_UNAVAILABLE
    };
  }
};

// Clear all stored data (for reset functionality)
export const clearGameState = async (): Promise<StorageResult<void>> => {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, BACKUP_STORAGE_KEY]);
    return { success: true };
  } catch (error) {
    console.error('Storage clear failed:', error);
    return {
      success: false,
      error: 'Impossibile cancellare i dati salvati.'
    };
  }
};

// Clear game state if it's not IN_PROGRESS (for cleanup on app start)
export const clearNonProgressGameState = async (): Promise<StorageResult<void>> => {
  try {
    const result = await loadGameState();
    if (result.success && result.data && result.data.status !== GameStatus.IN_PROGRESS) {
      return await clearGameState();
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to clear non-progress game state:', error);
    return {
      success: false,
      error: 'Errore durante la pulizia dei dati di gioco.'
    };
  }
};

// Check storage availability
export const checkStorageAvailability = async (): Promise<boolean> => {
  try {
    const testKey = 'storage_test';
    const testValue = 'test';
    await AsyncStorage.setItem(testKey, testValue);
    const retrieved = await AsyncStorage.getItem(testKey);
    await AsyncStorage.removeItem(testKey);
    return retrieved === testValue;
  } catch (error) {
    console.error('Storage availability check failed:', error);
    return false;
  }
};