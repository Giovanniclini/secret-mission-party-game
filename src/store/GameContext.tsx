// Game Context with useReducer and AsyncStorage persistence with error handling
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState } from 'react';
import { GameState, createInitialGameState, Player, Mission, MissionState, GameStatus, GameConfiguration, DifficultyLevel } from '../models';
import { gameReducer } from './gameReducer';
import { 
  GameAction, 
  createGame,
  configureGame,
  addPlayer,
  removePlayer,
  assignMissionWithDifficulty,
  completeMissionWithTiming,
  endGameManually,
  updateGameStatus,
  loadGame,
  clearFinishedGame,
  clearAllMissions
} from './gameActions';
import { saveGameState, loadGameState, StorageResult } from '../utils/storage';
import { validateEnhancedGameState } from '../utils/validation';

interface GameContextType {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialGameState());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error function
  const clearError = () => setError(null);

  // Enhanced dispatch with validation and error handling
  const enhancedDispatch = (action: GameAction) => {
    try {
      // Validate the action if needed
      dispatch(action);
      
      // Clear any previous errors on successful action
      if (error) {
        setError(null);
      }
    } catch (actionError) {
      console.error('Action dispatch failed:', actionError);
      setError('Si è verificato un errore durante l\'operazione. Riprova.');
    }
  };

  // Load game state from AsyncStorage on mount with error handling
  useEffect(() => {
    const loadInitialGameState = async () => {
      try {
        const result: StorageResult<GameState> = await loadGameState();
        
        if (result.success && result.data) {
          // Validate the loaded state
          const validation = validateEnhancedGameState(result.data);
          if (validation.isValid) {
            dispatch(loadGame(result.data));
            
            // Show recovery message if data was recovered from backup
            if (result.error) {
              setError(result.error);
            }
          } else {
            console.error('Loaded game state is invalid:', validation.error);
            setError('I dati salvati sono danneggiati. È stato creato un nuovo gioco.');
            // Keep the initial state created by useReducer
          }
        } else if (result.error) {
          console.error('Failed to load game state:', result.error);
          setError(result.error);
          // Keep the initial state created by useReducer
        }
        // If no saved data exists, continue with initial state (no error)
        
      } catch (loadError) {
        console.error('Unexpected error during game state loading:', loadError);
        setError('Errore imprevisto durante il caricamento. È stato creato un nuovo gioco.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialGameState();
  }, []);

  // Save game state to AsyncStorage whenever it changes with error handling
  useEffect(() => {
    const saveCurrentGameState = async () => {
      try {
        // Validate state before saving
        const validation = validateEnhancedGameState(gameState);
        if (!validation.isValid) {
          console.error('Invalid game state, not saving:', validation.error);
          setError('Stato del gioco non valido. I progressi potrebbero non essere salvati.');
          return;
        }

        const result: StorageResult<void> = await saveGameState(gameState);
        
        if (!result.success && result.error) {
          console.error('Failed to save game state:', result.error);
          setError(result.error);
        } else if (result.error) {
          // Success but with warning (e.g., saved to backup)
          setError(result.error);
        }
        
      } catch (saveError) {
        console.error('Unexpected error during game state saving:', saveError);
        setError('Errore imprevisto durante il salvataggio. I progressi potrebbero essere persi.');
      }
    };

    // Don't save initial state or while loading
    if (!isLoading && gameState.id) {
      saveCurrentGameState();
    }
  }, [gameState, isLoading]);

  const contextValue: GameContextType = {
    gameState,
    dispatch: enhancedDispatch,
    isLoading,
    error,
    clearError
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the GameContext
export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

// Utility functions for common operations with validation
export const useGameActions = () => {
  const { dispatch, error } = useGameContext();
  
  return {
    createGame: () => dispatch(createGame()),
    configureGame: (configuration: GameConfiguration) => dispatch(configureGame(configuration)),
    addPlayer: (player: Player) => dispatch(addPlayer(player)),
    removePlayer: (playerId: string) => dispatch(removePlayer(playerId)),
    assignMissionWithDifficulty: (playerId: string, mission: Mission, difficulty?: DifficultyLevel) => 
      dispatch(assignMissionWithDifficulty(playerId, mission, difficulty)),
    completeMissionWithTiming: (playerId: string, missionId: string, state: MissionState.COMPLETED | MissionState.CAUGHT, completedAt?: Date) => 
      dispatch(completeMissionWithTiming(playerId, missionId, state, completedAt)),
    endGameManually: () => dispatch(endGameManually()),
    updateGameStatus: (status: GameStatus) => dispatch(updateGameStatus(status)),
    clearFinishedGame: () => dispatch(clearFinishedGame()),
    clearAllMissions: () => dispatch(clearAllMissions()),
    hasError: !!error
  };
};