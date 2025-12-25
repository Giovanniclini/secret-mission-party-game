import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/src/theme';
import { useGameContext } from '@/src/store/GameContext';
import { GameStatus } from '@/src/models';

export default function TabLayout() {
  const { gameState } = useGameContext();
  const theme = useTheme();
  
  // Show current game tab only if there's an active game
  const showCurrentGameTab = gameState.status !== GameStatus.SETUP;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundPrimary,
          borderTopColor: theme.colors.backgroundSecondary,
        },
        title: '', // Set empty title for the tab group
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '', // Empty title to prevent it from showing in back button
          tabBarLabel: 'Home', // Keep the tab label as Home
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '', // Empty title to prevent it from showing in back button
          tabBarLabel: 'Dashboard', // Keep the tab label as Dashboard
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gamecontroller.fill" color={color} />,
          href: showCurrentGameTab ? '/explore' : null, // Hide tab when no active game
        }}
      />
    </Tabs>
  );
}
