import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { GameStatus } from '../models';
import { getAllMissions } from '../data/missions';
import SecureReveal from '../components/SecureReveal';
import { Button } from '../components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/constants';

enum AssignmentPhase {
  INTRO = 'INTRO',
  MISSION_REVEAL = 'MISSION_REVEAL',
  COMPLETED = 'COMPLETED'
}

const AssignMissionsScreen: React.FC = () => {
  const router = useRouter();
  const { gameState } = useGameContext();
  const { assignMissions, updateGameStatus } = useGameActions();
  
  const [currentPhase, setCurrentPhase] = useState<AssignmentPhase>(AssignmentPhase.INTRO);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [missions] = useState(getAllMissions());

  // Update game status to ASSIGNING when component mounts
  useEffect(() => {
    if (gameState.status === GameStatus.SETUP) {
      updateGameStatus(GameStatus.ASSIGNING);
    }
  }, [gameState.status, updateGameStatus]);

  const currentPlayer = gameState.players[currentPlayerIndex];
  const isLastPlayer = currentPlayerIndex === gameState.players.length - 1;

  const handleStartAssignment = () => {
    if (gameState.players.length === 0) {
      return;
    }
    setCurrentPhase(AssignmentPhase.MISSION_REVEAL);
  };

  const handleMissionContinue = () => {
    if (isLastPlayer) {
      // All players have been assigned missions
      setCurrentPhase(AssignmentPhase.COMPLETED);
      
      // Assign missions to all players and update game status
      assignMissions(missions);
      
      // Navigate to GameDashboardScreen after a short delay
      setTimeout(() => {
        router.replace('/game-dashboard');
      }, 2000);
    } else {
      // Move to next player
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setCurrentPhase(AssignmentPhase.MISSION_REVEAL);
    }
  };

  // Get mission for current player (shuffle missions to avoid duplicates when possible)
  const getCurrentPlayerMission = () => {
    const shuffledMissions = [...missions].sort(() => Math.random() - 0.5);
    return shuffledMissions[currentPlayerIndex % shuffledMissions.length];
  };

  if (currentPhase === AssignmentPhase.INTRO) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Assegnazione Missioni</Text>
            <Text style={styles.subtitle}>
              Ogni giocatore riceverà una missione segreta
            </Text>
          </View>
          
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Come Funziona</Text>
            <View style={styles.instructionsList}>
              <Text style={styles.instructionItem}>
                • Ogni giocatore vedrà la propria missione in privato
              </Text>
              <Text style={styles.instructionItem}>
                • Memorizza la tua missione e passa il telefono
              </Text>
              <Text style={styles.instructionItem}>
                • Non rivelare la tua missione agli altri
              </Text>
              <Text style={styles.instructionItem}>
                • Completa la missione durante la partita
              </Text>
            </View>
          </View>
          
          <View style={styles.gameInfo}>
            <Text style={styles.playersCount}>
              Giocatori: {gameState.players.length}
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
    const mission = getCurrentPlayerMission();
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.revealContainer}>
          <View style={styles.revealHeader}>
            <Text style={styles.revealTitle}>
              Assegnazione Missione
            </Text>
            <Text style={styles.revealProgress}>
              Giocatore {currentPlayerIndex + 1} di {gameState.players.length}
            </Text>
            <Text style={styles.playerName}>
              {currentPlayer.name}
            </Text>
          </View>
          
          <View style={styles.revealContent}>
            <SecureReveal
              missionText={mission.text}
              playerName={currentPlayer.name}
              hapticFeedback={true}
            />
          </View>
          
          <View style={styles.revealActions}>
            <Button
              title={isLastPlayer ? 'Completa Assegnazione' : 'Prossimo Giocatore'}
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
              Tutti i giocatori hanno ricevuto le loro missioni segrete
            </Text>
          </View>
          
          <View style={styles.completedCard}>
            <Text style={styles.completedText}>
              Perfetto! Ora inizia la partita.
            </Text>
            <Text style={styles.completedSubtext}>
              Ricordate: completate le vostre missioni senza farvi scoprire
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  title: {
    ...Typography.title1,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionsCard: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    ...Shadows.medium,
    marginVertical: Spacing.xl,
  },
  instructionsTitle: {
    ...Typography.headline,
    color: Colors.secondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  instructionsList: {
    gap: Spacing.sm,
  },
  instructionItem: {
    ...Typography.callout,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  gameInfo: {
    alignItems: 'center',
  },
  playersCount: {
    ...Typography.callout,
    color: Colors.accent,
    fontWeight: '600',
  },
  actions: {
    paddingBottom: Spacing.lg,
  },
  
  // Mission Reveal Styles
  revealContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  revealHeader: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  revealTitle: {
    ...Typography.title2,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  revealProgress: {
    ...Typography.callout,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  playerName: {
    ...Typography.title1,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  revealContent: {
    flex: 1,
    justifyContent: 'center',
  },
  revealActions: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  
  // Completed Styles
  completedCard: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    ...Shadows.medium,
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  completedText: {
    ...Typography.headline,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  completedSubtext: {
    ...Typography.callout,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  redirectText: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingBottom: Spacing.lg,
  },
});

export default AssignMissionsScreen;