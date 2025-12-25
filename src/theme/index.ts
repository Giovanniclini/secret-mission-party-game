/**
 * Design System Theme
 * 
 * Exports all theme-related constants, types, and providers.
 */

export { 
  Colors, 
  LightColors, 
  DarkColors, 
  Spacing, 
  BorderRadius, 
  Typography, 
  Shadows, 
  getColors 
} from './constants';
export type { 
  ColorKey, 
  SpacingKey, 
  BorderRadiusKey, 
  TypographyKey, 
  ColorScheme 
} from './constants';

export { ThemeProvider, useTheme, useThemeColorScheme } from './ThemeProvider';
export type { DesignSystemTheme } from './ThemeProvider';