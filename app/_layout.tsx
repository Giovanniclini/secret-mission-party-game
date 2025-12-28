import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GameProvider } from '@/src/store/GameContext';
import { ThemeProvider as CustomThemeProvider } from '@/src/theme/ThemeProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GameProvider>
      <CustomThemeProvider forcedColorScheme={colorScheme === 'dark' ? 'dark' : 'light'}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
            <Stack.Screen 
              name="game-configuration" 
              options={{ 
                title: 'Configurazione Partita',
                headerBackVisible: true,
                headerBackTitle: '',
                gestureEnabled: true,
                presentation: 'card'
              }} 
            />
            <Stack.Screen 
              name="setup-players" 
              options={{ 
                title: 'Configurazione Giocatori',
                headerBackVisible: true, // Enable back button to go to game-configuration
                headerBackTitle: ' ', // Use a space to hide the back button text
                gestureEnabled: true, // Enable swipe back gesture on iOS
                presentation: 'card'
              }} 
            />
            <Stack.Screen 
              name="assign-missions" 
              options={{ 
                title: 'Assegnazione Missioni',
                headerBackVisible: true, // Enable back button to go to setup-players
                headerBackTitle: ' ', // Use a space to hide the back button text
                gestureEnabled: true, // Enable swipe back gesture on iOS
                presentation: 'card'
              }} 
            />
            <Stack.Screen 
              name="my-turn" 
              options={{ 
                title: 'Vedi o aggiorna status missione',
                headerBackVisible: false, // Disable back button
                gestureEnabled: false, // Disable swipe back gesture on iOS
                presentation: 'card'
              }} 
            />
            <Stack.Screen 
              name="end-game" 
              options={{ 
                title: 'Fine Partita',
                headerBackVisible: false, // Disable back button
                gestureEnabled: false, // Disable swipe back gesture on iOS
                presentation: 'card'
              }} 
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </CustomThemeProvider>
    </GameProvider>
  );
}
