import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';

export default function EntryScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { palette, isDark } = useAppTheme();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F5F6F8' }]}>
      <Image
        source={require('@/assets/images/splash-icon.png')}
        style={styles.splashIcon}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 28 }} />
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
  splashIcon: {
    width: 172,
    height: 172,
  },
});
