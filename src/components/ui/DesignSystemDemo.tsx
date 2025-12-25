import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { StatusIndicator } from './StatusIndicator';

/**
 * Design System Demo Component
 * 
 * This component demonstrates all the design system components and their usage.
 * It serves as a reference for developers and can be used for testing the design system.
 */
export const DesignSystemDemo: React.FC = () => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const handleInputChange = (text: string) => {
    setInputValue(text);
    if (text.length < 2) {
      setInputError('Minimo 2 caratteri');
    } else {
      setInputError('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.section, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <Text style={[theme.typography.title1, { color: theme.colors.textPrimary }]}>
          Design System Demo
        </Text>
        
        {/* Colors Section */}
        <Card style={styles.card}>
          <Text style={[theme.typography.headline, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
            Colori
          </Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.colors.primary }]} />
            <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>Primary (Gold)</Text>
          </View>
          <View style={styles.colorRow}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.colors.secondary }]} />
            <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>Secondary (Navy)</Text>
          </View>
          <View style={styles.colorRow}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.colors.accent }]} />
            <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>Accent (Teal)</Text>
          </View>
        </Card>

        {/* Buttons Section */}
        <Card style={styles.card}>
          <Text style={[theme.typography.headline, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
            Bottoni
          </Text>
          <View style={styles.buttonRow}>
            <Button title="Primary" onPress={() => {}} variant="primary" size="medium" />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Secondary" onPress={() => {}} variant="secondary" size="medium" />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Destructive" onPress={() => {}} variant="destructive" size="medium" />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Disabled" onPress={() => {}} variant="primary" size="medium" disabled />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Loading" onPress={() => {}} variant="primary" size="medium" loading />
          </View>
        </Card>

        {/* Input Section */}
        <Card style={styles.card}>
          <Text style={[theme.typography.headline, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
            Input
          </Text>
          <Input
            label="Nome Giocatore"
            placeholder="Inserisci il nome"
            value={inputValue}
            onChangeText={handleInputChange}
            error={inputError}
            helperText="Inserisci un nome di almeno 2 caratteri"
          />
        </Card>

        {/* Status Indicators Section */}
        <Card style={styles.card}>
          <Text style={[theme.typography.headline, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
            Indicatori di Stato
          </Text>
          <View style={styles.statusRow}>
            <StatusIndicator status="active" size="medium" />
          </View>
          <View style={styles.statusRow}>
            <StatusIndicator status="completed" size="medium" />
          </View>
          <View style={styles.statusRow}>
            <StatusIndicator status="caught" size="medium" />
          </View>
          <View style={styles.statusRow}>
            <StatusIndicator status="waiting" size="medium" />
          </View>
        </Card>

        {/* Typography Section */}
        <Card style={styles.card}>
          <Text style={[theme.typography.headline, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
            Tipografia
          </Text>
          <Text style={[theme.typography.title1, { color: theme.colors.textPrimary }]}>Title 1</Text>
          <Text style={[theme.typography.title2, { color: theme.colors.textPrimary }]}>Title 2</Text>
          <Text style={[theme.typography.headline, { color: theme.colors.textPrimary }]}>Headline</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>Body</Text>
          <Text style={[theme.typography.callout, { color: theme.colors.textPrimary }]}>Callout</Text>
          <Text style={[theme.typography.subhead, { color: theme.colors.textPrimary }]}>Subhead</Text>
          <Text style={[theme.typography.footnote, { color: theme.colors.textPrimary }]}>Footnote</Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textPrimary }]}>Caption</Text>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  card: {
    marginVertical: 8,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  buttonRow: {
    marginVertical: 4,
  },
  statusRow: {
    marginVertical: 8,
  },
});