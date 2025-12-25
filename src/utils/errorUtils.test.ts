// Tests for error handling utilities (core functions only)
import { 
  createAppError, 
  handleValidationError, 
  isRecoverableError, 
  getRecoverySuggestion,
  sanitizeErrorMessage 
} from './errorUtils';

// Mock Alert to avoid React Native dependency in tests
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn()
  }
}));

describe('Error Utils', () => {
  describe('createAppError', () => {
    it('should create app error with default message', () => {
      const error = createAppError('VALIDATION');
      
      expect(error.type).toBe('VALIDATION');
      expect(error.message).toBe('Dati non validi. Controlla i tuoi input e riprova.');
      expect(error.originalError).toBeUndefined();
      expect(error.context).toBeUndefined();
    });

    it('should create app error with custom message', () => {
      const customMessage = 'Custom error message';
      const error = createAppError('STORAGE', customMessage);
      
      expect(error.type).toBe('STORAGE');
      expect(error.message).toBe(customMessage);
    });

    it('should create app error with context and original error', () => {
      const originalError = new Error('Original error');
      const context = 'Test context';
      const error = createAppError('UNKNOWN', undefined, originalError, context);
      
      expect(error.type).toBe('UNKNOWN');
      expect(error.originalError).toBe(originalError);
      expect(error.context).toBe(context);
    });
  });

  describe('handleValidationError', () => {
    it('should return null for valid result', () => {
      const result = handleValidationError({ isValid: true });
      expect(result).toBeNull();
    });

    it('should return app error for invalid result', () => {
      const validationResult = { 
        isValid: false, 
        error: 'Test validation error' 
      };
      const result = handleValidationError(validationResult, 'test context');
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('VALIDATION');
      expect(result?.message).toBe('Test validation error');
      expect(result?.context).toBe('test context');
    });

    it('should return null for invalid result without error message', () => {
      const result = handleValidationError({ isValid: false });
      expect(result).toBeNull();
    });
  });

  describe('isRecoverableError', () => {
    it('should return true for validation errors', () => {
      const error = createAppError('VALIDATION');
      expect(isRecoverableError(error)).toBe(true);
    });

    it('should return true for navigation errors', () => {
      const error = createAppError('NAVIGATION');
      expect(isRecoverableError(error)).toBe(true);
    });

    it('should return false for storage errors', () => {
      const error = createAppError('STORAGE');
      expect(isRecoverableError(error)).toBe(false);
    });

    it('should return false for game state errors', () => {
      const error = createAppError('GAME_STATE');
      expect(isRecoverableError(error)).toBe(false);
    });

    it('should return false for unknown errors', () => {
      const error = createAppError('UNKNOWN');
      expect(isRecoverableError(error)).toBe(false);
    });
  });

  describe('getRecoverySuggestion', () => {
    it('should return appropriate suggestion for validation errors', () => {
      const error = createAppError('VALIDATION');
      const suggestion = getRecoverySuggestion(error);
      expect(suggestion).toBe('Controlla i tuoi input e riprova.');
    });

    it('should return appropriate suggestion for storage errors', () => {
      const error = createAppError('STORAGE');
      const suggestion = getRecoverySuggestion(error);
      expect(suggestion).toBe('Riavvia l\'app o libera spazio sul dispositivo.');
    });

    it('should return default suggestion for unknown errors', () => {
      const error = createAppError('UNKNOWN');
      const suggestion = getRecoverySuggestion(error);
      expect(suggestion).toBe('Riavvia l\'app se il problema persiste.');
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should remove Error: prefix', () => {
      const message = 'Error: Something went wrong';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toBe('Something went wrong');
    });

    it('should remove stack trace lines', () => {
      const message = 'Something went wrong\nat Function.test (file.js:10:5)';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toBe('Something went wrong');
    });

    it('should normalize whitespace', () => {
      const message = 'Something   went    wrong';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toBe('Something went wrong');
    });

    it('should handle empty message', () => {
      const sanitized = sanitizeErrorMessage('');
      expect(sanitized).toBe('');
    });
  });
});