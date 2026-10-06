import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '@/contexts/theme-context';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'accent';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', style }) => {
  const { palette } = useAppTheme();

  const getColors = () => {
    switch (variant) {
      case 'success': return { bg: palette.successBg, text: palette.success };
      case 'warning': return { bg: palette.warningBg, text: palette.warning };
      case 'danger': return { bg: palette.dangerBg, text: palette.danger };
      case 'info': return { bg: palette.infoBg, text: palette.info };
      case 'accent': return { bg: palette.accentLight, text: palette.accent };
      default: return { bg: palette.primaryLight, text: palette.primary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
