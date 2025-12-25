import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { Player, MissionState, GameStatus, getWinner } from '../models';
import { validateMissionStateTransition, validatePlayerExists, validatePlayerHasMission } from '../utils/validation';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorNotification } from '../components/ErrorNotification';
import { withErrorBoundary } from '../components/ErrorBoundary';
import SecureReveal from '../components/SecureReveal';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/constants';
import { StatusIndicator } from '../components/ui/StatusIndicator';

const MyTurnScreen: React.FC = () => {
  const router = useRouter();
  const { gameState } = useGameContext();
  const { updateMissionState, updateGameStatus } = useGameActions();
  const { error, clearError, handleValidationError, handleAsyncError } = useErrorHandler();
  
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showMission, setShowMission] = useState(false);

  // Get players with active missions
  const playersWithActiveMissions = gameState.players.filter(
    player => player.missionState === MissionState.ACTIVE && player.currentMission
  );

  const handlePlayerSelect = async (player: Player) => {
    // Validate player exists and has mission
    const playerValidation = validatePlayerExists(player.id, gameState.players);
    if (!handleValidationError(playerValidation)) {
      return;
    }

    const missionValidation = validatePlayerHasMission(player);
    if (!handleValidationError(missionValidation)) {
      return;
    }

    await handleAsyncError(async () => {
      setSelectedPlayer(player);
      setShowMission(true);
    }, 'Errore durante la selezione del giocatore.');
  };

  const handleMissionComplete = async () => {
    if (!selectedPlayer) return;

    // Validate state transition
    const transitionValidation = validateMissionStateTransition(
      selectedPlayer.missionState, 
      MissionState.COMPLETED
    );
    if (!handleValidationError(transitionValidation)) {
      return;
    }

    await handleAsyncError(async () => {
      updateMissionState(selectedPlayer.id, MissionState.COMPLETED);
      
      // Check for winner after updating state
      const updatedPlayer = {
        ...selectedPlayer,
        completedCount: selectedPlayer.completedCount + 1,
        missionState: MissionState.COMPLETED
      };
      
      const updatedPlayers = gameState.players.map(p => 
        p.id === selectedPlayer.id ? updatedPlayer : p
      );
      
      const winner = getWinner(updatedPlayers, gameState.targetCompleted);
      
      if (winner) {
        Alert.alert(
          '🎉 Abbiamo un Vincitore!',
          `${winner.name} ha completato ${gameState.targetCompleted} missione${gameState.targetCompleted > 1 ? 'i' : ''} e ha vinto la partita!`,
          [
            {
              text: 'Vai alla Schermata Finale',
              onPress: async () => {
                await handleAsyncError(async () => {
                  updateGameStatus(GameStatus.FINISHED);
                  router.push('/end-game' as any);
                }, 'Errore durante il passaggio alla schermata finale.');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Missione Completata! ✅',
          `${selectedPlayer.name} ha completato con successo la sua missione!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowMission(false);
                setSelectedPlayer(null);
              }
            }
          ]
        );
      }
    }, 'Errore durante il completamento della missione.');
  };

  const handleMissionCaught = async () => {
    if (!selectedPlayer) return;

    // Validate state transition
    const transitionValidation = validateMissionStateTransition(
      selectedPlayer.missionState, 
      MissionState.CAUGHT
    );
    if (!handleValidationError(transitionValidation)) {
      return;
    }

    await handleAsyncError(async () => {
      updateMissionState(selectedPlayer.id, MissionState.CAUGHT);
      
      Alert.alert(
        'Missione Scoperta! ❌',
        `${selectedPlayer.name} è stato scoperto mentre tentava di completare la sua missione.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowMission(false);
              setSelectedPlayer(null);
            }
          }
        ]
      );
    }, 'Errore durante la marcatura della missione come scoperta.');
  };

  const handleBackToDashboard = async () => {
    await handleAsyncError(async () => {
      router.back();
    }, 'Errore durante il ritorno alla dashboard.');
  };

  const renderPlayerItem = ({ item: player }: { item: Player }) => (
    <TouchableOpacity
      style={styles.playerCard}
      onPress={() => handlePlayerSelect(player)}
      activeOpacity={0.7}
    >
      <View style={styles.playerHeader}>
        <Text style={styles.playerName}>{player.name}</Text>
        <StatusIndicator 
          status="active" 
          label="Attiva"
          size="small"
        />
      </View>
      
      <View style={styles.playerStats}>
        <Text style={styles.statText}>
          Completate: {player.completedCount} / {gameState.targetCompleted}
        </Text>
      </View>
      
      <View style={styles.selectIndicator}>
        <Text style={styles.selectText}>Tocca per selezionare</Text>
      </View>
    </TouchableOpacity>
  );

  if (playersWithActiveMissions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Nessuna Missione Attiva</Text>
            <Text style={styles.emptyStateText}>
              Non ci sono giocatori con missioni attive al momento.
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
          <Text style={styles.title}>Vedi o aggiorna status missione</Text>
          <Text style={styles.subtitle}>
            Seleziona un giocatore per rivelare la sua missione
          </Text>
        </View>

        {/* Players List */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>
            Giocatori Attivi ({playersWithActiveMissions.length})
          </Text>
          
          <FlatList
            data={playersWithActiveMissions}
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

      {/* Mission Reveal Screen */}
      {showMission && selectedPlayer && (
        <View style={styles.missionOverlay}>
          <SafeAreaView style={styles.missionContainer}>
            <SecureReveal
              missionText={selectedPlayer.currentMission?.text || ''}
              playerName={selectedPlayer.name}
              hapticFeedback={true}
            />

            <View style={styles.missionActions}>
              <TouchableOpacity
                style={styles.completedButton}
                onPress={handleMissionComplete}
                activeOpacity={0.8}
              >
                <Text style={styles.completedButtonText}>Completata</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.caughtButton}
                onPress={handleMissionCaught}
                activeOpacity={0.8}
              >
                <Text style={styles.caughtButtonText}>Scoperta</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowMission(false);
                setSelectedPlayer(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>← Torna alla Lista</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title1,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.callout,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  playersSection: {
    flex: 1,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  playersList: {
    flex: 1,
  },
  playersListContent: {
    paddingBottom: Spacing.md,
  },
  playerCard: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: Colors.backgroundSecondary,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  playerName: {
    ...Typography.headline,
    color: Colors.textPrimary,
    flex: 1,
  },
  playerStats: {
    marginBottom: Spacing.sm,
  },
  statText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  selectIndicator: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  selectText: {
    ...Typography.footnote,
    color: Colors.accent,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    ...Shadows.medium,
  },
  primaryButtonText: {
    ...Typography.headline,
    color: Colors.backgroundPrimary,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.backgroundPrimary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.textSecondary,
  },
  secondaryButtonText: {
    ...Typography.headline,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateTitle: {
    ...Typography.title2,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  missionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.backgroundPrimary,
    zIndex: 1000,
  },
  missionContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  missionActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm, // Added horizontal padding to the container
  },
  completedButton: {
    flex: 1,
    backgroundColor: Colors.missionCompleted,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md, // Added horizontal padding
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    ...Shadows.medium,
  },
  completedButtonText: {
    ...Typography.headline,
    color: Colors.backgroundPrimary,
    fontWeight: '600',
  },
  caughtButton: {
    flex: 1,
    backgroundColor: Colors.missionCaught,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md, // Added horizontal padding
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    ...Shadows.medium,
  },
  caughtButtonText: {
    ...Typography.headline,
    color: Colors.backgroundPrimary,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundPrimary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    marginHorizontal: Spacing.sm, // Added horizontal margin for consistency
  },
  cancelButtonText: {
    ...Typography.headline,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

export default withErrorBoundary(MyTurnScreen);