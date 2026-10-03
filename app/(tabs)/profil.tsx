import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { showAlert } from '@/components/ui/CustomAlert';
import { getActiveApiBaseUrl } from '@/lib/server-url-storage';
import { Ionicons } from '@expo/vector-icons';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { palette, isDark, toggleTheme } = useAppTheme();
  const [serverUrl, setServerUrl] = useState('');

  useEffect(() => {
    getActiveApiBaseUrl().then(setServerUrl);
  }, []);

  const handleLogout = () => {
    showAlert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
      'warning',
      'log-out-outline'
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: palette.text }]}>Profil & Ayarlar</Text>

      {/* User Info Card */}
      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={[styles.avatarBox, { backgroundColor: palette.primaryLight }]}>
            <Ionicons name="person" size={32} color={palette.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.userName, { color: palette.text }]}>{user?.fullName || 'Öğrenci'}</Text>
            <Text style={[styles.userEmail, { color: palette.textSecondary }]}>{user?.email || 'ogrenci@kursum.com'}</Text>
            <Text style={[styles.userRole, { color: palette.primary }]}>Rol: {user?.roles?.join(', ') || 'Öğrenci'}</Text>
          </View>
        </View>
      </Card>

      {/* App Preferences */}
      <Text style={[styles.sectionTitle, { color: palette.text }]}>Tercihler</Text>
      <Card style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="moon-outline" size={22} color={palette.text} />
            <Text style={[styles.settingLabel, { color: palette.text }]}>Karanlık Mod</Text>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: palette.border, true: palette.primary }} />
        </View>
      </Card>

      {/* Backend / Network Settings */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 16 }]}>Sistem & Sunucu</Text>
      <Card style={styles.settingsCard}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => router.push('/(auth)/server-settings' as any)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="server-outline" size={22} color={palette.text} />
            <View>
              <Text style={[styles.settingLabel, { color: palette.text }]}>Backend Bağlantısı</Text>
              <Text style={[styles.settingSub, { color: palette.textMuted }]}>{serverUrl || 'Otomatik'}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
        </TouchableOpacity>
      </Card>

      {/* Logout */}
      <View style={{ marginTop: 24 }}>
        <Button title="Çıkış Yap" variant="danger" onPress={handleLogout} icon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  profileCard: {
    padding: 18,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  settingsCard: {
    padding: 6,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
