import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Mission } from '../models';

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
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#27ae60';
      case 'medium':
        return '#f39c12';
      case 'hard':
        return '#e74c3c';
      default:
        return '#7f8c8d';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  playerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 32,
    textAlign: 'center',
  },
  missionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  missionText: {
    fontSize: 18,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  instruction: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default MissionCard;