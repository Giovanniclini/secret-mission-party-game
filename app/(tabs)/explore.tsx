import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext } from '@/src/store/GameContext';
import { GameStatus } from '@/src/models';
import GameDashboardScreen from '@/src/screens/GameDashboardScreen';
import { useTheme } from '@/src/theme';
import { Button } from '@/src/components/ui/Button';

export default function CurrentGameTab() {
  const { gameState } = useGameContext();
  const router = useRouter();
  const theme = useTheme();

  const styles = createStyles(theme);

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

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  noGameContainer: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  noGameTitle: {
    ...theme.typography.title1,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  noGameSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  homeButton: {
    minWidth: 200,
  },
});
