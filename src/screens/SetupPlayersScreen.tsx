import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { createPlayer, GameStatus } from '../models';
import { validatePlayerName, validateGameStart } from '../utils/validation';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorNotification } from '../components/ErrorNotification';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { useTheme } from '../theme/ThemeProvider';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const SetupPlayersScreen: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const { gameState } = useGameContext();
  const { addPlayer, removePlayer, updateGameStatus } = useGameActions();
  const { error, clearError, handleValidationError, handleAsyncError } = useErrorHandler();
  const [playerName, setPlayerName] = useState('');
  const [inputError, setInputError] = useState<string>('');

  // Ensure game status is SETUP when this screen is active
  useEffect(() => {
    if (gameState.status !== GameStatus.SETUP) {
      updateGameStatus(GameStatus.SETUP);
    }
  }, [gameState.status, updateGameStatus]);

  const handleAddPlayer = async () => {
    const trimmedName = playerName.trim();
    
    // Clear previous input error
    setInputError('');
    
    // Validate player name
    const validation = validatePlayerName(trimmedName, gameState.players);
    if (!validation.isValid) {
      setInputError(validation.error || 'Nome non valido');
      return;
    }
    
    // Add player with error handling
    await handleAsyncError(async () => {
      const newPlayer = createPlayer(trimmedName);
      addPlayer(newPlayer);
      setPlayerName('');
      setInputError('');
    }, 'Errore durante l\'aggiunta del giocatore.');
  };

  const handleRemovePlayer = (playerId: string) => {
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
      Alert.alert(
        'Rimuovi Giocatore',
        `Sei sicuro di voler rimuovere ${player.name}?`,
        [
          {
            text: 'Annulla',
            style: 'cancel',
          },
          {
            text: 'Rimuovi',
            style: 'destructive',
            onPress: async () => {
              await handleAsyncError(async () => {
                removePlayer(playerId);
              }, 'Errore durante la rimozione del giocatore.');
            },
          },
        ]
      );
    }
  };

  const handleStartGame = async () => {
    // Validate game can start
    const validation = validateGameStart(gameState);
    if (!handleValidationError(validation)) {
      return;
    }
    
    // Navigate to AssignMissionsScreen with error handling
    await handleAsyncError(async () => {
      router.push('/assign-missions');
    }, 'Errore durante l\'avvio della partita.');
  };

  const handlePlayerNameChange = (text: string) => {
    setPlayerName(text);
    // Clear input error when user starts typing
    if (inputError) {
      setInputError('');
    }
  };

  const canStartGame = gameState.players.length >= 3;
  const canAddPlayer = playerName.trim().length > 0;

  const renderPlayerItem = ({ item: player }: { item: typeof gameState.players[0] }) => (
    <Card style={styles.playerCard}>
      <View style={styles.playerItemContent}>
        <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>
          {player.name}
        </Text>
        <Button
          title="Rimuovi"
          onPress={() => handleRemovePlayer(player.id)}
          variant="destructive"
          size="small"
        />
      </View>
    </Card>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ErrorNotification
        message={error.message}
        visible={error.visible}
        onDismiss={clearError}
        type={error.type}
      />
      
      <View style={styles.content}>
        <Text style={[styles.title, { 
          color: theme.colors.secondary,
          ...theme.typography.title1 
        }]}>
          Configurazione Giocatori
        </Text>
        <Text style={[styles.subtitle, { 
          color: theme.colors.textSecondary,
          ...theme.typography.callout 
        }]}>
          Aggiungi i giocatori per iniziare la partita
        </Text>
        
        <View style={styles.inputSection}>
          <Input
            placeholder="Nome del giocatore"
            value={playerName}
            onChangeText={handlePlayerNameChange}
            maxLength={20}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleAddPlayer}
            error={inputError}
            containerStyle={styles.inputContainer}
          />
          
          <Button
            title="Aggiungi"
            onPress={handleAddPlayer}
            disabled={!canAddPlayer}
            variant="secondary"
            size="medium"
            style={styles.addButton}
          />
        </View>
        
        <View style={styles.playersSection}>
          <Text style={[styles.playersTitle, { 
            color: theme.colors.secondary,
            ...theme.typography.title2 
          }]}>
            Giocatori ({gameState.players.length})
          </Text>
          
          {gameState.players.length === 0 ? (
            <Text style={[styles.emptyText, { 
              color: theme.colors.textSecondary,
              ...theme.typography.callout 
            }]}>
              Nessun giocatore aggiunto ancora
            </Text>
          ) : (
            <FlatList
              data={gameState.players}
              renderItem={renderPlayerItem}
              keyExtractor={(item) => item.id}
              style={styles.playersList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.playersListContent}
            />
          )}
        </View>
        
        <View style={styles.bottomSection}>
          {!canStartGame && gameState.players.length > 0 && (
            <Text style={[styles.minPlayersText, { 
              color: theme.colors.warning,
              ...theme.typography.footnote 
            }]}>
              Servono almeno 3 giocatori per iniziare
            </Text>
          )}
          
          <Button
            title="Inizia Partita"
            onPress={handleStartGame}
            disabled={!canStartGame}
            variant="primary"
            size="large"
            style={styles.startButton}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  inputContainer: {
    flex: 1,
  },
  addButton: {
    marginTop: 0, // Align with input field
  },
  playersSection: {
    flex: 1,
    marginTop: 24,
  },
  playersTitle: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 32,
  },
  playersList: {
    flex: 1,
  },
  playersListContent: {
    gap: 8,
  },
  playerCard: {
    padding: 0, // Remove default card padding to control it manually
  },
  playerItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSection: {
    marginTop: 24,
    gap: 12,
  },
  minPlayersText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  startButton: {
    width: '100%',
  },
});

export default withErrorBoundary(SetupPlayersScreen);