import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { getColors, Spacing, BorderRadius, Typography, Shadows, ColorScheme } from './constants';

/**
 * Design System Theme Interface
 * 
 * Provides access to all design system values throughout the application.
 */
export interface DesignSystemTheme {
  colors: ReturnType<typeof getColors>;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  typography: typeof Typography;
  shadows: typeof Shadows;
  colorScheme: ColorScheme;
}

const ThemeContext = createContext<DesignSystemTheme | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  forcedColorScheme?: ColorScheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  forcedColorScheme 
}) => {
  const deviceColorScheme = useColorScheme();
  const colorScheme: ColorScheme = forcedColorScheme || (deviceColorScheme === 'dark' ? 'dark' : 'light');
  
  const theme: DesignSystemTheme = {
    colors: getColors(colorScheme),
    spacing: Spacing,
    borderRadius: BorderRadius,
    typography: Typography,
    shadows: Shadows,
    colorScheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access the design system theme
 * 
 * @returns The current design system theme
 */
export const useTheme = (): DesignSystemTheme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook to get the current color scheme from the theme
 * 
 * @returns The current color scheme ('light' or 'dark')
 */
export const useThemeColorScheme = (): ColorScheme => {
  const theme = useTheme();
  return theme.colorScheme;
};

export default ThemeProvider;