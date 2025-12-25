// Error utility functions for consistent error handling across the app
import { Alert } from 'react-native';

export interface AppError {
  type: 'VALIDATION' | 'STORAGE' | 'NAVIGATION' | 'GAME_STATE' | 'UNKNOWN';
  message: string;
  originalError?: Error;
  context?: string;
}

// Italian error messages for different error types
const ERROR_MESSAGES = {
  VALIDATION: 'Dati non validi. Controlla i tuoi input e riprova.',
  STORAGE: 'Problema con la memoria del dispositivo. I progressi potrebbero non essere salvati.',
  NAVIGATION: 'Errore di navigazione. Riprova o riavvia l\'app.',
  GAME_STATE: 'Stato del gioco non valido. Potrebbe essere necessario riavviare la partita.',
  UNKNOWN: 'Si è verificato un errore imprevisto. Riprova o riavvia l\'app.',
  NETWORK_UNAVAILABLE: 'Connessione di rete non disponibile. L\'app funziona offline.',
  PERMISSION_DENIED: 'Permesso negato. Controlla le impostazioni dell\'app.',
  TIMEOUT: 'Operazione scaduta. Riprova.',
  CORRUPTED_DATA: 'Dati corrotti rilevati. È stato ripristinato uno stato pulito.'
};

// Create standardized app error
export const createAppError = (
  type: AppError['type'],
  message?: string,
  originalError?: Error,
  context?: string
): AppError => ({
  type,
  message: message || ERROR_MESSAGES[type],
  originalError,
  context
});

// Log error with context
export const logError = (error: AppError | Error, context?: string) => {
  const errorInfo = error instanceof Error 
    ? { message: error.message, stack: error.stack, context }
    : { ...error, context: error.context || context };
    
  console.error('App Error:', errorInfo);
  
  // In production, you might want to send this to a crash reporting service
  // Example: Crashlytics.recordError(error);
};

// Show user-friendly error alert
export const showErrorAlert = (
  error: AppError | Error,
  title: string = 'Errore',
  onDismiss?: () => void
) => {
  const message = error instanceof Error 
    ? ERROR_MESSAGES.UNKNOWN 
    : error.message;

  Alert.alert(
    title,
    message,
    [
      {
        text: 'OK',
        onPress: onDismiss
      }
    ]
  );
};

// Handle async operations with error catching
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorType: AppError['type'] = 'UNKNOWN',
  context?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const appError = createAppError(
      errorType,
      undefined,
      error instanceof Error ? error : new Error(String(error)),
      context
    );
    
    logError(appError);
    return null;
  }
};

// Validate and handle storage operations
export const handleStorageError = (error: any, operation: string): AppError => {
  logError(error, `Storage operation: ${operation}`);
  
  if (error?.message?.includes('quota')) {
    return createAppError(
      'STORAGE',
      'Spazio di archiviazione insufficiente. Libera spazio sul dispositivo.',
      error,
      operation
    );
  }
  
  if (error?.message?.includes('permission')) {
    return createAppError(
      'STORAGE',
      'Permesso di scrittura negato. Controlla le impostazioni dell\'app.',
      error,
      operation
    );
  }
  
  return createAppError('STORAGE', undefined, error, operation);
};

// Handle validation errors consistently
export const handleValidationError = (
  validationResult: { isValid: boolean; error?: string },
  context?: string
): AppError | null => {
  if (!validationResult.isValid && validationResult.error) {
    const error = createAppError(
      'VALIDATION',
      validationResult.error,
      undefined,
      context
    );
    logError(error);
    return error;
  }
  return null;
};

// Check if error is recoverable
export const isRecoverableError = (error: AppError): boolean => {
  switch (error.type) {
    case 'VALIDATION':
      return true; // User can fix input
    case 'STORAGE':
      return false; // Usually requires app restart or device intervention
    case 'NAVIGATION':
      return true; // User can retry navigation
    case 'GAME_STATE':
      return false; // Usually requires game restart
    default:
      return false;
  }
};

// Get recovery suggestion for error
export const getRecoverySuggestion = (error: AppError): string => {
  switch (error.type) {
    case 'VALIDATION':
      return 'Controlla i tuoi input e riprova.';
    case 'STORAGE':
      return 'Riavvia l\'app o libera spazio sul dispositivo.';
    case 'NAVIGATION':
      return 'Riprova l\'operazione.';
    case 'GAME_STATE':
      return 'Potrebbe essere necessario iniziare una nuova partita.';
    default:
      return 'Riavvia l\'app se il problema persiste.';
  }
};

// Sanitize error message for user display
export const sanitizeErrorMessage = (message: string): string => {
  // Remove technical details that users don't need to see
  return message
    .replace(/Error:\s*/gi, '')
    .replace(/at\s+.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
};