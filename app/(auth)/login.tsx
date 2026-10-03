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
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { checkServerPing } from '@/lib/services/auth-service';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { palette } = useAppTheme();

  const [email, setEmail] = useState('admin@adminmail.com');
  const [password, setPassword] = useState('Q1w212*_*');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ ok: boolean; url: string; timeMs?: number } | null>(null);

  useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    const res = await checkServerPing();
    setServerStatus(res);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Uyarı', 'Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }

    setLoading(true);
    const res = await login({ email: email.trim(), password: password.trim() });
    setLoading(false);

    if (res.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Giriş Başarısız', res.message || 'E-posta veya şifre hatalı.');
    }
  };

  const handleDemoLogin = () => {
    setEmail('admin@adminmail.com');
    setPassword('Q1w212*_*');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header */}
        <View style={styles.header}>
          <View style={[styles.iconWrapper, { backgroundColor: palette.primaryLight }]}>
            <Ionicons name="school" size={42} color={palette.primary} />
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Kursum Mobile</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Öğrenci & Veli Bilgi Sistemi
          </Text>
        </View>

        {/* Server Status Indicator */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(auth)/server-settings' as any)}
          style={[
            styles.serverBadge,
            {
              backgroundColor: serverStatus?.ok ? palette.successBg : palette.warningBg,
              borderColor: serverStatus?.ok ? palette.success : palette.warning,
            },
          ]}
        >
          <Ionicons
            name={serverStatus?.ok ? 'checkmark-circle' : 'alert-circle'}
            size={16}
            color={serverStatus?.ok ? palette.success : palette.warning}
          />
          <Text
            style={[
              styles.serverText,
              { color: serverStatus?.ok ? palette.success : palette.warning },
            ]}
            numberOfLines={1}
          >
            {serverStatus?.ok
              ? `Backend Aktif (${serverStatus.timeMs}ms)`
              : `Bağlantı Ayarları: ${serverStatus?.url || 'Bulunamadı'}`}
          </Text>
          <Ionicons name="settings-outline" size={14} color={serverStatus?.ok ? palette.success : palette.warning} />
        </TouchableOpacity>

        {/* Form Card */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Giriş Yap</Text>

          <Input
            label="E-Posta / TC Kimlik No"
            placeholder="ornek@kursum.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
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

          <TouchableOpacity
            style={styles.demoBtn}
            onPress={handleDemoLogin}
          >
            <Text style={[styles.demoText, { color: palette.primary }]}>
              Demo Bilgileri Doldur
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Bottom Actions */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
            <Text style={[styles.footerText, { color: palette.textSecondary }]}>
              Hesabınız yok mu?{' '}
              <Text style={{ color: palette.primary, fontWeight: '700' }}>Kayıt Ol</Text>
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
  serverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  serverText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  card: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  demoBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  demoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});
