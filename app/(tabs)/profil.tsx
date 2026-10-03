import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { showAlert } from '@/components/ui/CustomAlert';
import { showToast } from '@/components/ui/TopToast';
import { Ionicons } from '@expo/vector-icons';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  const { palette, isDark, toggleTheme } = useAppTheme();

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

  const handleDeleteAccount = () => {
    showAlert(
      'Hesabımı Sil',
      'Mobil kullanıcı hesabınızı silmek istediğinize emin misiniz?\n\nBu işlem sonucunda giriş bilgileriniz, oturumunuz ve bildirim ayarlarınız kalıcı olarak silinecektir. Kurumdaki veli kaydınız ve öğrencinizin kayıtları ise kurum arşivinde korunacaktır.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabımı Kalıcı Olarak Sil',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteAccount();
            if (res.success) {
              showToast('Hesap Silindi', res.message || 'Hesabınız başarıyla silindi.', 'success');
              router.replace('/(auth)/login');
            } else {
              showAlert('İşlem Başarısız', res.message || 'Hesap silinirken bir hata oluştu.', undefined, 'error');
            }
          },
        },
      ],
      'error',
      'trash-outline'
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: palette.text }]}>Profil & Ayarlar</Text>

      {/* User Info Card */}
      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={[styles.avatarBox, { backgroundColor: palette.primaryLight }]}>
            <Ionicons name="person" size={32} color={palette.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.userName, { color: palette.text }]}>
              {user?.fullName || 'Kullanıcı'}
            </Text>
            {user?.email ? (
              <Text style={[styles.userEmail, { color: palette.textSecondary }]}>
                {user.email}
              </Text>
            ) : null}
            <Text style={[styles.userRole, { color: palette.primary }]}>
              {user?.role === 'Parent'
                ? 'Veli Hesabı'
                : user?.role === 'Teacher'
                ? 'Öğretmen Hesabı'
                : user?.role === 'Admin'
                ? 'Yönetici'
                : 'Öğrenci Hesabı'}
            </Text>
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
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: palette.border, true: palette.primary }}
          />
        </View>
      </Card>

      {/* App Info Card */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 16 }]}>Uygulama Bilgisi</Text>
      <Card style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="information-circle-outline" size={22} color={palette.textSecondary} />
            <Text style={[styles.settingLabel, { color: palette.text }]}>Sürüm</Text>
          </View>
          <Text style={[styles.settingSub, { color: palette.textMuted }]}>v1.0.0</Text>
        </View>
      </Card>

      {/* Account Actions */}
      <View style={{ marginTop: 28, gap: 12, marginBottom: 24 }}>
        <Button
          title="Çıkış Yap"
          variant="outline"
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={20} color={palette.text} />}
        />

        <TouchableOpacity
          style={[
            styles.deleteAccountBtn,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2',
            },
          ]}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={styles.deleteAccountText}>Hesabımı Sil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  profileCard: {
    padding: 18,
    marginBottom: 16,
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
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  deleteAccountText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
