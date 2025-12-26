import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useGameContext, useGameActions } from '../store/GameContext';
import { DifficultyLevel, DifficultyMode, getDifficultyPoints, GameStatus } from '../models';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { validateGameConfiguration, sanitizeGameConfiguration } from '../utils/validation';
import { ErrorNotification } from '../components/ErrorNotification';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useTheme } from '../theme/ThemeProvider';

const GameConfigurationScreen: React.FC = () => {
  const router = useRouter();
  const { gameState } = useGameContext();
  const { configureGame, updateGameStatus } = useGameActions();
  const { error, clearError, handleAsyncError } = useErrorHandler();
  const theme = useTheme();

  const styles = createStyles(theme);

  // Reset status to SETUP when this screen gains focus (coming back from setup-players)
  useFocusEffect(
    React.useCallback(() => {
      if (gameState.status === GameStatus.CONFIGURING) {
        updateGameStatus(GameStatus.SETUP);
      }
    }, [gameState.status, updateGameStatus])
  );

  // Configuration state
  const [missionsPerPlayer, setMissionsPerPlayer] = useState<number>(3);
  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>(DifficultyMode.MIXED);
  const [uniformDifficulty, setUniformDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);

  const handleMissionCountChange = (count: number) => {
    // Validate and sanitize input
    const sanitizedCount = Math.max(1, Math.min(10, Math.floor(count)));
    if (sanitizedCount !== count) {
      // Show warning if input was corrected - use the error handler from component level
      console.warn('Il numero di missioni deve essere tra 1 e 10.');
    }
    setMissionsPerPlayer(sanitizedCount);
  };

  const handleDifficultyModeToggle = () => {
    setDifficultyMode(
      difficultyMode === DifficultyMode.UNIFORM 
        ? DifficultyMode.MIXED 
        : DifficultyMode.UNIFORM
    );
  };

  const handleUniformDifficultyChange = (difficulty: DifficultyLevel) => {
    setUniformDifficulty(difficulty);
  };

  const handleContinue = async () => {
    await handleAsyncError(async () => {
      // Create configuration object
      const rawConfiguration = {
        missionsPerPlayer,
        difficultyMode,
        uniformDifficulty: difficultyMode === DifficultyMode.UNIFORM ? uniformDifficulty : undefined
      };

      // Sanitize configuration
      const sanitizedConfiguration = sanitizeGameConfiguration(rawConfiguration);

      // Validate configuration
      const validation = validateGameConfiguration(sanitizedConfiguration);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Configurazione non valida');
      }

      // Apply configuration
      configureGame(sanitizedConfiguration);
      router.push('/setup-players');
    }, 'Errore durante la configurazione del gioco.');
  };

  const getDifficultyLabel = (difficulty: DifficultyLevel): string => {
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return 'Facile';
      case DifficultyLevel.MEDIUM:
        return 'Medio';
      case DifficultyLevel.HARD:
        return 'Difficile';
      default:
        return 'Sconosciuto';
    }
  };

  const getDifficultyModeLabel = (mode: DifficultyMode): string => {
    switch (mode) {
      case DifficultyMode.UNIFORM:
        return 'Stessa Difficoltà';
      case DifficultyMode.MIXED:
        return 'Difficoltà Mista';
      default:
        return 'Sconosciuto';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.backgroundPrimary} />
      
      <ErrorNotification
        message={error.message}
        visible={error.visible}
        onDismiss={clearError}
        type={error.type}
      />

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.secondary }, theme.typography.title2]}>
            Configurazione Partita
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }, theme.typography.callout]}>
            Personalizza le impostazioni del gioco
          </Text>
        </View>

        {/* Mission Count Configuration */}
        <Card style={styles.configCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }, theme.typography.headline]}>
            Missioni per Giocatore
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }, theme.typography.subhead]}>
            Scegli quante missioni ogni giocatore deve completare
          </Text>
          
          <View style={styles.missionCountContainer}>
            <View style={styles.missionCountControls}>
              <Button
                title="-"
                onPress={() => handleMissionCountChange(missionsPerPlayer - 1)}
                variant="secondary"
                size="small"
                disabled={missionsPerPlayer <= 1}
                style={styles.countButton}
              />
              <View style={[styles.countDisplay, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Text style={[styles.countText, { color: theme.colors.textPrimary }, theme.typography.title2]}>
                  {missionsPerPlayer}
                </Text>
              </View>
              <Button
                title="+"
                onPress={() => handleMissionCountChange(missionsPerPlayer + 1)}
                variant="secondary"
                size="small"
                disabled={missionsPerPlayer >= 10}
                style={styles.countButton}
              />
            </View>
            <Text style={[styles.countLabel, { color: theme.colors.textSecondary }, theme.typography.footnote]}>
              {missionsPerPlayer === 1 ? 'missione' : 'missioni'}
            </Text>
          </View>
        </Card>

        {/* Difficulty Mode Configuration */}
        <Card style={styles.configCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }, theme.typography.headline]}>
            Modalità Difficoltà
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }, theme.typography.subhead]}>
            Scegli come assegnare la difficoltà delle missioni
          </Text>
          
          <View style={styles.difficultyModeContainer}>
            <Button
              title={getDifficultyModeLabel(difficultyMode)}
              onPress={handleDifficultyModeToggle}
              variant={difficultyMode === DifficultyMode.UNIFORM ? "primary" : "secondary"}
              size="medium"
              style={styles.modeToggleButton}
            />
            
            <Text style={[styles.modeDescription, { color: theme.colors.textSecondary }, theme.typography.footnote]}>
              {difficultyMode === DifficultyMode.UNIFORM 
                ? 'Tutte le missioni avranno la stessa difficoltà'
                : 'I giocatori scelgono la difficoltà per ogni missione'
              }
            </Text>
          </View>
        </Card>

        {/* Uniform Difficulty Selector (only shown in uniform mode) */}
        {difficultyMode === DifficultyMode.UNIFORM && (
          <Card style={styles.configCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }, theme.typography.headline]}>
              Livello di Difficoltà
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }, theme.typography.subhead]}>
              Seleziona il livello di difficoltà per tutte le missioni
            </Text>
            
            <View style={styles.difficultySelector}>
              {Object.values(DifficultyLevel).map((difficulty) => (
                <Button
                  key={difficulty}
                  title={`${getDifficultyLabel(difficulty)} (${getDifficultyPoints(difficulty)} pt)`}
                  onPress={() => handleUniformDifficultyChange(difficulty)}
                  variant={uniformDifficulty === difficulty ? "primary" : "secondary"}
                  size="medium"
                  style={styles.difficultyButton}
                />
              ))}
            </View>
          </Card>
        )}

        {/* Point Values Information (only shown in mixed mode) */}
        {difficultyMode === DifficultyMode.MIXED && (
          <Card style={StyleSheet.flatten([styles.configCard, styles.infoCard])}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }, theme.typography.headline]}>
              Valori Punti
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }, theme.typography.subhead]}>
              Punti assegnati per difficoltà
            </Text>
            
            <View style={styles.pointsInfo}>
              {Object.values(DifficultyLevel).map((difficulty) => (
                <View key={difficulty} style={styles.pointsRow}>
                  <Text style={[styles.pointsLabel, { color: theme.colors.textPrimary }, theme.typography.callout]}>
                    {getDifficultyLabel(difficulty)}:
                  </Text>
                  <Text style={[styles.pointsValue, { color: theme.colors.primary }, theme.typography.callout]}>
                    {getDifficultyPoints(difficulty)} {getDifficultyPoints(difficulty) === 1 ? 'punto' : 'punti'}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Fixed Continue Button */}
      <View style={styles.fixedButtonContainer}>
        <Button
          title="Continua"
          onPress={handleContinue}
          variant="primary"
          size="large"
          style={styles.continueButton}
        />
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  configCard: {
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  sectionTitle: {
    ...theme.typography.headline,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  sectionDescription: {
    ...theme.typography.callout,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    opacity: 0.8,
    lineHeight: 20,
  },
  missionCountContainer: {
    alignItems: 'center',
  },
  missionCountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  countButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  countDisplay: {
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    minWidth: 80,
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundPrimary,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  countText: {
    ...theme.typography.title2,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  countLabel: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  difficultyModeContainer: {
    alignItems: 'center',
  },
  modeToggleButton: {
    marginBottom: theme.spacing.md,
    minWidth: 200,
  },
  modeDescription: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  difficultySelector: {
    gap: theme.spacing.md,
  },
  difficultyButton: {
    width: '100%',
  },
  pointsInfo: {
    gap: theme.spacing.md,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.backgroundPrimary,
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing.xs,
  },
  pointsLabel: {
    ...theme.typography.callout,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  pointsValue: {
    ...theme.typography.callout,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  fixedButtonContainer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backgroundSecondary,
  },
  continueButton: {
    width: '100%',
  },
});

export default withErrorBoundary(GameConfigurationScreen);