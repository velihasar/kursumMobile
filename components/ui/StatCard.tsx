import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  style,
}) => {
  const { palette } = useAppTheme();
  const activeColor = color || palette.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.textSecondary }]}>{title}</Text>
        <View style={[styles.iconBox, { backgroundColor: activeColor + '15' }]}>
          <Ionicons name={icon} size={20} color={activeColor} />
        </View>
      </View>
      <Text style={[styles.value, { color: palette.text }]}>{value}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: palette.textMuted }]}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
  },
});
