import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/src/theme/constants';
import { useGameContext } from '@/src/store/GameContext';
import { GameStatus } from '@/src/models';

export default function TabLayout() {
  const { gameState } = useGameContext();
  
  // Show current game tab only if there's an active game
  const showCurrentGameTab = gameState.status !== GameStatus.SETUP;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.backgroundPrimary,
          borderTopColor: Colors.backgroundSecondary,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Partita Attuale',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gamecontroller.fill" color={color} />,
          href: showCurrentGameTab ? '/explore' : null, // Hide tab when no active game
        }}
      />
    </Tabs>
  );
}
