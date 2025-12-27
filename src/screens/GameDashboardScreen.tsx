import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ScrollView,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { GameStatus, MissionState, Player } from '../models';
import { useTheme } from '../theme';
import { StatusIndicator, StatusType } from '../components/ui/StatusIndicator';

const GameDashboardScreen: React.FC = () => {
  const router = useRouter();
  const { gameState } = useGameContext();
  const { updateGameStatus } = useGameActions();
  const theme = useTheme();

  const styles = createStyles(theme);

  const handleMyTurn = () => {
    router.push('/my-turn' as any);
  };

  const handleEndGame = () => {
    updateGameStatus(GameStatus.FINISHED);
    router.push('/end-game' as any);
  };

  const getMissionStateStatus = (state: MissionState): StatusType => {
    switch (state) {
      case MissionState.WAITING:
        return 'waiting';
      case MissionState.ACTIVE:
        return 'active';
      case MissionState.COMPLETED:
        return 'completed';
      case MissionState.CAUGHT:
        return 'caught';
      default:
        return 'waiting';
    }
  };

  const calculateAverageCompletionTime = (player: Player): number => {
    const completedMissions = player.missions.filter(
      pm => pm.state === MissionState.COMPLETED && pm.completionTimeMs !== undefined
    );
    
    if (completedMissions.length === 0) {
      return 0;
    }
    
    const totalTime = completedMissions.reduce(
      (sum, pm) => sum + (pm.completionTimeMs || 0),
      0
    );
    
    return totalTime / completedMissions.length;
  };

  const formatTime = (timeMs: number): string => {
    if (timeMs === 0) return '--';
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getOverallGameProgress = () => {
    const totalPlayers = gameState.players.length;
    const totalMissionsNeeded = totalPlayers * gameState.configuration.missionsPerPlayer;
    const totalMissionsCompleted = gameState.players.reduce(
      (sum, player) => sum + player.completedMissions, 0
    );
    
    return {
      totalPlayers,
      totalMissionsNeeded,
      totalMissionsCompleted,
      percentage: totalMissionsNeeded > 0 ? (totalMissionsCompleted / totalMissionsNeeded) * 100 : 0
    };
  };

  const getSortedPlayersByRanking = (): Player[] => {
    return [...gameState.players].sort((a, b) => {
      // Primary: highest total points
      if (a.totalPoints !== b.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      
      // Tiebreaker: fastest average completion time
      const avgTimeA = calculateAverageCompletionTime(a);
      const avgTimeB = calculateAverageCompletionTime(b);
      
      if (avgTimeA === 0 && avgTimeB === 0) return 0;
      if (avgTimeA === 0) return 1; // Players with no completed missions rank lower
      if (avgTimeB === 0) return -1;
      
      return avgTimeA - avgTimeB;
    });
  };

  const progress = getOverallGameProgress();
  const rankedPlayers = getSortedPlayersByRanking();

  const renderPlayerCard = ({ item: player, index }: { item: Player; index: number }) => {
    const remainingMissions = player.missions.filter(pm => pm.state === MissionState.ACTIVE).length;
    const discoveredMissions = player.missions.filter(pm => pm.state === MissionState.CAUGHT).length;
    const avgCompletionTime = calculateAverageCompletionTime(player);
    const currentMission = player.missions.find(pm => pm.state === MissionState.ACTIVE);
    
    return (
      <View style={styles.playerCard}>
        <View style={styles.playerHeader}>
          <View style={styles.playerRankAndName}>
            <View style={[styles.rankBadge, { backgroundColor: index === 0 ? theme.colors.primary : theme.colors.textSecondary }]}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <Text style={styles.playerName}>{player.name}</Text>
          </View>
          <Text style={styles.playerPoints}>{player.totalPoints} pt</Text>
        </View>
        
        <View style={styles.playerProgress}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Missioni completate:</Text>
            <Text style={styles.progressValue}>
              {player.completedMissions}/{player.targetMissionCount}
            </Text>
          </View>
          
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Missioni scoperte:</Text>
            <Text style={styles.progressValue}>
              {discoveredMissions}/{player.targetMissionCount}
            </Text>
          </View>
          
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Missioni rimanenti:</Text>
            <Text style={styles.progressValue}>{remainingMissions}</Text>
          </View>
          
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Tempo medio:</Text>
            <Text style={styles.progressValue}>{formatTime(avgCompletionTime)}</Text>
          </View>
        </View>
        
        {currentMission && (
          <View style={styles.currentMissionStatus}>
            <StatusIndicator 
              status={getMissionStateStatus(currentMission.state)}
              size="small"
              showLabel={true}
            />
            <Text style={styles.currentMissionText}>Missione in corso</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.backgroundPrimary} />
      
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <Text style={styles.title}>Dashboard di Gioco</Text>
        <Text style={styles.subtitle}>
          Monitora il progresso della partita
        </Text>
      </View>

      {/* Fixed Overall Game Progress */}
      <View style={styles.overallProgressCard}>
        <Text style={styles.cardTitle}>Progresso Generale</Text>
        
        <View style={styles.progressStatsRow}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatNumber}>{progress.totalMissionsCompleted}</Text>
            <Text style={styles.progressStatLabel}>Completate</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatNumber}>{progress.totalMissionsNeeded}</Text>
            <Text style={styles.progressStatLabel}>Totali</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatNumber}>{Math.round(progress.percentage)}%</Text>
            <Text style={styles.progressStatLabel}>Completamento</Text>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${Math.min(100, progress.percentage)}%` }
            ]} 
          />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Leaderboard */}
        <View style={styles.leaderboardCard}>
          <Text style={styles.cardTitle}>Classifica Attuale</Text>
          
          <FlatList
            data={rankedPlayers}
            renderItem={renderPlayerCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>

      {/* Fixed Action Buttons */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={styles.myTurnButton}
          onPress={handleMyTurn}
          activeOpacity={0.8}
        >
          <Text style={styles.myTurnButtonText}>Vedi o aggiorna status missioni</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.endGameButton}
          onPress={handleEndGame}
          activeOpacity={0.8}
        >
          <Text style={styles.endGameButtonText}>Termina Partita</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  fixedHeader: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl + theme.spacing.lg, // More padding from top
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: theme.spacing.sm, // Reduced padding to bring content closer to tab navigation
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  // Overall Progress Card (Fixed)
  overallProgressCard: {
    backgroundColor: theme.colors.backgroundPrimary,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    ...theme.shadows.medium,
  },
  cardTitle: {
    ...theme.typography.subhead,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatNumber: {
    ...theme.typography.headline,
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs / 2,
  },
  progressStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 11,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 3,
  },
  
  // Leaderboard Card (Scrollable)
  leaderboardCard: {
    backgroundColor: theme.colors.backgroundPrimary,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm, // Reduced bottom margin
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  
  // Player Cards
  playerCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  playerRankAndName: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rankText: {
    ...theme.typography.footnote,
    color: theme.colors.backgroundPrimary,
    fontWeight: 'bold',
  },
  playerName: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  playerPoints: {
    ...theme.typography.headline,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  
  // Player Progress
  playerProgress: {
    marginBottom: theme.spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressLabel: {
    ...theme.typography.subhead,
    color: theme.colors.textSecondary,
  },
  progressValue: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  
  // Current Mission Status
  currentMissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backgroundSecondary,
  },
  currentMissionText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  
  // Fixed Action Buttons
  fixedButtonContainer: {
    padding: theme.spacing.md, // Reduced padding
    paddingTop: theme.spacing.sm, // Less space from content above
    backgroundColor: theme.colors.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backgroundSecondary,
    gap: theme.spacing.sm, // Reduced gap between buttons
  },
  myTurnButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  myTurnButtonText: {
    ...theme.typography.callout,
    color: theme.colors.backgroundPrimary,
    fontWeight: 'bold',
  },
  endGameButton: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    borderWidth: 2,
    borderColor: theme.colors.error,
    alignItems: 'center',
  },
  endGameButtonText: {
    ...theme.typography.subhead,
    color: theme.colors.error,
    fontWeight: '600',
  },
});

export default GameDashboardScreen;