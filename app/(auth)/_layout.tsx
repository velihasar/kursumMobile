import React from 'react';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/contexts/theme-context';

export default function AuthLayout() {
  const { palette } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    />
  );
}
