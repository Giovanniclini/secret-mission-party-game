import React, { createContext, useContext, ReactNode } from 'react';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from './constants';

/**
 * Design System Theme Interface
 * 
 * Provides access to all design system values throughout the application.
 */
export interface DesignSystemTheme {
  colors: typeof Colors;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  typography: typeof Typography;
  shadows: typeof Shadows;
}

const defaultTheme: DesignSystemTheme = {
  colors: Colors,
  spacing: Spacing,
  borderRadius: BorderRadius,
  typography: Typography,
  shadows: Shadows,
};

const ThemeContext = createContext<DesignSystemTheme>(defaultTheme);

interface ThemeProviderProps {
  children: ReactNode;
  theme?: DesignSystemTheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  theme = defaultTheme 
}) => {
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

export default ThemeProvider;