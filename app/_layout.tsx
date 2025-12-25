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
      <CustomThemeProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="setup-players" 
              options={{ 
                title: 'Configurazione Giocatori',
                headerBackVisible: false, // Disable back button
                gestureEnabled: false, // Disable swipe back gesture on iOS
                presentation: 'card'
              }} 
            />
            <Stack.Screen 
              name="assign-missions" 
              options={{ 
                title: 'Assegnazione Missioni',
                headerBackVisible: false, // Disable back button
                gestureEnabled: false, // Disable swipe back gesture on iOS
                presentation: 'card'
              }} 
            />
            <Stack.Screen 
              name="game-dashboard" 
              options={{ 
                title: 'Dashboard di Gioco',
                headerBackVisible: false, // Disable back button
                gestureEnabled: false, // Disable swipe back gesture on iOS
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
