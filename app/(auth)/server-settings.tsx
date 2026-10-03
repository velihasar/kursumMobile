import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/contexts/theme-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getStoredServerUrl, setStoredServerUrl, getActiveApiBaseUrl } from '@/lib/server-url-storage';
import { checkServerPing } from '@/lib/services/auth-service';
import { Ionicons } from '@expo/vector-icons';

export default function ServerSettingsScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();

  const [activeUrl, setActiveUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string; timeMs?: number } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const act = await getActiveApiBaseUrl();
    const stored = await getStoredServerUrl();
    setActiveUrl(act);
    setCustomUrl(stored || '');
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await checkServerPing();
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = async () => {
    await setStoredServerUrl(customUrl);
    await loadSettings();
    Alert.alert('Kaydedildi', 'Sunucu adresi güncellendi.');
  };

  const handleReset = async () => {
    await setStoredServerUrl('');
    setCustomUrl('');
    await loadSettings();
    Alert.alert('Sıfırlandı', 'Otomatik IP algılama moduna dönüldü.');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={palette.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: palette.text }]}>Sunucu / Backend Ayarları</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        Telefonunuzdan yerel backend'e bağlanmak için adres ayarları
      </Text>

      <Card style={styles.card}>
        <Text style={[styles.label, { color: palette.textSecondary }]}>Şu An Kullanılan Adres:</Text>
        <Text style={[styles.activeUrl, { color: palette.primary }]}>{activeUrl || 'Tespit ediliyor...'}</Text>

        <Input
          label="Özel Sunucu Adresi (İsteğe Bağlı)"
          placeholder="http://192.168.1.50:5000"
          value={customUrl}
          onChangeText={setCustomUrl}
          icon="globe-outline"
        />

        <View style={styles.btnRow}>
          <Button title="Kaydet" onPress={handleSave} style={{ flex: 1 }} />
          <Button title="Sıfırla" variant="outline" onPress={handleReset} style={{ flex: 1 }} />
        </View>

        <Button
          title={testing ? 'Test Ediliyor...' : 'Bağlantıyı Test Et (Ping)'}
          variant="secondary"
          onPress={handleTest}
          loading={testing}
          style={{ marginTop: 12 }}
        />

        {testResult && (
          <View
            style={[
              styles.resultBox,
              {
                backgroundColor: testResult.ok ? palette.successBg : palette.dangerBg,
                borderColor: testResult.ok ? palette.success : palette.danger,
              },
            ]}
          >
            <Ionicons
              name={testResult.ok ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={testResult.ok ? palette.success : palette.danger}
            />
            <Text style={{ color: testResult.ok ? palette.success : palette.danger, fontWeight: '600' }}>
              {testResult.ok
                ? `Bağlantı Başarılı! (${testResult.timeMs}ms)`
                : `Bağlantı Hatası: ${testResult.message || 'Ulaşılamadı'}`}
            </Text>
          </View>
        )}
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
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeUrl: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 6,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
});
