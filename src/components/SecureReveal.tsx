import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/constants';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  revealArea: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl, // Increased spacing
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.backgroundSecondary,
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
    color: Colors.textSecondary,
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  helperText: {
    ...Typography.callout,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  revealedState: {
    alignItems: 'center',
  },
  missionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  revealButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    marginBottom: Spacing.xxl, // Increased spacing between button and instructions
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
    backgroundColor: Colors.accent,
  },
  revealButtonText: {
    ...Typography.headline,
    color: Colors.backgroundPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  revealButtonTextActive: {
    color: Colors.backgroundPrimary,
  },
  instructions: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
  },
  instructionText: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
});

export default SecureReveal;