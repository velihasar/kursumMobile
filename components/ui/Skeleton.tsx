import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '@/contexts/theme-context';

interface SkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { isDark } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  const bg = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: bg,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Pre-built Skeleton for Home / Dashboard tab
 */
export function DashboardSkeleton() {
  const { palette } = useAppTheme();

  return (
    <View style={styles.skeletonContainer}>
      {/* Student Card Skeleton */}
      <View style={[styles.skeletonCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.row}>
          <Skeleton width={44} height={44} borderRadius={14} />
          <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
            <Skeleton width="40%" height={12} borderRadius={6} />
            <Skeleton width="70%" height={18} borderRadius={8} />
          </View>
        </View>
        <Skeleton width="100%" height={68} borderRadius={16} style={{ marginTop: 14 }} />
      </View>

      {/* 3 Quick Action Cards Skeleton */}
      <View style={styles.quickActionsRow}>
        <Skeleton width="31%" height={74} borderRadius={18} />
        <Skeleton width="31%" height={74} borderRadius={18} />
        <Skeleton width="31%" height={74} borderRadius={18} />
      </View>

      {/* Events Title & Cards Skeleton */}
      <View style={{ marginTop: 10, gap: 10 }}>
        <Skeleton width="45%" height={16} borderRadius={6} />
        <View style={styles.row}>
          <Skeleton width={260} height={120} borderRadius={20} />
          <Skeleton width={260} height={120} borderRadius={20} style={{ marginLeft: 12 }} />
        </View>
      </View>

      {/* Announcements Title & Cards Skeleton */}
      <View style={{ marginTop: 16, gap: 10 }}>
        <Skeleton width="40%" height={16} borderRadius={6} />
        <Skeleton width="100%" height={80} borderRadius={18} />
        <Skeleton width="100%" height={80} borderRadius={18} />
      </View>
    </View>
  );
}

/**
 * Pre-built Skeleton for Cuzdan (Wallet) tab
 */
export function WalletSkeleton() {
  const { palette } = useAppTheme();

  return (
    <View style={styles.skeletonContainer}>
      {/* Digital Card Skeleton */}
      <Skeleton width="100%" height={150} borderRadius={22} style={{ marginBottom: 14 }} />

      {/* Dues Card Skeleton */}
      <View style={[styles.skeletonCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.rowBetween}>
          <Skeleton width="50%" height={16} borderRadius={6} />
          <Skeleton width={70} height={22} borderRadius={12} />
        </View>
        <Skeleton width="100%" height={56} borderRadius={16} style={{ marginTop: 14 }} />
      </View>

      {/* Filter Chips Skeleton */}
      <View style={[styles.row, { gap: 8, marginVertical: 10 }]}>
        <Skeleton width={70} height={32} borderRadius={16} />
        <Skeleton width={120} height={32} borderRadius={16} />
        <Skeleton width={80} height={32} borderRadius={16} />
      </View>

      {/* Transactions List Skeleton */}
      <View style={{ gap: 10, marginTop: 6 }}>
        <Skeleton width="45%" height={16} borderRadius={6} />
        <Skeleton width="100%" height={64} borderRadius={18} />
        <Skeleton width="100%" height={64} borderRadius={18} />
        <Skeleton width="100%" height={64} borderRadius={18} />
      </View>
    </View>
  );
}

/**
 * Pre-built Skeleton for Yoklama (Attendance) tab
 */
export function AttendanceSkeleton() {
  const { palette } = useAppTheme();

  return (
    <View style={styles.skeletonContainer}>
      {/* Overall Rate Card */}
      <View style={[styles.skeletonCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.rowBetween}>
          <View style={{ gap: 8, flex: 1 }}>
            <Skeleton width="40%" height={12} borderRadius={6} />
            <Skeleton width="30%" height={32} borderRadius={8} />
            <Skeleton width="60%" height={12} borderRadius={6} />
          </View>
          <Skeleton width={60} height={60} borderRadius={18} />
        </View>
      </View>

      {/* 3 Metric Boxes */}
      <View style={[styles.row, { gap: 8, marginVertical: 10 }]}>
        <Skeleton width="31%" height={74} borderRadius={18} />
        <Skeleton width="31%" height={74} borderRadius={18} />
        <Skeleton width="31%" height={74} borderRadius={18} />
      </View>

      {/* Filter Chips */}
      <View style={[styles.row, { gap: 8, marginBottom: 12 }]}>
        <Skeleton width={60} height={30} borderRadius={15} />
        <Skeleton width={70} height={30} borderRadius={15} />
        <Skeleton width={80} height={30} borderRadius={15} />
        <Skeleton width={70} height={30} borderRadius={15} />
      </View>

      {/* Records List Skeleton */}
      <View style={{ gap: 10 }}>
        <Skeleton width="45%" height={16} borderRadius={6} />
        <Skeleton width="100%" height={68} borderRadius={18} />
        <Skeleton width="100%" height={68} borderRadius={18} />
        <Skeleton width="100%" height={68} borderRadius={18} />
      </View>
    </View>
  );
}

/**
 * Pre-built Skeleton for Dersler (Courses) tab
 */
export function CoursesSkeleton() {
  const { palette } = useAppTheme();

  return (
    <View style={styles.skeletonContainer}>
      {/* Days Horizontal Pill Bar */}
      <View style={[styles.row, { gap: 8, marginBottom: 14 }]}>
        <Skeleton width={65} height={60} borderRadius={16} />
        <Skeleton width={65} height={60} borderRadius={16} />
        <Skeleton width={65} height={60} borderRadius={16} />
        <Skeleton width={65} height={60} borderRadius={16} />
        <Skeleton width={65} height={60} borderRadius={16} />
      </View>

      {/* Course Cards Skeleton */}
      <View style={{ gap: 12 }}>
        <Skeleton width="50%" height={16} borderRadius={6} />
        <View style={[styles.skeletonCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Skeleton width="70%" height={20} borderRadius={8} />
          <Skeleton width="50%" height={14} borderRadius={6} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={40} borderRadius={12} style={{ marginTop: 14 }} />
        </View>
        <View style={[styles.skeletonCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Skeleton width="60%" height={20} borderRadius={8} />
          <Skeleton width="40%" height={14} borderRadius={6} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={40} borderRadius={12} style={{ marginTop: 14 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    gap: 12,
  },
  skeletonCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
});
