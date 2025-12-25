import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';

interface PrivacyScreenProps {
  playerName: string;
  onContinue: () => void;
  onCancel?: () => void;
  message?: string;
}

const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ 
  playerName, 
  onContinue, 
  onCancel,
  message 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔒 Schermo Privacy</Text>
        
        <Text style={styles.playerName}>
          Turno di: {playerName}
        </Text>
        
        <Text style={styles.message}>
          {message || 'Assicurati che solo tu possa vedere lo schermo prima di continuare.'}
        </Text>
        
        <Text style={styles.instruction}>
          Gli altri giocatori non devono guardare!
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
          >
            <Text style={styles.continueButtonText}>
              Sono Pronto/a
            </Text>
          </TouchableOpacity>
          
          {onCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>
                Annulla
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 32,
    textAlign: 'center',
  },
  playerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 24,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  instruction: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '600',
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 16,
  },
  continueButton: {
    backgroundColor: '#27ae60',
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
  cancelButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    minWidth: 200,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PrivacyScreen;