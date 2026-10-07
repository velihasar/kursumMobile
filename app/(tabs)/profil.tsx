import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { showAlert } from '@/components/ui/CustomAlert';
import { showToast } from '@/components/ui/TopToast';
import { ProfileEditModal } from '@/components/ui/ProfileEditModal';
import { Ionicons } from '@expo/vector-icons';

export default function ProfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, deleteAccount } = useAuth();
  const { palette, isDark, toggleTheme } = useAppTheme();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'info' | 'password'>('info');

  const getInitials = (name?: string) => {
    if (!name || name.trim() === '') return 'K';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toLocaleUpperCase('tr-TR');
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('tr-TR');
  };

  const formatFullName = (name?: string) => {
    if (!name || name.trim() === '') return 'Kullanıcı';
    return name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR'))
      .join(' ');
  };

  const openEditModal = (tab: 'info' | 'password') => {
    setEditModalTab(tab);
    setEditModalVisible(true);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Kursum Mobil uygulamasını keşfedin! Ders programı, yoklama ve kantin bakiyenizi anlık takip edin. 🎓✨',
        title: 'Kursum Mobil',
      });
    } catch {
      showAlert('Hata', 'Uygulama paylaşılırken bir hata oluştu.', undefined, 'error');
    }
  };

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
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      {/* Fixed Header */}
      <View
        style={[
          styles.fixedHeader,
          {
            paddingTop: Math.max(insets.top + 8, 28),
            backgroundColor: palette.background,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: palette.text }]}>Profil & Ayarlar</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          Kullanıcı bilgileri, tercihler ve uygulama ayarları
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
      >
        {/* User Info Card */}
        <Card style={[styles.profileCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatarBox, { backgroundColor: palette.primaryLight }]}>
              <Text style={[styles.avatarInitials, { color: palette.primary }]}>
                {getInitials(user?.fullName)}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.userName, { color: palette.text }]}>
                {formatFullName(user?.fullName)}
              </Text>
              {user?.email ? (
                <Text style={[styles.userEmail, { color: palette.textSecondary }]}>
                  {user.email}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        {/* Account & Security Section */}
        <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>HESAP & GÜVENLİK</Text>
        <Card style={[styles.settingsCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <TouchableOpacity
            style={styles.settingActionRow}
            onPress={() => openEditModal('info')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: palette.primaryLight }]}>
                <Ionicons name="person-outline" size={18} color={palette.primary} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: palette.text }]}>Kişisel Bilgilerim</Text>
                <Text style={[styles.settingSub, { color: palette.textSecondary }]}>Ad, soyad ve e-posta bilgilerini düzenle</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
          </TouchableOpacity>

          <View style={[styles.innerDivider, { backgroundColor: palette.borderLight }]} />

          <TouchableOpacity
            style={styles.settingActionRow}
            onPress={() => openEditModal('password')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDark ? '#2D1B0B' : '#FEF3C7' }]}>
                <Ionicons name="key-outline" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: palette.text }]}>Şifre Değiştir</Text>
                <Text style={[styles.settingSub, { color: palette.textSecondary }]}>Giriş şifrenizi ve hesap güvenliğini yönetin</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* App Preferences */}
        <Text style={[styles.sectionTitle, { color: palette.textSecondary, marginTop: 16 }]}>TERCİHLER</Text>
        <Card style={[styles.settingsCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDark ? '#111C2E' : '#F1F5F9' }]}>
                <Ionicons name="moon" size={18} color={palette.text} />
              </View>
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
        <Text style={[styles.sectionTitle, { color: palette.textSecondary, marginTop: 16 }]}>UYGULAMA BİLGİSİ & DESTEK</Text>
        <Card style={[styles.settingsCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <TouchableOpacity
            style={styles.settingActionRow}
            onPress={handleShareApp}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDark ? '#2E1A47' : '#F3E8FF' }]}>
                <Ionicons name="share-social" size={18} color="#9333EA" />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: palette.text }]}>Uygulamayı Arkadaşınla Paylaş</Text>
                <Text style={[styles.settingSub, { color: palette.textSecondary }]}>Kursum Mobil'i sevdiklerinize önerin</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
          </TouchableOpacity>

          <View style={[styles.innerDivider, { backgroundColor: palette.borderLight }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDark ? '#111C2E' : '#F1F5F9' }]}>
                <Ionicons name="information-circle" size={18} color={palette.primary} />
              </View>
              <Text style={[styles.settingLabel, { color: palette.text }]}>Sürüm</Text>
            </View>
            <View style={[styles.versionPill, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Text style={[styles.versionPillText, { color: palette.textSecondary }]}>v1.0.0</Text>
            </View>
          </View>
        </Card>

        {/* Account Actions */}
        <View style={{ marginTop: 24, gap: 12, marginBottom: 24 }}>
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

        {/* Masavtech Attribution Footer */}
        <View style={styles.attributionFooter}>
          <Text style={[styles.attributionLine, { color: palette.textSecondary }]}>
            <Text style={[styles.attributionBrand, { color: palette.primary }]}>MASAVTECH</Text>
            {' HİZMETİDİR • '}
            {new Date().getFullYear()}
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile & Change Password Modal */}
      <ProfileEditModal
        visible={editModalVisible}
        initialTab={editModalTab}
        onClose={() => setEditModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  content: {
    padding: 18,
  },
  profileCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  settingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerDivider: {
    height: 1,
    marginHorizontal: 14,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 11,
    marginTop: 2,
  },
  versionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  versionPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  deleteAccountText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  attributionFooter: {
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  attributionLine: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  attributionBrand: {
    fontWeight: '800',
  },
});

