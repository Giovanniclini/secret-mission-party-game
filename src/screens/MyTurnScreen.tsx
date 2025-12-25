import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { 
  Player, 
  MissionState, 
  DifficultyLevel, 
  canGameEnd,
  getDifficultyPoints
} from '../models';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorNotification } from '../components/ErrorNotification';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { useTheme } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

const MyTurnScreen: React.FC = () => {
  const router = useRouter();
  const { gameState } = useGameContext();
  const { completeMissionWithTiming } = useGameActions();
  const { error, clearError, handleAsyncError } = useErrorHandler();
  const theme = useTheme();
  
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedMissionIndex, setSelectedMissionIndex] = useState(0);
  const [showMissions, setShowMissions] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const styles = createStyles(theme);

  // Get players who have active missions (no longer assign new missions here)
  const eligiblePlayers = gameState.players.filter(player => {
    const activeMissions = player.missions.filter(pm => pm.state === MissionState.ACTIVE);
    return activeMissions.length > 0;
  });



  const handlePlayerSelect = async (player: Player) => {
    await handleAsyncError(async () => {
      setSelectedPlayer(player);
      
      // Check if player has active missions
      const activeMissions = player.missions.filter(pm => pm.state === MissionState.ACTIVE);
      
      if (activeMissions.length > 0) {
        // Player has active missions, show all missions
        setSelectedMissionIndex(0);
        setShowMissions(true);
      } else {
        // Player has no active missions
        Alert.alert(
          'Nessuna Missione Attiva',
          `${player.name} non ha missioni attive al momento.`,
          [{ text: 'OK' }]
        );
      }
    }, 'Errore durante la selezione del giocatore.');
  };



  const handleMissionComplete = async (missionIndex: number) => {
    if (!selectedPlayer) return;

    const activeMissions = selectedPlayer.missions.filter(pm => pm.state === MissionState.ACTIVE);
    const selectedMission = activeMissions[missionIndex];
    
    if (!selectedMission) return;

    await handleAsyncError(async () => {
      const completedAt = new Date();
      completeMissionWithTiming(
        selectedPlayer.id, 
        selectedMission.mission.id, 
        MissionState.COMPLETED, 
        completedAt
      );
      
      const pointsEarned = getDifficultyPoints(selectedMission.mission.difficulty);
      
      Alert.alert(
        'Missione Completata! ✅',
        `${selectedPlayer.name} ha completato la missione e guadagnato ${pointsEarned} punt${pointsEarned > 1 ? 'i' : 'o'}!`,
        [
          {
            text: 'OK',
            onPress: async () => {
              setShowMissions(false);
              setSelectedPlayer(null);
              setSelectedMissionIndex(0);
              
              // Check if game can end
              if (canGameEnd(gameState.players)) {
                Alert.alert(
                  'Gioco Completabile',
                  'Almeno un giocatore ha completato tutte le sue missioni. Il game master può terminare il gioco dalla Dashboard.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    }, 'Errore durante il completamento della missione.');
  };

  const handleMissionCaught = async (missionIndex: number) => {
    if (!selectedPlayer) return;

    const activeMissions = selectedPlayer.missions.filter(pm => pm.state === MissionState.ACTIVE);
    const selectedMission = activeMissions[missionIndex];
    
    if (!selectedMission) return;

    await handleAsyncError(async () => {
      const completedAt = new Date();
      completeMissionWithTiming(
        selectedPlayer.id, 
        selectedMission.mission.id, 
        MissionState.CAUGHT, 
        completedAt
      );
      
      Alert.alert(
        'Missione Scoperta! ❌',
        `${selectedPlayer.name} è stato scoperto. Nessun punto guadagnato.`,
        [
          {
            text: 'OK',
            onPress: async () => {
              setShowMissions(false);
              setSelectedPlayer(null);
              setSelectedMissionIndex(0);
            }
          }
        ]
      );
    }, 'Errore durante la marcatura della missione come scoperta.');
  };

  const handleBackToDashboard = async () => {
    await handleAsyncError(async () => {
      router.push('/(tabs)/explore');
    }, 'Errore durante il ritorno alla dashboard.');
  };

  const getDifficultyColor = (difficulty: DifficultyLevel): string => {
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return theme.colors.missionCompleted; // Green
      case DifficultyLevel.MEDIUM:
        return theme.colors.primary; // Gold
      case DifficultyLevel.HARD:
        return theme.colors.missionCaught; // Red
      default:
        return theme.colors.textSecondary;
    }
  };

  const getDifficultyLabel = (difficulty: DifficultyLevel): string => {
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

  const renderPlayerItem = ({ item: player }: { item: Player }) => {
    const activeMissions = player.missions.filter(pm => pm.state === MissionState.ACTIVE);
    const completedMissions = player.completedMissions;

    return (
      <TouchableOpacity
        style={styles.playerCard}
        onPress={() => handlePlayerSelect(player)}
        activeOpacity={0.7}
      >
        <View style={styles.playerHeader}>
          <Text style={styles.playerName}>{player.name}</Text>
          <View style={styles.playerStats}>
            <Text style={styles.pointsText}>{player.totalPoints} punt{player.totalPoints !== 1 ? 'i' : 'o'}</Text>
          </View>
        </View>
        
        <View style={styles.missionProgress}>
          <Text style={styles.progressText}>
            Completate: {completedMissions} / {player.targetMissionCount}
          </Text>
          <Text style={styles.activeMissionText}>
            {activeMissions.length} mission{activeMissions.length > 1 ? 'i' : 'e'} attiv{activeMissions.length > 1 ? 'e' : 'a'}
          </Text>
        </View>
        
        <View style={styles.selectIndicator}>
          <Text style={styles.selectText}>
            Tocca per vedere mission{activeMissions.length > 1 ? 'i' : 'e'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (eligiblePlayers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Nessun Giocatore Disponibile</Text>
            <Text style={styles.emptyStateText}>
              Tutti i giocatori hanno completato le loro missioni o non ci sono missioni attive.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleBackToDashboard}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Torna alla Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ErrorNotification
        message={error.message}
        visible={error.visible}
        onDismiss={clearError}
        type={error.type}
      />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Il Mio Turno</Text>
          <Text style={styles.subtitle}>
            Seleziona un giocatore per vedere o assegnare una missione
          </Text>
        </View>

        {/* Players List */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>
            Giocatori Disponibili ({eligiblePlayers.length})
          </Text>
          
          <FlatList
            data={eligiblePlayers}
            renderItem={renderPlayerItem}
            keyExtractor={(item) => item.id}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.playersListContent}
          />
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleBackToDashboard}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>← Torna alla Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Mission Reveal Screen with Swipeable Cards */}
      {showMissions && selectedPlayer && (
        <View style={styles.missionOverlay}>
          <SafeAreaView style={styles.missionContainer}>
            {(() => {
              const activeMissions = selectedPlayer.missions.filter(pm => pm.state === MissionState.ACTIVE);
              
              if (activeMissions.length === 0) {
                return (
                  <View style={styles.noMissionsContainer}>
                    <Text style={styles.noMissionsText}>Nessuna missione attiva</Text>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowMissions(false);
                        setSelectedPlayer(null);
                        setSelectedMissionIndex(0);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelButtonText}>← Torna alla Lista</Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <>
                  {/* Fixed Header */}
                  <View style={styles.missionHeader}>
                    <Text style={styles.missionPlayerName}>{selectedPlayer.name}</Text>
                    <Text style={styles.missionCountText}>
                      Missione {selectedMissionIndex + 1} di {activeMissions.length}
                    </Text>
                    {activeMissions.length > 1 && (
                      <Text style={styles.swipeHint}>
                        Scorri per vedere le altre missioni
                      </Text>
                    )}
                  </View>

                  {/* Fixed Reveal Button - Above action buttons */}
                  <View style={styles.fixedRevealButton}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.revealButton,
                        pressed && styles.revealButtonPressed,
                        isRevealed && styles.revealButtonActive
                      ]}
                      onPressIn={() => setIsRevealed(true)}
                      onPressOut={() => setIsRevealed(false)}
                      delayLongPress={0}
                    >
                      <Text style={[
                        styles.revealButtonText,
                        isRevealed && styles.revealButtonTextActive
                      ]}>
                        {isRevealed ? 'Rilascia per nascondere' : 'Tieni premuto per rivelare'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Scrollable Mission Cards - Only content */}
                  <View style={styles.scrollableSection}>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(event) => {
                        const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                        setSelectedMissionIndex(newIndex);
                      }}
                      style={styles.missionScrollView}
                      contentContainerStyle={styles.scrollViewContent}
                    >
                      {activeMissions.map((playerMission, index) => (
                        <View key={playerMission.mission.id} style={styles.missionCard}>
                          {/* Mission Difficulty Info */}
                          <View style={styles.missionInfo}>
                            <Text style={[
                              styles.missionDifficulty,
                              { color: getDifficultyColor(playerMission.mission.difficulty) }
                            ]}>
                              {getDifficultyLabel(playerMission.mission.difficulty)} - {playerMission.mission.points} punt{playerMission.mission.points > 1 ? 'i' : 'o'}
                            </Text>
                          </View>

                          {/* Mission Content Area - shows/hides based on reveal state */}
                          <View style={styles.missionContentArea}>
                            {!isRevealed ? (
                              <View style={styles.hiddenMissionContent}>
                                <Text style={styles.missionPreviewText}>●●●●●●●●</Text>
                                <Text style={styles.missionPreviewLabel}>Missione nascosta</Text>
                              </View>
                            ) : (
                              <View style={styles.revealedMissionContent}>
                                <Text style={styles.missionText}>
                                  {index === selectedMissionIndex ? playerMission.mission.text : '●●●●●●●●'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Pagination Dots */}
                  {activeMissions.length > 1 && (
                    <View style={styles.paginationContainer}>
                      {activeMissions.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.paginationDot,
                            index === selectedMissionIndex && styles.paginationDotActive
                          ]}
                        />
                      ))}
                    </View>
                  )}

                  {/* Fixed Action Buttons */}
                  <View style={styles.fixedMissionActions}>
                    <TouchableOpacity
                      style={styles.completedButton}
                      onPress={() => handleMissionComplete(selectedMissionIndex)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.completedButtonText}>Completata</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.caughtButton}
                      onPress={() => handleMissionCaught(selectedMissionIndex)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.caughtButtonText}>Scoperta</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Cancel Button */}
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowMissions(false);
                      setSelectedPlayer(null);
                      setSelectedMissionIndex(0);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>← Torna alla Lista</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundPrimary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.callout,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  playersSection: {
    flex: 1,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.headline,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.md,
  },
  playersList: {
    flex: 1,
  },
  playersListContent: {
    paddingBottom: theme.spacing.md,
  },
  playerCard: {
    backgroundColor: theme.colors.backgroundPrimary,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: theme.colors.backgroundSecondary,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  playerName: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  playerStats: {
    alignItems: 'flex-end',
  },
  pointsText: {
    ...theme.typography.subhead,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  missionProgress: {
    marginBottom: theme.spacing.sm,
  },
  progressText: {
    ...theme.typography.subhead,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  activeMissionText: {
    ...theme.typography.footnote,
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs,
  },
  newMissionText: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  selectIndicator: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  selectText: {
    ...theme.typography.footnote,
    color: theme.colors.accent,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  primaryButtonText: {
    ...theme.typography.headline,
    color: theme.colors.backgroundPrimary,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.colors.backgroundPrimary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
  },
  secondaryButtonText: {
    ...theme.typography.headline,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyStateTitle: {
    ...theme.typography.title2,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  // Mission overlay styles
  missionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.backgroundPrimary,
    zIndex: 1000,
  },
  missionContainer: {
    flex: 1,
  },
  missionHeader: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundPrimary,
  },
  missionPlayerName: {
    ...theme.typography.title2,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
  },
  missionCountText: {
    ...theme.typography.headline,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  swipeHint: {
    ...theme.typography.footnote,
    color: theme.colors.accent,
    fontStyle: 'italic',
  },
  scrollableSection: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  missionScrollView: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  missionCard: {
    width: screenWidth,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  missionInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  missionDifficulty: {
    ...theme.typography.headline,
    fontWeight: '600',
    textAlign: 'center',
  },
  revealSection: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundPrimary,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.3,
  },
  paginationDotActive: {
    backgroundColor: theme.colors.accent,
    opacity: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  fixedMissionActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backgroundSecondary,
  },
  noMissionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  noMissionsText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  completedButton: {
    flex: 1,
    backgroundColor: theme.colors.missionCompleted,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  completedButtonText: {
    ...theme.typography.headline,
    color: theme.colors.backgroundPrimary,
    fontWeight: '600',
  },
  caughtButton: {
    flex: 1,
    backgroundColor: theme.colors.missionCaught,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  caughtButtonText: {
    ...theme.typography.headline,
    color: theme.colors.backgroundPrimary,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: theme.colors.backgroundPrimary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    margin: theme.spacing.lg,
  },
  cancelButtonText: {
    ...theme.typography.headline,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  // Fixed reveal button styles
  fixedRevealButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundSecondary,
  },
  revealButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.medium,
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
    fontWeight: '600',
  },
  revealButtonTextActive: {
    color: theme.colors.backgroundPrimary,
  },
  // Mission content area styles
  missionContentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  hiddenMissionContent: {
    alignItems: 'center',
  },
  missionPreviewText: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: theme.spacing.md,
  },
  missionPreviewLabel: {
    ...theme.typography.callout,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  revealedMissionContent: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  missionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
});

export default withErrorBoundary(MyTurnScreen);