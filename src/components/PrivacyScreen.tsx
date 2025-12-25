import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { useTheme } from '../theme';

interface PrivacyScreenProps {
  playerName: string;
  onContinue: () => void;
  onCancel?: () => void;
  message?: string;
}

const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ 
  playerName, 
  onContinue, 
  onCancel,
  message 
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔒 Schermo Privacy</Text>
        
        <Text style={styles.playerName}>
          Turno di: {playerName}
        </Text>
        
        <Text style={styles.message}>
          {message || 'Assicurati che solo tu possa vedere lo schermo prima di continuare.'}
        </Text>
        
        <Text style={styles.instruction}>
          Gli altri giocatori non devono guardare!
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
          >
            <Text style={styles.continueButtonText}>
              Sono Pronto/a
            </Text>
          </TouchableOpacity>
          
          {onCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>
                Annulla
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    ...theme.typography.title2,
    color: theme.colors.backgroundPrimary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  playerName: {
    ...theme.typography.title1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.backgroundPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 24,
  },
  instruction: {
    ...theme.typography.callout,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    fontWeight: '600',
  },
  buttonContainer: {
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  continueButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.small,
    minWidth: 200,
  },
  continueButtonText: {
    ...theme.typography.headline,
    color: theme.colors.backgroundPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
    borderWidth: 2,
    borderColor: theme.colors.backgroundPrimary,
    minWidth: 200,
  },
  cancelButtonText: {
    ...theme.typography.callout,
    color: theme.colors.backgroundPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PrivacyScreen;