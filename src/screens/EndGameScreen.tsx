import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { MissionState, getWinner } from '../models';
import { Button } from '../components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/constants';

const EndGameScreen: React.FC = () => {
  const router = useRouter();
  const { gameState } = useGameContext();
  const { createGame } = useGameActions();

  // Get winner and game statistics
  const winner = getWinner(gameState.players, gameState.targetCompleted);
  
  const gameStats = {
    totalPlayers: gameState.players.length,
    completedMissions: gameState.players.reduce((sum, player) => sum + player.completedCount, 0),
    caughtMissions: gameState.players.filter(player => player.missionState === MissionState.CAUGHT).length,
    activeMissions: gameState.players.filter(player => player.missionState === MissionState.ACTIVE).length,
    gameDuration: gameState.createdAt ? 
      Math.round((new Date().getTime() - new Date(gameState.createdAt).getTime()) / (1000 * 60)) : 0
  };

  const handleNewGame = () => {
    Alert.alert(
      'Nuova Partita',
      'Vuoi iniziare una nuova partita? Tutti i giocatori e i progressi verranno cancellati.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Nuova Partita',
          style: 'destructive',
          onPress: () => {
            createGame();
            router.push('/setup-players');
          },
        },
      ]
    );
  };

  const handleBackToHome = () => {
    // Clear the finished game data when going back to home
    createGame();
    router.push('/');
  };

  const getMissionStateText = (state: MissionState): string => {
    switch (state) {
      case MissionState.WAITING:
        return 'In Attesa';
      case MissionState.ACTIVE:
        return 'Attiva';
      case MissionState.COMPLETED:
        return 'Completata';
      case MissionState.CAUGHT:
        return 'Scoperta';
      default:
        return 'Sconosciuto';
    }
  };

  const getMissionStateColor = (state: MissionState): string => {
    switch (state) {
      case MissionState.WAITING:
        return Colors.missionWaiting;
      case MissionState.ACTIVE:
        return Colors.missionActive;
      case MissionState.COMPLETED:
        return Colors.missionCompleted;
      case MissionState.CAUGHT:
        return Colors.missionCaught;
      default:
        return Colors.missionWaiting;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Winner Announcement */}
        <View style={styles.winnerSection}>
          {winner ? (
            <>
              <Text style={styles.winnerTitle}>Partita Completata</Text>
              <Text style={styles.winnerName}>{winner.name}</Text>
              <Text style={styles.winnerSubtext}>Vincitore</Text>
              <View style={styles.winnerStats}>
                <Text style={styles.winnerStatsText}>
                  {winner.completedCount} di {gameState.targetCompleted} missioni completate
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.winnerTitle}>Partita Terminata</Text>
              <Text style={styles.noWinnerSubtext}>
                La partita è stata terminata senza vincitore
              </Text>
            </>
          )}
        </View>

        {/* Game Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiche</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{gameStats.totalPlayers}</Text>
              <Text style={styles.statLabel}>Giocatori</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{gameStats.completedMissions}</Text>
              <Text style={styles.statLabel}>Completate</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{gameStats.caughtMissions}</Text>
              <Text style={styles.statLabel}>Scoperte</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{gameStats.gameDuration}</Text>
              <Text style={styles.statLabel}>Minuti</Text>
            </View>
          </View>
        </View>

        {/* Player Results */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>Classifica</Text>
          
          {gameState.players
            .sort((a, b) => b.completedCount - a.completedCount)
            .map((player, index) => (
              <View key={player.id} style={styles.playerResultCard}>
                <View style={styles.playerResultHeader}>
                  <View style={styles.playerRank}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerResultName}>{player.name}</Text>
                    {winner && winner.id === player.id && (
                      <View style={styles.winnerBadge}>
                        <Text style={styles.winnerBadgeText}>Vincitore</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.playerResultStats}>
                  <View style={styles.playerStat}>
                    <Text style={styles.playerStatLabel}>Missioni completate</Text>
                    <Text style={styles.playerStatValue}>{player.completedCount}</Text>
                  </View>
                  
                  <View style={styles.playerStat}>
                    <Text style={styles.playerStatLabel}>Stato finale</Text>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: getMissionStateColor(player.missionState) }
                    ]}>
                      <Text style={styles.statusText}>
                        {getMissionStateText(player.missionState)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Nuova Partita"
            onPress={handleNewGame}
            variant="primary"
            size="large"
            style={styles.primaryButton}
          />
          
          <Button
            title="Torna alla Home"
            onPress={handleBackToHome}
            variant="secondary"
            size="large"
            style={styles.secondaryButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  
  // Winner Section
  winnerSection: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    ...Shadows.medium,
  },
  winnerTitle: {
    ...Typography.title2,
    color: Colors.secondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  winnerName: {
    ...Typography.title1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  winnerSubtext: {
    ...Typography.headline,
    color: Colors.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  winnerStats: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
  },
  winnerStatsText: {
    ...Typography.callout,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  noWinnerSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Section Titles
  sectionTitle: {
    ...Typography.title2,
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  
  // Statistics Section
  statsSection: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  statCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    alignItems: 'center',
    width: '48%',
    minWidth: 120,
  },
  statNumber: {
    ...Typography.title1,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Players Section
  playersSection: {
    marginBottom: Spacing.lg,
  },
  playerResultCard: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  playerResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  playerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rankNumber: {
    ...Typography.footnote,
    fontWeight: 'bold',
    color: Colors.backgroundPrimary,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerResultName: {
    ...Typography.headline,
    color: Colors.textPrimary,
  },
  winnerBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
  },
  winnerBadgeText: {
    ...Typography.caption,
    color: Colors.backgroundPrimary,
    fontWeight: '600',
  },
  playerResultStats: {
    gap: Spacing.sm,
  },
  playerStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerStatLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  playerStatValue: {
    ...Typography.subhead,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.backgroundPrimary,
    fontWeight: '500',
  },
  
  // Action Buttons
  actionButtons: {
    gap: Spacing.md,
  },
  primaryButton: {
    marginBottom: Spacing.sm,
  },
  secondaryButton: {
    // Additional styling if needed
  },
});

export default EndGameScreen;