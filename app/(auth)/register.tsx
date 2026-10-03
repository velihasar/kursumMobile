import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { registerParent } = useAuth();
  const { palette } = useAppTheme();

  const [accessCode, setAccessCode] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const code = accessCode.trim();
    const contact = emailOrPhone.trim();

    if (!code) {
      Alert.alert('Uyarı', 'Lütfen kurumunuzdan aldığınız Veli Giriş Kodunu giriniz.');
      return;
    }

    if (!contact) {
      Alert.alert('Uyarı', 'Lütfen e-posta adresinizi veya telefon numaranızı giriniz.');
      return;
    }

    if (!password) {
      Alert.alert('Uyarı', 'Lütfen bir şifre belirleyiniz.');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Uyarı', 'Şifreniz en az 4 karakter olmalıdır.');
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert('Uyarı', 'Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setLoading(true);
    const res = await registerParent({
      accessCode: code.toUpperCase(),
      emailOrPhone: contact,
      fullName: fullName.trim() || undefined,
      password,
    });
    setLoading(false);

    if (res.success) {
      Alert.alert(
        'Hesabınız Aktifleştirildi 🎉',
        'Veli kaydınız başarıyla oluşturuldu ve oturumunuz açıldı.',
        [
          {
            text: 'Başla',
            onPress: () => router.replace('/(tabs)' as any),
          },
        ]
      );
    } else {
      const isAlreadyRegistered =
        res.message?.includes('daha önce kayıt') ||
        res.message?.includes('zaten mevcut');

      if (isAlreadyRegistered) {
        Alert.alert(
          'Kayıt Zaten Mevcut',
          res.message || 'Bu giriş kodu veya iletişim bilgisi ile zaten kayıt olunmuştur.',
          [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Giriş Yap',
              onPress: () => router.replace('/(auth)/login' as any),
            },
          ]
        );
      } else {
        Alert.alert('Aktivasyon Başarısız', res.message || 'Kayıt sırasında bir hata oluştu.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 10, 24),
            paddingBottom: Math.max(insets.bottom + 48, 64),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.iconWrapper, { backgroundColor: palette.primaryLight }]}>
            <Ionicons name="key" size={32} color={palette.primary} />
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Veli Hesabı Aktivasyonu</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Kurumunuz tarafından size iletilen Veli Giriş Kodu ile ilk kaydınızı oluşturun.
          </Text>
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: palette.primaryLight, borderColor: palette.primary }]}>
          <Ionicons name="information-circle" size={20} color={palette.primary} style={{ marginTop: 2 }} />
          <Text style={[styles.infoText, { color: palette.text }]}>
            Bu kod ile hesabınızı <Text style={{ fontWeight: '700' }}>yalnızca 1 kez</Text> aktif edeceksiniz. Sonraki girişlerinizde belirlediğiniz şifrenizi kullanacaksınız.
          </Text>
        </View>

        <Card style={styles.card}>
          <Input
            label="Veli Giriş Kodu *"
            placeholder="Örn: KRS-A7X9K2"
            value={accessCode}
            onChangeText={(t) => setAccessCode(t.toUpperCase())}
            autoCapitalize="characters"
            icon="key-outline"
          />

          <Input
            label="E-Posta veya Telefon Numarası *"
            placeholder="E-posta veya telefon giriniz"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />

          <Input
            label="Adınız Soyadınız (İsteğe Bağlı)"
            placeholder="Ad Soyad"
            value={fullName}
            onChangeText={setFullName}
            icon="person-outline"
          />

          <Input
            label="Şifre Belirleyiniz *"
            placeholder="En az 4 karakter"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock-closed-outline"
          />

          <Input
            label="Şifre Tekrarı *"
            placeholder="Şifrenizi tekrar giriniz"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry
            icon="shield-checkmark-outline"
          />

          <Button
            title="Hesabımı Aktif Et & Giriş Yap"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: 12 }}
          />
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login' as any)}>
            <Text style={[styles.footerText, { color: palette.textSecondary }]}>
              Zaten hesabınızı aktif ettiniz mi?{' '}
              <Text style={{ color: palette.primary, fontWeight: '700' }}>Giriş Yap</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    padding: 20,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});
