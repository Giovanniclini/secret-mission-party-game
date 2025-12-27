import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { GameStatus } from '../models';
import { canResumeGame } from '../utils/validation';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorNotification } from '../components/ErrorNotification';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { Button } from '../components/ui/Button';
import { useTheme } from '../theme/ThemeProvider';
import GameRulesModal from '../components/GameRulesModal';

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { gameState, isLoading } = useGameContext();
  const { createGame } = useGameActions();
  const { error, clearError, handleAsyncError } = useErrorHandler();
  const theme = useTheme();
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Check if there's a game in progress that can be resumed
  const gameCanBeResumed = canResumeGame(gameState);

  const handleStartNewGame = async () => {
    if (gameCanBeResumed) {
      Alert.alert(
        'Nuova Partita',
        'Hai già una partita in corso. Vuoi iniziare una nuova partita? Perderai i progressi attuali.',
        [
          {
            text: 'Annulla',
            style: 'cancel',
          },
          {
            text: 'Nuova Partita',
            style: 'destructive',
            onPress: async () => {
              await handleAsyncError(async () => {
                createGame();
                router.push('/game-configuration');
              }, 'Errore durante la creazione di una nuova partita.');
            },
          },
        ]
      );
    } else {
      await handleAsyncError(async () => {
        createGame();
        router.push('/game-configuration');
      }, 'Errore durante la creazione di una nuova partita.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.backgroundPrimary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Caricamento...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.backgroundPrimary} />
      
      <ErrorNotification
        message={error.message}
        visible={error.visible}
        onDismiss={clearError}
        type={error.type}
      />
      
      {/* Logo and Branding Section */}
      <View style={styles.brandingSection}>
        <Image 
          source={require('../../assets/images/secret-mission-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.colors.secondary }, theme.typography.title1]}>
          Secret Mission
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }, theme.typography.callout]}>
          Il gioco di società per feste
        </Text>
      </View>
      
      {/* Action Buttons Section */}
      <View style={styles.actionsSection}>
        <Button
          title="Nuova Partita"
          onPress={handleStartNewGame}
          variant="primary"
          size="large"
          style={styles.primaryButton}
        />
        

        
        <Button
          title="Regole del Gioco"
          onPress={() => setShowRulesModal(true)}
          variant="secondary"
          size="medium"
          style={styles.rulesButton}
        />
      </View>

      {/* Game Info Section */}
      {gameCanBeResumed && (
        <View style={[styles.gameInfoContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.gameInfoText, { color: theme.colors.textPrimary }, theme.typography.callout]}>
            Partita in corso: {gameState.players.length} giocatori
          </Text>
          <Text style={[styles.gameInfoSubtext, { color: theme.colors.textSecondary }, theme.typography.footnote]}>
            Stato: {getGameStatusText(gameState.status)}
          </Text>
        </View>
      )}
      
      {/* Subtle Background Elements */}
      <View style={[styles.backgroundElement, { backgroundColor: theme.colors.backgroundSecondary }]} />
      
      {/* Game Rules Modal */}
      <GameRulesModal
        visible={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </View>
  );
};

const getGameStatusText = (status: GameStatus): string => {
  switch (status) {
    case GameStatus.SETUP:
      return 'Configurazione';
    case GameStatus.CONFIGURING:
      return 'Configurazione Partita';
    case GameStatus.ASSIGNING:
      return 'Assegnazione Missioni';
    case GameStatus.IN_PROGRESS:
      return 'In Corso';
    case GameStatus.FINISHED:
      return 'Terminata';
    default:
      return 'Sconosciuto';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    position: 'relative',
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '400',
  },
  actionsSection: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    width: '100%',
  },
  rulesButton: {
    width: '100%',
    marginTop: 8,
  },
  gameInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  gameInfoText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  gameInfoSubtext: {
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  backgroundElement: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.05,
    zIndex: -1,
  },
});

export default withErrorBoundary(HomeScreen);