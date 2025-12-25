import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';

interface SecureRevealProps {
  missionText: string;
  playerName: string;
  onRevealStart?: () => void;
  onRevealEnd?: () => void;
  hapticFeedback?: boolean;
}

const SecureReveal: React.FC<SecureRevealProps> = ({
  missionText,
  playerName,
  onRevealStart,
  onRevealEnd,
  hapticFeedback = true,
}) => {
  const theme = useTheme();
  const [isRevealed, setIsRevealed] = useState(false);

  const handlePressIn = useCallback(() => {
    setIsRevealed(true);
    onRevealStart?.();
    
    // Add haptic feedback on reveal
    if (hapticFeedback && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onRevealStart, hapticFeedback]);

  const handlePressOut = useCallback(() => {
    setIsRevealed(false);
    onRevealEnd?.();
    
    // Add haptic feedback on hide
    if (hapticFeedback && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onRevealEnd, hapticFeedback]);

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Mission Reveal Area */}
      <View style={styles.revealArea}>
        {!isRevealed ? (
          <View style={styles.hiddenState}>
            <Text style={styles.placeholder}>●●●●●●●●</Text>
            <Text style={styles.helperText}>Missione nascosta</Text>
          </View>
        ) : (
          <View style={styles.revealedState}>
            <Text style={styles.missionText}>{missionText}</Text>
          </View>
        )}
      </View>

      {/* Press & Hold Button */}
      <Pressable
        style={({ pressed }) => [
          styles.revealButton,
          pressed && styles.revealButtonPressed,
          isRevealed && styles.revealButtonActive
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={0} // Immediate response
      >
        <Text style={[
          styles.revealButtonText,
          isRevealed && styles.revealButtonTextActive
        ]}>
          {isRevealed ? 'Rilascia per nascondere' : 'Tieni premuto per rivelare'}
        </Text>
      </Pressable>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          • Tieni premuto il pulsante per vedere la missione
        </Text>
        <Text style={styles.instructionText}>
          • Rilascia per nascondere immediatamente
        </Text>
        <Text style={styles.instructionText}>
          • Assicurati che nessun altro stia guardando
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundPrimary,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  revealArea: {
    backgroundColor: theme.colors.backgroundPrimary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xxl, // Increased spacing
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.backgroundSecondary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hiddenState: {
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: theme.spacing.md,
  },
  helperText: {
    ...theme.typography.callout,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  revealedState: {
    alignItems: 'center',
  },
  missionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  revealButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.lg, // Reduced spacing between button and instructions
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  revealButtonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.05,
  },
  revealButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  revealButtonText: {
    ...theme.typography.headline,
    color: theme.colors.backgroundPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  revealButtonTextActive: {
    color: theme.colors.backgroundPrimary,
  },
  instructions: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
  },
  instructionText: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
});

export default SecureReveal;