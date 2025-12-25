import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Mission } from '../models';
import { useTheme } from '../theme';

interface MissionCardProps {
  mission: Mission;
  playerName: string;
  onContinue: () => void;
}

const MissionCard: React.FC<MissionCardProps> = ({ 
  mission, 
  playerName, 
  onContinue 
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return theme.colors.missionCompleted;
      case 'medium':
        return theme.colors.primary;
      case 'hard':
        return theme.colors.missionCaught;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Facile';
      case 'medium':
        return 'Medio';
      case 'hard':
        return 'Difficile';
      default:
        return 'Sconosciuto';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎯 La Tua Missione</Text>
        
        <Text style={styles.playerName}>
          {playerName}
        </Text>
        
        <View style={styles.missionCard}>
          <View style={[
            styles.difficultyBadge, 
            { backgroundColor: getDifficultyColor(mission.difficulty) }
          ]}>
            <Text style={styles.difficultyText}>
              {getDifficultyText(mission.difficulty)}
            </Text>
          </View>
          
          <Text style={styles.missionText}>
            {mission.text}
          </Text>
        </View>
        
        <Text style={styles.instruction}>
          Ricorda la tua missione e passa il telefono al prossimo giocatore!
        </Text>
        
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
        >
          <Text style={styles.continueButtonText}>
            Ho Memorizzato
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  content: {
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
  },
  title: {
    ...theme.typography.title2,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  playerName: {
    ...theme.typography.title1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  missionCard: {
    backgroundColor: theme.colors.backgroundPrimary,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.medium,
    width: '100%',
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.large,
    marginBottom: theme.spacing.lg,
  },
  difficultyText: {
    ...theme.typography.caption,
    color: theme.colors.backgroundPrimary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  missionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  instruction: {
    ...theme.typography.callout,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.small,
    minWidth: 200,
  },
  continueButtonText: {
    ...theme.typography.headline,
    color: theme.colors.backgroundPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default MissionCard;