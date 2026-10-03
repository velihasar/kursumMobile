import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '@/contexts/theme-context';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { palette } = useAppTheme();

  const getBackgroundColor = () => {
    if (disabled) return palette.border;
    switch (variant) {
      case 'primary': return palette.primary;
      case 'secondary': return palette.card;
      case 'outline': return 'transparent';
      case 'danger': return palette.danger;
      case 'ghost': return 'transparent';
      default: return palette.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return palette.textMuted;
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return palette.text;
      case 'outline': return palette.primary;
      case 'danger': return '#FFFFFF';
      case 'ghost': return palette.textSecondary;
      default: return '#FFFFFF';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: 8, paddingHorizontal: 12 };
      case 'lg': return { paddingVertical: 16, paddingHorizontal: 24 };
      default: return { paddingVertical: 12, paddingHorizontal: 18 };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? palette.primary : palette.border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
