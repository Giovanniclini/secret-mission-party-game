import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  SafeAreaView,
  Modal 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { GameStatus, MissionState, getWinner, createPlayer } from '../models';
import { useTheme } from '../theme/ThemeProvider';
import { StatusIndicator, StatusType } from '../components/ui/StatusIndicator';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { validatePlayerName } from '../utils/validation';
import { getAllMissions } from '../data/missions';

const GameDashboardScreen: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const { gameState } = useGameContext();
  const { updateGameStatus, addPlayer, removePlayer } = useGameActions();
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [inputError, setInputError] = useState('');

  // Check if there's a winner
  const winner = getWinner(gameState.players, gameState.targetCompleted);

  const handleMyTurn = () => {
    router.push('/my-turn' as any);
  };

  const handleEndGame = () => {
    Alert.alert(
      'Termina Partita',
      'Sei sicuro di voler terminare la partita? Questo porterà alla schermata finale.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Termina',
          style: 'destructive',
          onPress: () => {
            updateGameStatus(GameStatus.FINISHED);
            router.push('/end-game' as any);
          },
        },
      ]
    );
  };

  const handleAddPlayer = () => {
    const trimmedName = newPlayerName.trim();
    
    // Validate player name
    const validation = validatePlayerName(trimmedName, gameState.players);
    if (!validation.isValid) {
      setInputError(validation.error || 'Nome non valido');
      return;
    }
    
    // Create new player
    const newPlayer = createPlayer(trimmedName);
    
    // If game is in progress, assign a random mission
    let missionToAssign = undefined;
    if (gameState.status === GameStatus.IN_PROGRESS) {
      const allMissions = getAllMissions();
      if (allMissions.length > 0) {
        // Get a random mission
        const randomIndex = Math.floor(Math.random() * allMissions.length);
        missionToAssign = allMissions[randomIndex];
      }
    }
    
    // Add player with optional mission
    addPlayer(newPlayer, missionToAssign);
    
    // Reset form and close modal
    setNewPlayerName('');
    setInputError('');
    setShowAddPlayerModal(false);
  };

  const handleRemovePlayer = (playerId: string) => {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    // Prevent removing players if it would go below minimum
    if (gameState.players.length <= 3) {
      Alert.alert(
        'Impossibile Rimuovere',
        'Servono almeno 3 giocatori per continuare la partita.'
      );
      return;
    }

    Alert.alert(
      'Rimuovi Giocatore',
      `Sei sicuro di voler rimuovere ${player.name}? Perderà tutti i progressi.`,
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: () => {
            removePlayer(playerId);
          },
        },
      ]
    );
  };

  const openAddPlayerModal = () => {
    setNewPlayerName('');
    setInputError('');
    setShowAddPlayerModal(true);
  };

  const closeAddPlayerModal = () => {
    setNewPlayerName('');
    setInputError('');
    setShowAddPlayerModal(false);
  };

  const getMissionStateStatus = (state: MissionState): StatusType => {
    switch (state) {
      case MissionState.WAITING:
        return 'waiting';
      case MissionState.ACTIVE:
        return 'active';
      case MissionState.COMPLETED:
        return 'completed';
      case MissionState.CAUGHT:
        return 'caught';
      default:
        return 'waiting';
    }
  };

  const getGameProgress = () => {
    const totalPlayers = gameState.players.length;
    const playersWithCompletedMissions = gameState.players.filter(
      player => player.completedCount >= gameState.targetCompleted
    ).length;
    
    return {
      totalPlayers,
      playersWithCompletedMissions,
      percentage: totalPlayers > 0 ? (playersWithCompletedMissions / totalPlayers) * 100 : 0
    };
  };

  const progress = getGameProgress();

  const renderPlayerItem = ({ item: player }: { item: typeof gameState.players[0] }) => (
    <View style={[styles.playerCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <View style={styles.playerHeader}>
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>
            {player.name}
          </Text>
          {winner && winner.id === player.id && (
            <View style={[styles.winnerBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.winnerText}>Vincitore</Text>
            </View>
          )}
        </View>
        
        <Button
          title="Rimuovi"
          onPress={() => handleRemovePlayer(player.id)}
          variant="destructive"
          size="small"
        />
      </View>
      
      <View style={styles.playerStats}>
        <StatusIndicator 
          status={getMissionStateStatus(player.missionState)}
          size="medium"
          showLabel={true}
        />
        
        <Text style={[styles.completedCount, { color: theme.colors.textSecondary }]}>
          {player.completedCount}/{gameState.targetCompleted} completate
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard di Gioco</Text>
          <Text style={styles.subtitle}>
            Monitora il progresso della partita
          </Text>
        </View>

        {/* Game Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progresso Partita</Text>
          <View style={styles.progressStats}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{gameState.players.length}</Text>
              <Text style={styles.progressLabel}>Giocatori</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{progress.playersWithCompletedMissions}</Text>
              <Text style={styles.progressLabel}>Hanno Vinto</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{gameState.targetCompleted}</Text>
              <Text style={styles.progressLabel}>Obiettivo</Text>
            </View>
          </View>
          
          {winner && (
            <View style={styles.winnerAlert}>
              <Text style={styles.winnerAlertText}>
                🎉 {winner.name} ha vinto la partita!
              </Text>
            </View>
          )}
        </View>

        {/* Players List */}
        <View style={styles.playersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Giocatori ({gameState.players.length})
            </Text>
            <Button
              title="Aggiungi"
              onPress={openAddPlayerModal}
              variant="secondary"
              size="small"
            />
          </View>
          
          <FlatList
            data={gameState.players}
            renderItem={renderPlayerItem}
            keyExtractor={(item) => item.id}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.playersListContent}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.myTurnButton}
            onPress={handleMyTurn}
          >
            <Text style={styles.myTurnButtonText}>Vedi o aggiorna status missione</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.endGameButton}
            onPress={handleEndGame}
          >
            <Text style={styles.endGameButtonText}>Termina Partita</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Player Modal */}
      <Modal
        visible={showAddPlayerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeAddPlayerModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.backgroundPrimary }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.secondary }]}>
              Aggiungi Giocatore
            </Text>
            
            <Input
              placeholder="Nome giocatore"
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              error={inputError}
              containerStyle={styles.modalInput}
            />
            
            <View style={styles.modalActions}>
              <Button
                title="Annulla"
                onPress={closeAddPlayerModal}
                variant="secondary"
                size="medium"
                style={styles.modalButton}
              />
              <Button
                title="Aggiungi"
                onPress={handleAddPlayer}
                variant="primary"
                size="medium"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  winnerAlert: {
    backgroundColor: '#d5f4e6',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  winnerAlertText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '600',
    textAlign: 'center',
  },
  playersSection: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playersList: {
    flex: 1,
  },
  playersListContent: {
    paddingBottom: 16,
  },
  playerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  winnerBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  winnerText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedCount: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  actionButtons: {
    gap: 12,
  },
  myTurnButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  myTurnButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  endGameButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  endGameButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    marginBottom: 24, // Increased spacing between input and buttons
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16, // Increased gap between buttons
    marginTop: 8, // Added top margin for more spacing
  },
  modalButton: {
    flex: 1,
  },
});

export default GameDashboardScreen;