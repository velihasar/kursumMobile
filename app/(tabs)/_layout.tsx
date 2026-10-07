import React, { useRef } from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, Animated, StyleSheet, View } from 'react-native';

function AnimatedTabButton({ children, onPress }: any) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = (e: any) => {
    scale.setValue(1);

    // Crisp, subtle tap micro-animation without wobbling
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.90,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7, // High damping removes excessive oscillations
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress(e);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={null}
      style={({ pressed }) => [
        styles.tabButton,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Animated.View
        style={[
          styles.tabButtonInner,
          { transform: [{ scale }] },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 14);
  const tabHeight = 54 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
        tabBarStyle: {
          backgroundColor: palette.tabBar,
          borderTopColor: palette.tabBarBorder,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.03,
          shadowRadius: 10,
          elevation: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Anasayfa',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons
                name={focused ? 'grid' : 'grid-outline'}
                size={22}
                color={color}
              />
              {focused && <View style={[styles.activeDot, { backgroundColor: palette.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dersler"
        options={{
          title: 'Dersler',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                size={22}
                color={color}
              />
              {focused && <View style={[styles.activeDot, { backgroundColor: palette.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="yoklama"
        options={{
          title: 'Yoklama',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons
                name={focused ? 'checkbox' : 'checkbox-outline'}
                size={22}
                color={color}
              />
              {focused && <View style={[styles.activeDot, { backgroundColor: palette.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cuzdan"
        options={{
          title: 'Cüzdan',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons
                name={focused ? 'wallet' : 'wallet-outline'}
                size={22}
                color={color}
              />
              {focused && <View style={[styles.activeDot, { backgroundColor: palette.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={color}
              />
              {focused && <View style={[styles.activeDot, { backgroundColor: palette.primary }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
