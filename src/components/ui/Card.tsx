import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  padding = true,
}) => {
  const theme = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.backgroundPrimary,
      borderRadius: theme.borderRadius.medium,
    };

    if (padding) {
      baseStyle.padding = theme.spacing.md;
    }

    const variantStyles: Record<CardVariant, ViewStyle> = {
      default: {
        ...theme.shadows.small,
      },
      elevated: {
        ...theme.shadows.medium,
      },
      outlined: {
        borderWidth: 1,
        borderColor: theme.colors.backgroundSecondary,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};