import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export type StatusType = 'active' | 'completed' | 'caught' | 'waiting';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: ViewStyle;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'medium',
  showLabel = true,
  style,
}) => {
  const theme = useTheme();

  const getStatusColor = (status: StatusType): string => {
    switch (status) {
      case 'active':
        return theme.colors.missionActive;
      case 'completed':
        return theme.colors.missionCompleted;
      case 'caught':
        return theme.colors.missionCaught;
      case 'waiting':
        return theme.colors.missionWaiting;
      default:
        return theme.colors.missionWaiting;
    }
  };

  const getStatusLabel = (status: StatusType): string => {
    if (label) return label;
    
    switch (status) {
      case 'active':
        return 'Attiva';
      case 'completed':
        return 'Completata';
      case 'caught':
        return 'Scoperta';
      case 'waiting':
        return 'In attesa';
      default:
        return 'Sconosciuto';
    }
  };

  const getDotSize = (size: 'small' | 'medium' | 'large'): number => {
    switch (size) {
      case 'small':
        return 8;
      case 'medium':
        return 12;
      case 'large':
        return 16;
      default:
        return 12;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = size === 'small' 
      ? theme.typography.footnote 
      : theme.typography.subhead;
    
    return {
      ...baseStyle,
      color: theme.colors.textPrimary,
      marginLeft: theme.spacing.sm,
    };
  };

  const dotSize = getDotSize(size);
  const statusColor = getStatusColor(status);

  return (
    <View style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
      },
      style
    ]}>
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: statusColor,
        }}
      />
      {showLabel && (
        <Text style={getTextStyle()}>
          {getStatusLabel(status)}
        </Text>
      )}
    </View>
  );
};