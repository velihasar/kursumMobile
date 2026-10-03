import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { showAlert } from '@/components/ui/CustomAlert';
import { showToast } from '@/components/ui/TopToast';
import { checkServerPing } from '@/lib/services/auth-service';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { palette } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Eksik Bilgi', 'Lütfen e-posta veya telefon numaranızı ve şifrenizi giriniz.', undefined, 'warning');
      return;
    }

    setLoading(true);
    const res = await login({ email: email.trim(), password: password.trim() });
    setLoading(false);

    if (res.success) {
      showToast('Giriş Başarılı', 'Oturumunuz açıldı, hoş geldiniz!', 'success');
      router.replace('/(tabs)');
    } else {
      showAlert('Giriş Başarısız', res.message || 'E-posta/telefon veya şifre hatalı.', undefined, 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 20, 32),
            paddingBottom: Math.max(insets.bottom + 48, 64),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={[styles.iconWrapper, { backgroundColor: palette.primaryLight }]}>
            <Ionicons name="school" size={42} color={palette.primary} />
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Kursum</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Veli, Öğretmen & Kurum Bilgi Sistemi
          </Text>
        </View>

        {/* Form Card */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Giriş Yap</Text>

          <Input
            label="E-Posta veya Telefon Numarası"
            placeholder="E-posta veya telefon giriniz"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />

          <Input
            label="Şifre"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock-closed-outline"
          />

          <Button
            title="Giriş Yap"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </Card>

        {/* Bottom Actions */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: palette.textSecondary }]}>
            İlk kez mi giriş yapıyorsunuz?
          </Text>
          <TouchableOpacity
            style={styles.registerLinkBtn}
            onPress={() => router.push('/(auth)/register' as any)}
          >
            <Text style={[styles.registerLinkText, { color: palette.primary }]}>
              Veli Giriş Kodu ile Aktif Et
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  registerLinkBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  registerLinkText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
