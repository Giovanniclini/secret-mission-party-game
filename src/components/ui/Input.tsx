import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getInputStyle = (): TextStyle => {
    return {
      borderWidth: 1,
      borderColor: error 
        ? theme.colors.error 
        : isFocused 
          ? theme.colors.accent 
          : theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.backgroundPrimary,
      minHeight: 48,
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.textPrimary,
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      ...theme.typography.subhead,
      color: error ? theme.colors.error : theme.colors.secondary,
      marginBottom: theme.spacing.xs,
      fontWeight: '600',
    };
  };

  const getHelperTextStyle = (): TextStyle => {
    return {
      ...theme.typography.footnote,
      color: error ? theme.colors.error : theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    };
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={[getLabelStyle(), labelStyle]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[getInputStyle(), inputStyle]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={theme.colors.textSecondary}
        {...textInputProps}
      />
      {(error || helperText) && (
        <Text style={getHelperTextStyle()}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};