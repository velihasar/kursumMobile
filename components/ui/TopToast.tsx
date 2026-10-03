import React, { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/contexts/theme-context';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastState = {
  title: string;
  message?: string;
  type: ToastType;
};

export type ToastContextValue = {
  showToast: (title: string, message?: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const topToastRef = React.createRef<ToastContextValue>();

export function TopToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const translateY = useRef(new Animated.Value(-120)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const hide = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [translateY]);

  const showToast = useCallback(
    (title: string, message?: string, type: ToastType = 'info') => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      setToast({ title, message, type });
      translateY.setValue(-120);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      hideTimerRef.current = setTimeout(hide, 3000);
    },
    [hide, translateY]
  );

  const ctx = useMemo(() => ({ showToast }), [showToast]);

  // Set global ref for usage outside of hooks
  (topToastRef as any).current = ctx;

  const getTypeConfig = () => {
    switch (toast?.type) {
      case 'success':
        return {
          bg: '#10B981',
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          bg: '#EF4444',
          icon: 'alert-circle' as const,
        };
      case 'warning':
        return {
          bg: '#F59E0B',
          icon: 'warning' as const,
        };
      default:
        return {
          bg: '#4F46E5',
          icon: 'information-circle' as const,
        };
    }
  };

  const config = getTypeConfig();

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            { top: Math.max(insets.top + 8, 16), transform: [{ translateY }] },
          ]}
        >
          <View style={[styles.toast, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={22} color="#FFFFFF" />
            <View style={styles.textWrap}>
              <Text style={styles.title}>{toast.title}</Text>
              {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
            </View>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useTopToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useTopToast must be used within TopToastProvider');
  }
  return ctx;
}

export const showToast = (title: string, message?: string, type?: ToastType) => {
  if (topToastRef.current?.showToast) {
    topToastRef.current.showToast(title, message, type);
  }
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    opacity: 0.92,
  },
});
