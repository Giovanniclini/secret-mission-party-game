// AsyncStorage utility functions with error handling and recovery
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, createInitialGameState, GameStatus, MissionState } from '../models';

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

// Validate game state structure
const isValidGameState = (data: any): data is GameState => {
  if (!data || typeof data !== 'object') return false;
  
  // Check required fields
  if (!data.id || typeof data.id !== 'string') return false;
  if (!Array.isArray(data.players)) return false;
  if (typeof data.targetCompleted !== 'number' || data.targetCompleted < 1) return false;
  if (!Object.values(GameStatus).includes(data.status)) return false;
  
  // Validate dates
  if (!data.createdAt || !data.updatedAt) return false;
  
  // Validate players array
  for (const player of data.players) {
    if (!player.id || typeof player.id !== 'string') return false;
    if (!player.name || typeof player.name !== 'string') return false;
    if (!Object.values(MissionState).includes(player.missionState)) return false;
    if (typeof player.completedCount !== 'number' || player.completedCount < 0) return false;
  }
  
  return true;
};

// Save game state with backup and retry mechanism
export const saveGameState = async (gameState: GameState): Promise<StorageResult<void>> => {
  try {
    const serializedState = JSON.stringify(gameState);
    
    // Try to save main state
    try {
      await AsyncStorage.setItem(STORAGE_KEY, serializedState);
    } catch (mainError) {
      // If main save fails, try backup location
      try {
        await AsyncStorage.setItem(BACKUP_STORAGE_KEY, serializedState);
        return {
          success: true,
          error: 'Salvato nel backup a causa di problemi con la memoria principale.'
        };
      } catch (backupError) {
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
      } catch (backupError) {
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
        } catch (backupParseError) {
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
    
    // Validate the parsed data structure
    if (!isValidGameState(parsedData)) {
      console.error('Invalid game state structure:', parsedData);
      
      // Try backup if main data is corrupted
      if (!usingBackup) {
        try {
          const backupData = await AsyncStorage.getItem(BACKUP_STORAGE_KEY);
          if (backupData) {
            const backupParsed = JSON.parse(backupData);
            if (isValidGameState(backupParsed)) {
              return {
                success: true,
                data: {
                  ...backupParsed,
                  createdAt: new Date(backupParsed.createdAt),
                  updatedAt: new Date(backupParsed.updatedAt)
                },
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
    }
    
    // Convert date strings back to Date objects
    const gameState: GameState = {
      ...parsedData,
      createdAt: new Date(parsedData.createdAt),
      updatedAt: new Date(parsedData.updatedAt)
    };
    
    return {
      success: true,
      data: gameState,
      error: usingBackup ? ERROR_MESSAGES.RECOVERY_SUCCESS : undefined
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