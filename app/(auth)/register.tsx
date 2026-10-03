import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { palette } = useAppTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Uyarı', 'Lütfen gerekli alanları doldurunuz.');
      return;
    }

    setLoading(true);
    const res = await register({
      fullName,
      email,
      phoneNumber,
      citizenId,
      password,
    });
    setLoading(false);

    if (res.success) {
      Alert.alert('Başarılı', 'Kaydınız oluşturuldu. Giriş yapabilirsiniz.', [
        { text: 'Tamam', onPress: () => router.replace('/(auth)/login') }
      ]);
    } else {
      Alert.alert('Kayıt Başarısız', res.message || 'Kayıt sırasında bir hata oluştu.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={palette.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: palette.text }]}>Yeni Hesap Oluştur</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        Kursum sistemine öğrenci / veli olarak kaydolun
      </Text>

      <Card style={styles.card}>
        <Input
          label="Ad Soyad"
          placeholder="Ahmet Yılmaz"
          value={fullName}
          onChangeText={setFullName}
          icon="person-outline"
        />

        <Input
          label="E-Posta"
          placeholder="ahmet@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          icon="mail-outline"
        />

        <Input
          label="Telefon Numarası"
          placeholder="05XX XXX XX XX"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          icon="call-outline"
        />

        <Input
          label="TC Kimlik No (Opsiyonel)"
          placeholder="11 Haneli TC No"
          value={citizenId}
          onChangeText={setCitizenId}
          keyboardType="numeric"
          icon="card-outline"
        />

        <Input
          label="Şifre"
          placeholder="En az 6 karakter"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          icon="lock-closed-outline"
        />

        <Button
          title="Kayıt Ol"
          onPress={handleRegister}
          loading={loading}
          style={{ marginTop: 8 }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 50,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    padding: 20,
  },
});
