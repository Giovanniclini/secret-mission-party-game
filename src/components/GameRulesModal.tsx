import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme';

interface GameRulesModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

const GameRulesModal: React.FC<GameRulesModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Regole del Gioco</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          
          {/* Obiettivo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Obiettivo del Gioco</Text>
            <Text style={styles.text}>
              Completa le tue missioni segrete senza essere scoperto dagli altri giocatori. 
              Vince chi accumula più punti completando le missioni!
            </Text>
          </View>

          {/* Setup */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Preparazione</Text>
            <Text style={styles.text}>
              1. Configura il numero di missioni per giocatore (1-10)
            </Text>
            <Text style={styles.text}>
              2. Scegli la modalità difficoltà:
            </Text>
            <Text style={styles.bulletText}>
              • <Text style={styles.bold}>Uniforme:</Text> Tutte le missioni hanno la stessa difficoltà
            </Text>
            <Text style={styles.bulletText}>
              • <Text style={styles.bold}>Mista:</Text> Ogni giocatore sceglie la difficoltà per ogni missione
            </Text>
            <Text style={styles.text}>
              3. Aggiungi i giocatori (minimo 3)
            </Text>
            <Text style={styles.text}>
              4. Assegna le missioni segrete a ogni giocatore
            </Text>
          </View>

          {/* Gameplay */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎮 Come si Gioca</Text>
            <Text style={styles.text}>
              <Text style={styles.bold}>Fase 1 - Rivelazione Missioni:</Text>
            </Text>
            <Text style={styles.bulletText}>
              • Ogni giocatore riceve le sue missioni segrete
            </Text>
            <Text style={styles.bulletText}>
              • Usa il pulsante "Tieni premuto per rivelare" per vedere le tue missioni
            </Text>
            <Text style={styles.bulletText}>
              • Assicurati che nessun altro stia guardando!
            </Text>
            
            <Text style={styles.text}>
              <Text style={styles.bold}>Fase 2 - Esecuzione:</Text>
            </Text>
            <Text style={styles.bulletText}>
              • Cerca di completare le tue missioni nella vita reale
            </Text>
            <Text style={styles.bulletText}>
              • Mantieni il segreto sulle tue missioni
            </Text>
            <Text style={styles.bulletText}>
              • Osserva gli altri giocatori per scoprire le loro missioni
            </Text>
          </View>

          {/* Scoring */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Punteggio</Text>
            <Text style={styles.text}>
              <Text style={styles.bold}>Punti per Difficoltà:</Text>
            </Text>
            <Text style={styles.bulletText}>
              • <Text style={styles.bold}>Facile:</Text> 1 punto
            </Text>
            <Text style={styles.bulletText}>
              • <Text style={styles.bold}>Medio:</Text> 2 punti
            </Text>
            <Text style={styles.bulletText}>
              • <Text style={styles.bold}>Difficile:</Text> 3 punti
            </Text>
            
            <Text style={styles.text}>
              <Text style={styles.bold}>Stati delle Missioni:</Text>
            </Text>
            <Text style={styles.bulletText}>
              • <Text style={styles.bold}>Completata:</Text> Hai completato la missione con successo
            </Text>
            <Text style={styles.bulletText}>
              • <Text style={styles.bold}>Scoperta:</Text> Altri giocatori hanno indovinato la tua missione
            </Text>
            <Text style={styles.bulletText}>
              • <Text style={styles.bold}>In corso:</Text> Missione ancora attiva
            </Text>
          </View>

          {/* Victory */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🥇 Vittoria</Text>
            <Text style={styles.text}>
              Vince il giocatore con più punti totali. In caso di parità, vince chi ha il tempo medio 
              di completamento più basso.
            </Text>
          </View>

          {/* Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Consigli</Text>
            <Text style={styles.bulletText}>
              • Sii discreto nell'eseguire le tue missioni
            </Text>
            <Text style={styles.bulletText}>
              • Osserva attentamente gli altri giocatori
            </Text>
            <Text style={styles.bulletText}>
              • Usa la dashboard per monitorare i progressi
            </Text>
            <Text style={styles.bulletText}>
              • Ricorda: il timing è tutto!
            </Text>
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.gotItButton}>
            <Text style={styles.gotItButtonText}>Ho Capito!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundSecondary,
  },
  title: {
    ...theme.typography.title2,
    color: theme.colors.secondary,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...theme.typography.headline,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.title2,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    fontSize: 18, // Slightly smaller than title2
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  bulletText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.md,
  },
  bold: {
    fontWeight: 'bold',
    color: theme.colors.secondary,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backgroundSecondary,
  },
  gotItButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  gotItButtonText: {
    ...theme.typography.headline,
    color: theme.colors.backgroundPrimary,
    fontWeight: 'bold',
  },
});

export default GameRulesModal;