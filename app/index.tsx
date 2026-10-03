import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';

export default function EntryScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { palette } = useAppTheme();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={[styles.logoBox, { backgroundColor: palette.primaryLight }]}>
        <Ionicons name="school" size={48} color={palette.primary} />
      </View>
      <Text style={[styles.title, { color: palette.text }]}>Kursum Mobile</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Yükleniyor...</Text>
      <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoBox: {
    width: 90,
    height: 90,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});
