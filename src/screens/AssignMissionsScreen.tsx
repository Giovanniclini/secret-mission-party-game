import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { GameStatus, DifficultyLevel, DifficultyMode, Mission } from '../models';
import { 
  getRandomAvailableMissionByDifficulty,
  getRandomAvailableMission
} from '../data/missions';
import SecureReveal from '../components/SecureReveal';
import { Button } from '../components/ui/Button';
import { useTheme } from '../theme';
import { getAllUsedMissionIds } from '../data/missionUtils';

enum AssignmentPhase {
  INTRO = 'INTRO',
  MISSION_REVEAL = 'MISSION_REVEAL',
  COMPLETED = 'COMPLETED'
}

interface DifficultyOption {
  level: DifficultyLevel;
  label: string;
  points: number;
  description: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    level: DifficultyLevel.EASY,
    label: 'Facile',
    points: 1,
    description: 'Missioni semplici e veloci'
  },
  {
    level: DifficultyLevel.MEDIUM,
    label: 'Medio',
    points: 2,
    description: 'Missioni di difficoltà moderata'
  },
  {
    level: DifficultyLevel.HARD,
    label: 'Difficile',
    points: 3,
    description: 'Missioni impegnative e creative'
  }
];

const AssignMissionsScreen: React.FC = () => {
  const router = useRouter();
  const { gameState } = useGameContext();
  const { assignMissionWithDifficulty, updateGameStatus } = useGameActions();
  const theme = useTheme();
  
  const [currentPhase, setCurrentPhase] = useState<AssignmentPhase>(AssignmentPhase.INTRO);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentMissionIndex, setCurrentMissionIndex] = useState(0); // Track which mission index is being revealed
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);

  // Set up the first mission when we enter MISSION_REVEAL phase
  useEffect(() => {
    if (currentPhase === AssignmentPhase.MISSION_REVEAL && !currentMission) {
      const player = gameState.players[currentPlayerIndex];
      if (player) {
        // Get the mission at the current index for the current player
        const playerMissions = player.missions;
        if (playerMissions.length > currentMissionIndex) {
          const missionToReveal = playerMissions[currentMissionIndex];
          
          if (missionToReveal) {
            setCurrentMission(missionToReveal.mission);
            setSelectedDifficulty(missionToReveal.mission.difficulty);
          }
        }
      }
    }
  }, [currentPhase, currentMission, currentMissionIndex, currentPlayerIndex, gameState.players]);

  // Don't update game status here - it should already be ASSIGNING from SetupPlayersScreen
  useEffect(() => {
    // No status updates needed - just validate we're in the right state
    if (gameState.status !== GameStatus.ASSIGNING && gameState.status !== GameStatus.CONFIGURING) {
      console.warn('AssignMissionsScreen loaded with unexpected status:', gameState.status);
    }
  }, []); // Empty dependency array - only run once on mount

  // CLEAN LOGIC: Calculate current state based on game state
  const currentPlayer = gameState.players[currentPlayerIndex];
  const currentPlayerTargetMissions = currentPlayer?.targetMissionCount || gameState.configuration.missionsPerPlayer;
  
  // For mission reveal, show which mission number we're currently revealing (1-based)
  const currentMissionNumber = currentMissionIndex + 1;
  
  // Check if all players have completed their assignments (all have their target number of missions)
  const allPlayersComplete = gameState.players.every(player => 
    player.missions.length >= player.targetMissionCount
  );
  
  const isMixedMode = gameState.configuration.difficultyMode === DifficultyMode.MIXED;
  const uniformDifficulty = gameState.configuration.uniformDifficulty;

  const styles = createStyles(theme);

  const handleStartAssignment = () => {
    if (gameState.players.length === 0) {
      Alert.alert('Errore', 'Nessun giocatore trovato');
      return;
    }
    
    // Assign ALL missions to ALL players at once
    assignAllMissionsToAllPlayers();
    
    // Start with the first player's first mission
    setCurrentPlayerIndex(0);
    setCurrentMissionIndex(0);
    setCurrentPhase(AssignmentPhase.MISSION_REVEAL);
  };

  const assignAllMissionsToAllPlayers = () => {
    const usedMissionIds: string[] = [];
    
    // For each player, assign all their missions
    gameState.players.forEach(player => {
      for (let missionIndex = 0; missionIndex < player.targetMissionCount; missionIndex++) {
        let mission: Mission | null = null;
        let difficulty: DifficultyLevel;
        
        if (isMixedMode) {
          // In mixed mode, assign with medium difficulty by default
          // Players can see the difficulty when the mission is revealed
          difficulty = DifficultyLevel.MEDIUM;
          mission = getRandomAvailableMissionByDifficulty(difficulty, usedMissionIds);
        } else if (uniformDifficulty) {
          // In uniform mode, use the configured difficulty
          difficulty = uniformDifficulty;
          mission = getRandomAvailableMissionByDifficulty(difficulty, usedMissionIds);
        } else {
          // Fallback to random mission
          difficulty = DifficultyLevel.MEDIUM;
          mission = getRandomAvailableMission(usedMissionIds);
        }

        if (mission) {
          // Add to used missions to avoid duplicates
          usedMissionIds.push(mission.id);
          
          // Assign the mission to the player
          assignMissionWithDifficulty(player.id, mission, difficulty);
        }
      }
    });
  };

  const handleMissionRevealStart = () => {
    // Missions are already assigned and activated when the assignment started
    // This function is called when the mission is first shown to the player
  };

  const handleMissionContinue = () => {
    if (!currentPlayer) {
      Alert.alert('Errore', 'Giocatore non trovato');
      return;
    }
    
    const playerMissions = currentPlayer.missions;
    
    // Check if current player has more missions to reveal
    if (currentMissionIndex < playerMissions.length - 1) {
      // Show next mission for same player
      const nextMissionIndex = currentMissionIndex + 1;
      setCurrentMissionIndex(nextMissionIndex);
      
      const nextMission = playerMissions[nextMissionIndex];
      if (nextMission) {
        setCurrentMission(nextMission.mission);
        setSelectedDifficulty(nextMission.mission.difficulty);
      }
      return;
    }
    
    // Current player has seen all missions, move to next player
    const nextPlayerIndex = currentPlayerIndex + 1;
    
    if (nextPlayerIndex < gameState.players.length) {
      // Move to next player
      const nextPlayer = gameState.players[nextPlayerIndex];
      setCurrentPlayerIndex(nextPlayerIndex);
      setCurrentMissionIndex(0); // Reset to first mission for new player
      
      // Set up first mission for next player
      if (nextPlayer.missions.length > 0) {
        setCurrentMission(nextPlayer.missions[0].mission);
        setSelectedDifficulty(nextPlayer.missions[0].mission.difficulty);
      }
      return;
    }
    
    // All players have seen all their missions - complete the assignment
    setCurrentPhase(AssignmentPhase.COMPLETED);
    
    // Navigate to Dashboard tab after a short delay
    setTimeout(() => {
      updateGameStatus(GameStatus.IN_PROGRESS);
      router.replace('/(tabs)/explore');
    }, 2000);
  };

  const getDifficultyLabel = (difficulty: DifficultyLevel): string => {
    const option = DIFFICULTY_OPTIONS.find(opt => opt.level === difficulty);
    return option ? option.label : difficulty;
  };

  const getDifficultyPoints = (difficulty: DifficultyLevel): number => {
    const option = DIFFICULTY_OPTIONS.find(opt => opt.level === difficulty);
    return option ? option.points : 1;
  };

  if (currentPhase === AssignmentPhase.INTRO) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Assegnazione Missioni</Text>
            <Text style={styles.subtitle}>
              Ogni giocatore riceverà {gameState.configuration.missionsPerPlayer} {gameState.configuration.missionsPerPlayer === 1 ? 'missione segreta' : 'missioni segrete'}
            </Text>
          </View>
          
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Come Funziona</Text>
            <View style={styles.instructionsList}>
              <Text style={styles.instructionItem}>
                • Premendo "Inizia Assegnazione" verranno assegnate tutte le missioni
              </Text>
              <Text style={styles.instructionItem}>
                • Ogni giocatore vedrà le proprie missioni in privato
              </Text>
              <Text style={styles.instructionItem}>
                • Memorizza le tue missioni e passa il telefono
              </Text>
              <Text style={styles.instructionItem}>
                • Non rivelare le tue missioni agli altri
              </Text>
              <Text style={styles.instructionItem}>
                • Completa le missioni durante la partita per guadagnare punti
              </Text>
            </View>
          </View>
          
          <View style={styles.gameInfo}>
            <Text style={styles.playersCount}>
              Giocatori: {gameState.players.length}
            </Text>
            <Text style={styles.configInfo}>
              Missioni per giocatore: {gameState.configuration.missionsPerPlayer}
            </Text>
            <Text style={styles.configInfo}>
              Modalità: {isMixedMode ? 'Difficoltà Mista' : `Difficoltà ${getDifficultyLabel(uniformDifficulty!)}`}
            </Text>
          </View>
          
          <View style={styles.actions}>
            <Button
              title="Inizia Assegnazione"
              onPress={handleStartAssignment}
              variant="primary"
              size="large"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (currentPhase === AssignmentPhase.MISSION_REVEAL) {
    if (!currentMission || !selectedDifficulty) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.errorText}>Errore nel caricamento della missione</Text>
          </View>
        </SafeAreaView>
      );
    }

    // Calculate button text based on current state
    const isLastMissionForPlayer = currentMissionIndex >= currentPlayerTargetMissions - 1;
    const isLastPlayer = currentPlayerIndex >= gameState.players.length - 1;
    
    let buttonText = 'Prossima Missione';
    if (isLastMissionForPlayer && isLastPlayer) {
      buttonText = 'Completa Assegnazione';
    } else if (isLastMissionForPlayer) {
      buttonText = 'Prossimo Giocatore';
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.revealContainer}>
          <View style={styles.revealHeader}>
            <Text style={styles.revealTitle}>
              Missione {currentMissionNumber} di {currentPlayerTargetMissions}
            </Text>
            <Text style={styles.revealProgress}>
              Giocatore {currentPlayerIndex + 1} di {gameState.players.length}
            </Text>
            <Text style={styles.playerName}>
              {currentPlayer.name}
            </Text>
            
            <View style={styles.missionInfo}>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyBadgeText}>
                  {getDifficultyLabel(selectedDifficulty)}
                </Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>
                  {getDifficultyPoints(selectedDifficulty)} {getDifficultyPoints(selectedDifficulty) === 1 ? 'punto' : 'punti'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.revealContent}>
            <SecureReveal
              missionText={currentMission.text}
              playerName={currentPlayer.name}
              onRevealStart={handleMissionRevealStart}
              hapticFeedback={true}
            />
          </View>
          
          <View style={styles.revealActions}>
            <Button
              title={buttonText}
              onPress={handleMissionContinue}
              variant="primary"
              size="large"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (currentPhase === AssignmentPhase.COMPLETED) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Missioni Assegnate</Text>
            <Text style={styles.subtitle}>
              Tutti i giocatori hanno ricevuto le loro {gameState.configuration.missionsPerPlayer} {gameState.configuration.missionsPerPlayer === 1 ? 'missione segreta' : 'missioni segrete'}
            </Text>
          </View>
          
          <View style={styles.completedCard}>
            <Text style={styles.completedText}>
              Perfetto! Ora inizia la partita.
            </Text>
            <Text style={styles.completedSubtext}>
              Ricordate: completate le vostre missioni senza farvi scoprire per guadagnare punti
            </Text>
          </View>
          
          <Text style={styles.redirectText}>
            Reindirizzamento alla dashboard di gioco...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return null;
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
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
    lineHeight: 24,
  },
  instructionsCard: {
    backgroundColor: theme.colors.backgroundPrimary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xl,
    ...theme.shadows.medium,
    marginVertical: theme.spacing.xl,
  },
  instructionsTitle: {
    ...theme.typography.headline,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  instructionsList: {
    gap: theme.spacing.sm,
  },
  instructionItem: {
    ...theme.typography.callout,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  gameInfo: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  playersCount: {
    ...theme.typography.callout,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  configInfo: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    paddingBottom: theme.spacing.lg,
  },
  
  // Mission Reveal Styles
  revealContainer: {
    flex: 1,
  },
  revealHeader: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg, // Reduced bottom padding
  },
  revealTitle: {
    ...theme.typography.title2,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  revealProgress: {
    ...theme.typography.callout,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  playerName: {
    ...theme.typography.title1,
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  missionInfo: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg, // Reduced spacing below difficulty badges
  },
  difficultyBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
  },
  difficultyBadgeText: {
    ...theme.typography.callout,
    color: theme.colors.backgroundPrimary,
    fontWeight: '600',
  },
  pointsBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  pointsText: {
    ...theme.typography.footnote,
    color: theme.colors.backgroundPrimary,
    fontWeight: '600',
  },
  revealContent: {
    flex: 1,
    justifyContent: 'center',
    marginTop: theme.spacing.lg, // Add space between header and content
    marginBottom: theme.spacing.lg, // Add space between content and actions
  },
  revealActions: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl, // Increased top padding for more space above button
    paddingBottom: theme.spacing.xl, // Keep bottom padding for safe area
  },
  
  // Completed Styles
  completedCard: {
    backgroundColor: theme.colors.backgroundPrimary,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xl,
    ...theme.shadows.medium,
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  completedText: {
    ...theme.typography.headline,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  completedSubtext: {
    ...theme.typography.callout,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  redirectText: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingBottom: theme.spacing.lg,
  },
  
  // Error Styles
  errorText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default AssignMissionsScreen;