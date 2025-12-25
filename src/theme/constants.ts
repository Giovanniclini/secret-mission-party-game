/**
 * Design System Constants
 * 
 * Mandatory color palette and design system values as specified in the design document.
 * These values must be used consistently across all components.
 */

export const LightColors = {
  // Primary / Brand (CTA)
  primary: '#F5B301',
  
  // Secondary (headers, nav)
  secondary: '#1F2A44',
  
  // Accent (active, focus)
  accent: '#2EC4C6',
  
  // Text colors
  textPrimary: '#2B2B2B',
  textSecondary: '#6B7280',
  
  // Background colors
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F5F6F8',
  
  // Status colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  
  // Mission state colors
  missionActive: '#2EC4C6',    // Teal for active missions
  missionCompleted: '#10B981', // Green for completed missions
  missionCaught: '#EF4444',    // Red for caught missions
  missionWaiting: '#6B7280',   // Gray for waiting missions
} as const;

export const DarkColors = {
  // Primary / Brand (CTA) - slightly brighter for dark mode
  primary: '#FFD700',
  
  // Secondary (headers, nav) - lighter for contrast
  secondary: '#E5E7EB',
  
  // Accent (active, focus) - slightly brighter
  accent: '#34D399',
  
  // Text colors - inverted for dark mode
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  
  // Background colors - dark variants
  backgroundPrimary: '#111827',
  backgroundSecondary: '#1F2937',
  
  // Status colors - adjusted for dark mode visibility
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
  
  // Mission state colors - adjusted for dark mode
  missionActive: '#34D399',    // Brighter green for active missions
  missionCompleted: '#10B981', // Keep green for completed missions
  missionCaught: '#F87171',    // Lighter red for caught missions
  missionWaiting: '#9CA3AF',   // Lighter gray for waiting missions
} as const;

// Default to light colors for backward compatibility
export const Colors = LightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
} as const;

export const Typography = {
  // iOS SF Pro style hierarchy
  title1: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    lineHeight: 28,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: 'normal' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 21,
  },
  subhead: {
    fontSize: 15,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: 'normal' as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
} as const;

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

export type ColorKey = keyof typeof LightColors;
export type SpacingKey = keyof typeof Spacing;
export type BorderRadiusKey = keyof typeof BorderRadius;
export type TypographyKey = keyof typeof Typography;

export type ColorScheme = 'light' | 'dark';

export const getColors = (colorScheme: ColorScheme) => {
  return colorScheme === 'dark' ? DarkColors : LightColors;
};