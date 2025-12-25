// Custom hook for handling errors with user-friendly messages in Italian
import { useState, useCallback } from 'react';
import { useGameContext } from '../store/GameContext';

export interface ErrorState {
  message: string | null;
  type: 'error' | 'warning' | 'info';
  visible: boolean;
}

export const useErrorHandler = () => {
  const { error: contextError, clearError: clearContextError } = useGameContext();
  const [localError, setLocalError] = useState<ErrorState>({
    message: null,
    type: 'error',
    visible: false
  });

  // Show error with type
  const showError = useCallback((message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    setLocalError({
      message,
      type,
      visible: true
    });
  }, []);

  // Clear local error
  const clearError = useCallback(() => {
    setLocalError({
      message: null,
      type: 'error',
      visible: false
    });
  }, []);

  // Clear both local and context errors
  const clearAllErrors = useCallback(() => {
    clearError();
    clearContextError();
  }, [clearError, clearContextError]);

  // Handle validation errors
  const handleValidationError = useCallback((validationResult: { isValid: boolean; error?: string }) => {
    if (!validationResult.isValid && validationResult.error) {
      showError(validationResult.error, 'warning');
      return false;
    }
    return true;
  }, [showError]);

  // Handle async operation errors
  const handleAsyncError = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Si è verificato un errore imprevisto.'
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      console.error('Async operation failed:', error);
      showError(errorMessage);
      return null;
    }
  }, [showError]);

  // Get current error (prioritize local over context)
  const currentError = localError.visible && localError.message 
    ? localError 
    : contextError 
      ? { message: contextError, type: 'error' as const, visible: true }
      : { message: null, type: 'error' as const, visible: false };

  return {
    error: currentError,
    showError,
    clearError: clearAllErrors,
    handleValidationError,
    handleAsyncError,
    hasError: currentError.visible
  };
};