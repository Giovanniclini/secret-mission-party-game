import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Alert,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { GameStatus, DifficultyLevel, DifficultyMode, Mission } from '../models';
import { 
  getRandomAvailableMissionByDifficulty,
  hasEnoughMissions,
  getMissionCountByDifficulty,
  getTotalMissionCount
} from '../data/missions';
import SecureReveal from '../components/SecureReveal';
import { Button } from '../components/ui/Button';
import { useTheme } from '../theme';

enum AssignmentPhase {
  INTRO = 'INTRO',
  DIFFICULTY_SELECTION = 'DIFFICULTY_SELECTION',
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

  // Calculate configuration values early to avoid hoisting issues
  const isMixedMode = gameState.configuration.difficultyMode === DifficultyMode.MIXED;
  const uniformDifficulty = gameState.configuration.uniformDifficulty;

  const getDifficultyLabel = (difficulty: DifficultyLevel): string => {
    const option = DIFFICULTY_OPTIONS.find(opt => opt.level === difficulty);
    return option ? option.label : difficulty;
  };

  const getDifficultyPoints = (difficulty: DifficultyLevel): number => {
    const option = DIFFICULTY_OPTIONS.find(opt => opt.level === difficulty);
    return option ? option.points : 1;
  };

  const getDifficultyColor = (difficulty: DifficultyLevel): string => {
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return theme.colors.success; // Verde
      case DifficultyLevel.MEDIUM:
        return theme.colors.warning; // Arancione
      case DifficultyLevel.HARD:
        return theme.colors.error; // Rosso
      default:
        return theme.colors.accent; // Fallback
    }
  };

  const assignMissionToPlayer = (playerId: string, difficulty: DifficultyLevel, missionIndex: number) => {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return false;
    }

    const usedMissionIds = gameState.players.flatMap(player => 
      player.missions.map(pm => pm.mission.id)
    );

    const mission = getRandomAvailableMissionByDifficulty(difficulty, usedMissionIds);
    
    if (mission) {
      assignMissionWithDifficulty(playerId, mission, difficulty);
      return true;
    } else {
      const difficultyLabel = getDifficultyLabel(difficulty);
      const availableMissionsOfDifficulty = getMissionCountByDifficulty(difficulty);
      const usedMissionsOfDifficulty = usedMissionIds.filter(id => {
        const allMissions = gameState.players.flatMap(p => p.missions.map(pm => pm.mission));
        const usedMission = allMissions.find(m => m.id === id);
        return usedMission?.difficulty === difficulty;
      }).length;
      
      if (isMixedMode) {
        Alert.alert(
          'Difficoltà Esaurita',
          `Non ci sono più missioni di difficoltà "${difficultyLabel}" disponibili (${usedMissionsOfDifficulty}/${availableMissionsOfDifficulty} già utilizzate).\n\nScegli una difficoltà diversa per questa missione.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Errore Critico',
          `Impossibile assegnare una missione di difficoltà "${difficultyLabel}". Questo non dovrebbe accadere.\n\nTorna alla configurazione e riduci il numero di missioni o cambia difficoltà.`,
          [
            { 
              text: 'Torna alla Configurazione', 
              onPress: () => router.back()
            }
          ]
        );
      }
      return false;
    }
  };

  const assignMissionToCurrentPlayer = (difficulty: DifficultyLevel, missionIndex?: number) => {
    const currentPlayer = gameState.players[currentPlayerIndex];
    if (!currentPlayer) return false;

    // Use provided mission index or current state
    const actualMissionIndex = missionIndex !== undefined ? missionIndex : currentMissionIndex;
    
    return assignMissionToPlayer(currentPlayer.id, difficulty, actualMissionIndex);
  };

  // Set up the mission when we enter MISSION_REVEAL phase
  useEffect(() => {
    if (currentPhase === AssignmentPhase.MISSION_REVEAL) {
      const player = gameState.players[currentPlayerIndex];
      if (player) {
        const playerMissions = player.missions;
        if (playerMissions.length > currentMissionIndex) {
          const missionAtIndex = playerMissions[currentMissionIndex];
          
          if (missionAtIndex) {
            setCurrentMission(missionAtIndex.mission);
            setSelectedDifficulty(missionAtIndex.mission.difficulty);
          }
        }
      }
    }
  }, [currentPhase, currentPlayerIndex, currentMissionIndex, gameState.players]);

  // Force mission update whenever player or mission index changes
  useEffect(() => {
    if (currentPhase === AssignmentPhase.MISSION_REVEAL) {
      const player = gameState.players[currentPlayerIndex];
      if (player && player.missions.length > currentMissionIndex) {
        const missionAtIndex = player.missions[currentMissionIndex];
        if (missionAtIndex) {
          setCurrentMission(missionAtIndex.mission);
          setSelectedDifficulty(missionAtIndex.mission.difficulty);
        }
      }
    }
  }, [currentPlayerIndex, currentMissionIndex, currentPhase, gameState.players]);

  // Clear mission when not in MISSION_REVEAL phase
  useEffect(() => {
    if (currentPhase !== AssignmentPhase.MISSION_REVEAL) {
      setCurrentMission(null);
      setSelectedDifficulty(null);
    }
  }, [currentPhase]);

  // Don't update game status here - it should already be ASSIGNING from SetupPlayersScreen
  useEffect(() => {
    if (gameState.status !== GameStatus.ASSIGNING && gameState.status !== GameStatus.CONFIGURING) {
      console.warn('AssignMissionsScreen loaded with unexpected status:', gameState.status);
    }
  }, []);

  // Calculate current state based on game state
  const currentPlayer = gameState.players[currentPlayerIndex];
  
  const currentPlayerTargetMissions = useMemo(() => {
    if (!currentPlayer) {
      return gameState.configuration.missionsPerPlayer;
    }
    
    if (currentPlayer.targetMissionCount !== gameState.configuration.missionsPerPlayer) {
      console.warn(`Player targetMissionCount (${currentPlayer.targetMissionCount}) doesn't match configuration (${gameState.configuration.missionsPerPlayer})`);
    }
    
    return currentPlayer.targetMissionCount;
  }, [currentPlayer, gameState.configuration.missionsPerPlayer]);
  
  // For mission reveal, show which mission number we're currently revealing (1-based)
  const currentMissionNumber = currentMissionIndex + 1;
  
  const styles = createStyles(theme);

  const handleStartAssignment = () => {
    if (gameState.players.length === 0) {
      Alert.alert('Errore', 'Nessun giocatore trovato');
      return;
    }
    
    // Validate mission availability before starting assignment
    const totalPlayersCount = gameState.players.length;
    const missionsPerPlayer = gameState.configuration.missionsPerPlayer;
    const totalMissionsNeeded = totalPlayersCount * missionsPerPlayer;
    
    if (isMixedMode) {
      // Mixed Mode: Check if we have enough total missions
      const totalAvailableMissions = getTotalMissionCount();
      
      if (totalAvailableMissions < totalMissionsNeeded) {
        Alert.alert(
          'Missioni Insufficienti',
          `Servono ${totalMissionsNeeded} missioni per ${totalPlayersCount} giocatori con ${missionsPerPlayer} missioni ciascuno, ma sono disponibili solo ${totalAvailableMissions} missioni.\n\nRiduci il numero di giocatori o il numero di missioni per giocatore.`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // In mixed mode, we can't predict which difficulties players will choose,
      // but we'll handle individual difficulty shortages during assignment
    } else {
      // Uniform Mode: Check if we have enough missions of the specific difficulty
      if (!hasEnoughMissions(totalPlayersCount, missionsPerPlayer, uniformDifficulty)) {
        const availableMissionsOfDifficulty = getMissionCountByDifficulty(uniformDifficulty!);
        const difficultyLabel = getDifficultyLabel(uniformDifficulty!);
        
        Alert.alert(
          'Missioni Insufficienti',
          `Servono ${totalMissionsNeeded} missioni di difficoltà "${difficultyLabel}", ma sono disponibili solo ${availableMissionsOfDifficulty} missioni di questa difficoltà.\n\nCambia la difficoltà, riduci il numero di giocatori, o riduci il numero di missioni per giocatore.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    // Start with the first player's first mission
    setCurrentPlayerIndex(0);
    setCurrentMissionIndex(0);
    
    // In mixed mode, go to difficulty selection first
    // In uniform mode, go directly to mission reveal (assign mission immediately)
    if (isMixedMode) {
      setCurrentPhase(AssignmentPhase.DIFFICULTY_SELECTION);
    } else {
      // In uniform mode, assign mission immediately and go to reveal
      const success = assignMissionToCurrentPlayer(uniformDifficulty!);
      if (success) {
        setCurrentPhase(AssignmentPhase.MISSION_REVEAL);
      }
    }
  };

  const handleMissionRevealStart = () => {
    // Missions are already assigned and activated when the assignment started
    // This function is called when the mission is first shown to the player
  };

  const handleDifficultySelected = (difficulty: DifficultyLevel) => {
    // Assign mission with selected difficulty
    const success = assignMissionToCurrentPlayer(difficulty);
    
    // Only move to mission reveal if assignment was successful
    if (success) {
      setCurrentPhase(AssignmentPhase.MISSION_REVEAL);
    }
    // If assignment failed, stay in difficulty selection to let user choose different difficulty
  };

  const handleMissionContinue = () => {
    if (!currentPlayer) {
      Alert.alert('Errore', 'Giocatore non trovato');
      return;
    }
    
    const nextMissionIndex = currentMissionIndex + 1;
    
    // Check if current player has more missions to assign
    if (nextMissionIndex < currentPlayerTargetMissions) {
      // Move to next mission for same player
      setCurrentMissionIndex(nextMissionIndex);
      
      if (isMixedMode) {
        setCurrentMission(null);
        setSelectedDifficulty(null);
        setCurrentPhase(AssignmentPhase.DIFFICULTY_SELECTION);
      } else {
        setCurrentMission(null);
        setSelectedDifficulty(null);
        
        // Assign mission immediately for uniform mode
        const success = assignMissionToPlayer(gameState.players[currentPlayerIndex].id, uniformDifficulty!, nextMissionIndex);
        if (success) {
          setCurrentPhase(AssignmentPhase.MISSION_REVEAL);
        }
      }
      return;
    }
    
    // Current player has completed all missions, move to next player
    const nextPlayerIndex = currentPlayerIndex + 1;
    
    if (nextPlayerIndex < gameState.players.length) {
      // Move to next player
      setCurrentPlayerIndex(nextPlayerIndex);
      setCurrentMissionIndex(0);
      
      if (isMixedMode) {
        setCurrentMission(null);
        setSelectedDifficulty(null);
        setCurrentPhase(AssignmentPhase.DIFFICULTY_SELECTION);
      } else {
        setCurrentMission(null);
        setSelectedDifficulty(null);
        
        // Assign mission immediately for uniform mode
        const success = assignMissionToPlayer(gameState.players[nextPlayerIndex].id, uniformDifficulty!, 0);
        if (success) {
          setCurrentPhase(AssignmentPhase.MISSION_REVEAL);
        }
      }
      return;
    }
    
    // All players have completed all their missions
    setCurrentPhase(AssignmentPhase.COMPLETED);
    
    setTimeout(() => {
      updateGameStatus(GameStatus.IN_PROGRESS);
      router.replace('/(tabs)/explore');
    }, 2000);
  };

  if (currentPhase === AssignmentPhase.INTRO) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <StatusBar 
          barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor={theme.colors.backgroundPrimary} 
        />
        
        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
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
                • Premendo &ldquo;Inizia Assegnazione&rdquo; verranno assegnate tutte le missioni
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
        </ScrollView>

        {/* Fixed Button */}
        <View style={styles.fixedButtonContainer}>
          <Button
            title="Inizia Assegnazione"
            onPress={handleStartAssignment}
            variant="primary"
            size="large"
            style={styles.startButton}
          />
        </View>
      </View>
    );
  }

  if (currentPhase === AssignmentPhase.DIFFICULTY_SELECTION) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <StatusBar 
          barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor={theme.colors.backgroundPrimary} 
        />
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
          </View>
          
          <View style={styles.difficultySelectionContent}>
            <Text style={styles.difficultySelectionTitle}>
              Scegli la difficoltà per questa missione
            </Text>
            
            <View style={styles.difficultyOptions}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.level}
                  style={styles.difficultyOption}
                  onPress={() => handleDifficultySelected(option.level)}
                  activeOpacity={0.8}
                >
                  <View style={styles.difficultyOptionHeader}>
                    <Text style={styles.difficultyOptionLabel}>
                      {option.label}
                    </Text>
                    <Text style={styles.difficultyOptionPoints}>
                      {option.points} punt{option.points > 1 ? 'i' : 'o'}
                    </Text>
                  </View>
                  <Text style={styles.difficultyOptionDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (currentPhase === AssignmentPhase.MISSION_REVEAL) {
    if (!currentMission || !selectedDifficulty) {
      const player = gameState.players[currentPlayerIndex];
      const hasMissionData = player && player.missions.length > currentMissionIndex && player.missions[currentMissionIndex];
      
      if (!hasMissionData) {
        return (
          <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
            <StatusBar 
              barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
              backgroundColor={theme.colors.backgroundPrimary} 
            />
            <View style={styles.content}>
              <Text style={styles.errorText}>Caricamento missione...</Text>
            </View>
          </View>
        );
      } else {
        // Mission data exists but state hasn't updated yet - trigger update
        const missionAtIndex = player.missions[currentMissionIndex];
        if (missionAtIndex && !currentMission) {
          setCurrentMission(missionAtIndex.mission);
          setSelectedDifficulty(missionAtIndex.mission.difficulty);
        }
        
        return (
          <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
            <StatusBar 
              barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
              backgroundColor={theme.colors.backgroundPrimary} 
            />
            <View style={styles.content}>
              <Text style={styles.errorText}>Caricamento missione...</Text>
            </View>
          </View>
        );
      }
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
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <StatusBar 
          barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor={theme.colors.backgroundPrimary} 
        />
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
              <View style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(selectedDifficulty) }
              ]}>
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
      </View>
    );
  }

  if (currentPhase === AssignmentPhase.COMPLETED) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <StatusBar 
          barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor={theme.colors.backgroundPrimary} 
        />
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
      </View>
    );
  }

  return null;
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
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
  fixedButtonContainer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backgroundSecondary,
  },
  startButton: {
    width: '100%',
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
  
  // Difficulty Selection Styles
  difficultySelectionContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  difficultySelectionTitle: {
    ...theme.typography.title2,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  difficultyOptions: {
    gap: theme.spacing.md,
  },
  difficultyOption: {
    backgroundColor: theme.colors.backgroundPrimary,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: theme.colors.backgroundSecondary,
  },
  difficultyOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  difficultyOptionLabel: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  difficultyOptionPoints: {
    ...theme.typography.subhead,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  difficultyOptionDescription: {
    ...theme.typography.callout,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default AssignMissionsScreen;