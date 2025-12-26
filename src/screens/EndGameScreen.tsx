import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Alert,
  StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { 
  MissionState, 
  determineWinner, 
  calculateAverageCompletionTime,
  DifficultyLevel 
} from '../models';
import { Button } from '../components/ui/Button';
import { useTheme } from '../theme';

const EndGameScreen: React.FC = () => {
  const router = useRouter();
  const { gameState } = useGameContext();
  const { createGame } = useGameActions();
  const theme = useTheme();

  const styles = createStyles(theme);

  // Get winner using the new multi-mission scoring system
  const winner = determineWinner(gameState.players);
  
  // Calculate comprehensive game statistics
  const gameStats = {
    totalPlayers: gameState.players.length,
    totalMissionsAssigned: gameState.players.reduce((sum, player) => sum + player.missions.length, 0),
    totalMissionsCompleted: gameState.players.reduce((sum, player) => sum + player.completedMissions, 0),
    totalPointsAwarded: gameState.players.reduce((sum, player) => sum + player.totalPoints, 0),
    gameDurationMs: gameState.endedAt && gameState.createdAt ? 
      new Date(gameState.endedAt).getTime() - new Date(gameState.createdAt).getTime() : 
      Date.now() - new Date(gameState.createdAt).getTime(),
    averagePointsPerPlayer: gameState.players.length > 0 ? 
      gameState.players.reduce((sum, player) => sum + player.totalPoints, 0) / gameState.players.length : 0,
    fastestCompletionTime: Math.min(...gameState.players
      .flatMap(player => player.missions
        .filter(pm => pm.state === MissionState.COMPLETED && pm.completionTimeMs)
        .map(pm => pm.completionTimeMs!)
      ).filter(time => time > 0)) || 0,
    configuredMissionsPerPlayer: gameState.configuration.missionsPerPlayer,
    difficultyMode: gameState.configuration.difficultyMode
  };

  // Format time from milliseconds to readable format
  const formatTime = (timeMs: number): string => {
    if (timeMs === 0 || !isFinite(timeMs)) return '--';
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Format game duration
  const formatGameDuration = (durationMs: number): string => {
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  // Get difficulty display text in Italian
  const getDifficultyText = (difficulty: DifficultyLevel): string => {
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return 'Facile';
      case DifficultyLevel.MEDIUM:
        return 'Medio';
      case DifficultyLevel.HARD:
        return 'Difficile';
      default:
        return 'Sconosciuto';
    }
  };

  // Get performance highlights
  const getPerformanceHighlights = () => {
    const highlights: string[] = [];
    
    if (winner) {
      highlights.push(`${winner.name} ha vinto con ${winner.totalPoints} punti`);
    }
    
    if (gameStats.fastestCompletionTime > 0) {
      highlights.push(`Missione più veloce: ${formatTime(gameStats.fastestCompletionTime)}`);
    }
    
    const perfectPlayers = gameState.players.filter(p => 
      p.completedMissions === gameStats.configuredMissionsPerPlayer
    );
    if (perfectPlayers.length > 0) {
      highlights.push(`${perfectPlayers.length} giocator${perfectPlayers.length === 1 ? 'e ha' : 'i hanno'} completato tutte le missioni`);
    }
    
    return highlights;
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
            router.push('/game-configuration');
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

  const getMissionStateColor = (state: MissionState): string => {
    switch (state) {
      case MissionState.WAITING:
        return theme.colors.missionWaiting;
      case MissionState.ACTIVE:
        return theme.colors.missionActive;
      case MissionState.COMPLETED:
        return theme.colors.missionCompleted;
      case MissionState.CAUGHT:
        return theme.colors.missionCaught;
      default:
        return theme.colors.missionWaiting;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.backgroundSecondary} barStyle="dark-content" />
      
      {/* Scrollable Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Winner Announcement */}
        <View style={styles.winnerSection}>
          {winner ? (
            <>
              <Text style={styles.winnerTitle}>🏆 Partita Completata</Text>
              <Text style={styles.winnerName}>{winner.name}</Text>
              <Text style={styles.winnerSubtext}>Vincitore</Text>
              <View style={styles.winnerStats}>
                <Text style={styles.winnerStatsText}>
                  {winner.totalPoints} punti • {winner.completedMissions} missioni completate
                </Text>
                <Text style={styles.winnerStatsText}>
                  Tempo medio: {formatTime(calculateAverageCompletionTime(winner))}
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
          <Text style={styles.sectionTitle}>Statistiche della Partita</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{gameStats.totalPlayers}</Text>
              <Text style={styles.statLabel}>Giocatori</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{gameStats.totalMissionsCompleted}</Text>
              <Text style={styles.statLabel}>Completate</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{gameStats.totalPointsAwarded}</Text>
              <Text style={styles.statLabel}>Punti Totali</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{formatGameDuration(gameStats.gameDurationMs)}</Text>
              <Text style={styles.statLabel}>Durata</Text>
            </View>
          </View>

          {/* Performance Highlights */}
          {getPerformanceHighlights().length > 0 && (
            <View style={styles.highlightsSection}>
              <Text style={styles.highlightsTitle}>Momenti Salienti</Text>
              {getPerformanceHighlights().map((highlight, index) => (
                <View key={index} style={styles.highlightItem}>
                  <Text style={styles.highlightText}>• {highlight}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Final Leaderboard */}
        <View style={styles.leaderboardSection}>
          <Text style={styles.sectionTitle}>Classifica Finale</Text>
          
          {gameState.players
            .sort((a, b) => {
              // Sort by total points (descending), then by average completion time (ascending)
              if (a.totalPoints !== b.totalPoints) {
                return b.totalPoints - a.totalPoints;
              }
              const avgTimeA = calculateAverageCompletionTime(a);
              const avgTimeB = calculateAverageCompletionTime(b);
              return avgTimeA - avgTimeB;
            })
            .map((player, index) => {
              const avgCompletionTime = calculateAverageCompletionTime(player);
              const isWinner = winner && winner.id === player.id;
              
              return (
                <View key={player.id} style={[
                  styles.playerResultCard,
                  isWinner && styles.winnerCard
                ]}>
                  <View style={styles.playerResultHeader}>
                    <View style={[
                      styles.playerRank,
                      isWinner && styles.winnerRank
                    ]}>
                      <Text style={[
                        styles.rankNumber,
                        isWinner && styles.winnerRankText
                      ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerResultName}>{player.name}</Text>
                      {isWinner && (
                        <View style={styles.winnerBadge}>
                          <Text style={styles.winnerBadgeText}>👑 Vincitore</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.playerResultStats}>
                    <View style={styles.playerStat}>
                      <Text style={styles.playerStatLabel}>Punti Totali</Text>
                      <Text style={styles.playerStatValue}>{player.totalPoints}</Text>
                    </View>
                    
                    <View style={styles.playerStat}>
                      <Text style={styles.playerStatLabel}>Missioni Completate</Text>
                      <Text style={styles.playerStatValue}>
                        {player.completedMissions}/{gameStats.configuredMissionsPerPlayer}
                      </Text>
                    </View>
                    
                    <View style={styles.playerStat}>
                      <Text style={styles.playerStatLabel}>Tempo Medio</Text>
                      <Text style={styles.playerStatValue}>
                        {formatTime(avgCompletionTime)}
                      </Text>
                    </View>

                    {/* Mission breakdown */}
                    {player.missions.length > 0 && (
                      <View style={styles.missionBreakdown}>
                        <Text style={styles.missionBreakdownTitle}>Dettaglio Missioni:</Text>
                        {player.missions.map((playerMission, missionIndex) => (
                          <View key={missionIndex} style={styles.missionItem}>
                            <View style={[
                              styles.missionDot,
                              { backgroundColor: getMissionStateColor(playerMission.state) }
                            ]} />
                            <Text style={styles.missionText}>
                              {getDifficultyText(playerMission.mission.difficulty)} ({playerMission.mission.points}pt)
                              {playerMission.state === MissionState.COMPLETED && playerMission.completionTimeMs && 
                                ` - ${formatTime(playerMission.completionTimeMs)}`
                              }
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
        </View>
      </ScrollView>

      {/* Fixed Action Buttons */}
      <View style={styles.fixedButtonContainer}>
        <Button
          title="Nuova Partita"
          onPress={handleNewGame}
          variant="primary"
          size="medium"
          style={styles.primaryButton}
        />
        
        <Button
          title="Torna alla Home"
          onPress={handleBackToHome}
          variant="secondary"
          size="medium"
          style={styles.secondaryButton}
        />
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg, // Reduced since buttons are now fixed
  },
  
  // Winner Section
  winnerSection: {
    backgroundColor: theme.colors.backgroundPrimary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  winnerTitle: {
    ...theme.typography.title2,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  winnerName: {
    ...theme.typography.title1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  winnerSubtext: {
    ...theme.typography.headline,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  winnerStats: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  winnerStatsText: {
    ...theme.typography.callout,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  noWinnerSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  // Section Titles
  sectionTitle: {
    ...theme.typography.title2,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.md,
  },
  
  // Statistics Section
  statsSection: {
    backgroundColor: theme.colors.backgroundPrimary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    alignItems: 'center',
    width: '48%',
    minWidth: 120,
  },
  statNumber: {
    ...theme.typography.title1,
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Performance Highlights
  highlightsSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backgroundSecondary,
  },
  highlightsTitle: {
    ...theme.typography.headline,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
  },
  highlightItem: {
    marginBottom: theme.spacing.xs,
  },
  highlightText: {
    ...theme.typography.subhead,
    color: theme.colors.textSecondary,
  },
  
  // Leaderboard Section
  leaderboardSection: {
    marginBottom: theme.spacing.lg,
  },
  playerResultCard: {
    backgroundColor: theme.colors.backgroundPrimary,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  winnerCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  playerResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  playerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  winnerRank: {
    backgroundColor: theme.colors.primary,
  },
  rankNumber: {
    ...theme.typography.footnote,
    fontWeight: 'bold',
    color: theme.colors.backgroundPrimary,
  },
  winnerRankText: {
    color: theme.colors.backgroundPrimary,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerResultName: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary,
  },
  winnerBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  winnerBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.backgroundPrimary,
    fontWeight: '600',
  },
  playerResultStats: {
    gap: theme.spacing.sm,
  },
  playerStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerStatLabel: {
    ...theme.typography.subhead,
    color: theme.colors.textSecondary,
  },
  playerStatValue: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  
  // Mission Breakdown
  missionBreakdown: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backgroundSecondary,
  },
  missionBreakdownTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  missionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  missionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  missionText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  
  // Legacy status badge (kept for compatibility)
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.backgroundPrimary,
    fontWeight: '500',
  },
  
  // Fixed Action Buttons Container
  fixedButtonContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  primaryButton: {
    // Additional styling if needed
  },
  secondaryButton: {
    // Additional styling if needed
  },
});

export default EndGameScreen;