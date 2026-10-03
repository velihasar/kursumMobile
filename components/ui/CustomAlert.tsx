import React, { useState, useLayoutEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated, Alert as RNAlert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/contexts/theme-context';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'default';

export type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type AlertOptions = {
  title: string;
  message?: string;
  type?: AlertType;
  icon?: keyof typeof Ionicons.glyphMap;
  buttons?: AlertButton[];
};

export const customAlertRef = React.createRef<any>();

export const CustomAlert = () => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const { isDark, palette } = useAppTheme();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useLayoutEffect(() => {
    (customAlertRef as any).current = {
      alert: (
        title: string,
        message?: string,
        buttons?: AlertButton[],
        type: AlertType = 'default',
        icon?: keyof typeof Ionicons.glyphMap
      ) => {
        // Auto-infer type if not explicitly provided
        let inferredType = type;
        if (type === 'default') {
          const lower = (title + ' ' + (message || '')).toLowerCase();
          if (lower.includes('başarılı') || lower.includes('aktifleştirildi') || lower.includes('kaydedildi') || lower.includes('tamamlandı') || lower.includes('🎉')) {
            inferredType = 'success';
          } else if (lower.includes('hata') || lower.includes('başarısız') || lower.includes('yanlış') || lower.includes('geçersiz')) {
            inferredType = 'error';
          } else if (lower.includes('uyarı') || lower.includes('dikkat') || lower.includes('zaten mevcut') || lower.includes('zaten')) {
            inferredType = 'warning';
          }
        }

        setOptions({
          title,
          message,
          type: inferredType,
          icon,
          buttons: buttons || [{ text: 'Tamam', style: 'default' }],
        });
        setVisible(true);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 45,
            useNativeDriver: true,
          }),
        ]).start();
      },
      close: () => {
        closeModal();
      },
    };
    return () => {
      (customAlertRef as any).current = null;
    };
  }, [fadeAnim, scaleAnim]);

  const closeModal = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setOptions(null);
      if (callback) callback();
    });
  };

  if (!visible || !options) return null;

  const handlePress = (button: AlertButton) => {
    closeModal(() => {
      if (button.onPress) {
        button.onPress();
      }
    });
  };

  const alertType = options.type || 'default';

  const getTypeStyle = () => {
    switch (alertType) {
      case 'success':
        return {
          icon: options.icon || 'checkmark-circle-outline',
          iconColor: palette.success,
          badgeBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
          btnBg: palette.success,
        };
      case 'error':
        return {
          icon: options.icon || 'close-circle-outline',
          iconColor: palette.danger,
          badgeBg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
          btnBg: palette.danger,
        };
      case 'warning':
        return {
          icon: options.icon || 'alert-circle-outline',
          iconColor: palette.warning,
          badgeBg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
          btnBg: palette.warning,
        };
      default:
        return {
          icon: options.icon || 'sparkles-outline',
          iconColor: palette.primary,
          badgeBg: isDark ? 'rgba(44, 152, 246, 0.15)' : '#E8F4FE',
          btnBg: palette.primary,
        };
    }
  };

  const typeConfig = getTypeStyle();
  const isMultiButton = (options.buttons?.length || 0) > 1;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeModal()}>
          <BlurView intensity={isDark ? 35 : 20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        </Pressable>

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header Icon Badge */}
          <View style={[styles.iconBadge, { backgroundColor: typeConfig.badgeBg }]}>
            <Ionicons name={typeConfig.icon as any} size={36} color={typeConfig.iconColor} />
          </View>

          {/* Texts */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: palette.text }]}>{options.title}</Text>
            {options.message ? (
              <Text style={[styles.message, { color: palette.textSecondary }]}>{options.message}</Text>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View style={[styles.buttonContainer, isMultiButton && styles.multiButtonRow]}>
            {options.buttons?.map((btn, idx) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              let btnBg = isCancel ? 'transparent' : isDestructive ? palette.danger : typeConfig.btnBg;
              let textColor = isCancel ? palette.textSecondary : '#FFFFFF';
              let borderColor = isCancel ? (isDark ? '#334155' : '#CBD5E1') : 'transparent';

              return (
                <Pressable
                  key={idx}
                  style={({ pressed }) => [
                    styles.button,
                    isMultiButton && { flex: 1 },
                    {
                      backgroundColor: btnBg,
                      borderColor: borderColor,
                      borderWidth: isCancel ? 1 : 0,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  onPress={() => handlePress(btn)}
                >
                  <Text style={[styles.buttonText, { color: textColor, fontWeight: isCancel ? '600' : '700' }]}>
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 22,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  multiButtonRow: {
    flexDirection: 'row',
  },
  button: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  buttonText: {
    fontSize: 15,
  },
});

function showNativeFallback(title: string, message?: string, buttons?: AlertButton[]) {
  const mapped =
    buttons?.map((b) => ({
      text: b.text,
      style: b.style,
      onPress: b.onPress,
    })) ?? [{ text: 'Tamam' }];
  RNAlert.alert(title, message, mapped as any);
}

export const CustomAlertModule = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: AlertType,
    icon?: keyof typeof Ionicons.glyphMap
  ) => {
    const tryShow = () => {
      if (customAlertRef.current?.alert) {
        customAlertRef.current.alert(title, message, buttons, type, icon);
        return true;
      }
      return false;
    };
    if (tryShow()) return;
    requestAnimationFrame(() => {
      if (tryShow()) return;
      setTimeout(() => {
        if (tryShow()) return;
        showNativeFallback(title, message, buttons);
      }, 0);
    });
  },
};

/** Global easy-to-use alert helper */
export const showAlert = CustomAlertModule.alert;
