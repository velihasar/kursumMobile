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
        <Text style={[styles.title, { color: palette.textSecondary }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.iconBox, { backgroundColor: activeColor + '15' }]}>
          <Ionicons name={icon} size={16} color={activeColor} />
        </View>
      </View>
      <Text style={[styles.value, { color: palette.text }]} numberOfLines={1}>
        {value}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: palette.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginRight: 4,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 2,
  },
});
