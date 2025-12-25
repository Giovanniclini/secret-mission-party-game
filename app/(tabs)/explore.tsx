import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext } from '@/src/store/GameContext';
import { GameStatus } from '@/src/models';
import GameDashboardScreen from '@/src/screens/GameDashboardScreen';
import { Colors, Typography, Spacing } from '@/src/theme/constants';
import { Button } from '@/src/components/ui/Button';

export default function CurrentGameTab() {
  const { gameState } = useGameContext();
  const router = useRouter();

  // If no active game, show message to start one
  if (gameState.status === GameStatus.SETUP) {
    return (
      <View style={styles.noGameContainer}>
        <Text style={styles.noGameTitle}>Nessuna Partita Attiva</Text>
        <Text style={styles.noGameSubtitle}>
          Inizia una nuova partita dalla schermata Home
        </Text>
        <Button
          title="Vai alla Home"
          onPress={() => router.push('/')}
          variant="primary"
          style={styles.homeButton}
        />
      </View>
    );
  }

  // Show the game dashboard for active games
  return <GameDashboardScreen />;
}

const styles = StyleSheet.create({
  noGameContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noGameTitle: {
    ...Typography.title1,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  noGameSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  homeButton: {
    minWidth: 200,
  },
});
