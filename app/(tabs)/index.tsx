import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { fetchWalletInfo, WalletInfo } from '@/lib/services/wallet-service';
import { fetchCourses, Course } from '@/lib/services/course-service';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette } = useAppTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  const loadData = async () => {
    const [w, c] = await Promise.all([fetchWalletInfo(), fetchCourses()]);
    setWallet(w);
    setCourses(c);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
    >
      {/* Top Welcome Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.welcomeText, { color: palette.textSecondary }]}>Hoş Geldiniz 👋</Text>
          <Text style={[styles.userName, { color: palette.text }]}>{user?.fullName || 'Öğrenci'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.avatarBox, { backgroundColor: palette.primaryLight }]}
          onPress={() => router.push('/(tabs)/profil')}
        >
          <Ionicons name="school" size={24} color={palette.primary} />
        </TouchableOpacity>
      </View>

      {/* Hero Card */}
      <Card style={[styles.heroCard, { backgroundColor: palette.primary }]}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Badge label="2026 - 2027 Eğitim Dönemi" variant="info" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <Text style={styles.heroTitle}>Sıradaki Ders: Matematik</Text>
            <Text style={styles.heroSub}>Bugün 14:00 • Derslik 3 • Ahmet Hoca</Text>
          </View>
          <Ionicons name="time-outline" size={36} color="#FFFFFF" />
        </View>
      </Card>

      {/* Quick Stats Grid */}
      <Text style={[styles.sectionTitle, { color: palette.text }]}>Genel Durum</Text>
      <View style={styles.statsGrid}>
        <StatCard
          title="Katılım Oranı"
          value="%96"
          subtitle="Son 30 gün"
          icon="checkmark-circle-outline"
          color={palette.success}
        />
        <StatCard
          title="Kantin Bakiyesi"
          value={`₺${wallet?.balance?.toFixed(2) || '350.00'}`}
          subtitle="Kullanılabilir"
          icon="wallet-outline"
          color={palette.accent}
        />
      </View>

      <View style={[styles.statsGrid, { marginTop: 10 }]}>
        <StatCard
          title="Kayıtlı Dersler"
          value={courses.length || 5}
          subtitle="Aktif şubeler"
          icon="book-outline"
          color={palette.primary}
        />
        <StatCard
          title="Sonraki Taksit"
          value={`₺${wallet?.nextPaymentAmount || 1500}`}
          subtitle={wallet?.nextPaymentDate || '15 Ekim'}
          icon="cash-outline"
          color={palette.warning}
        />
      </View>

      {/* Quick Action Buttons */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 20 }]}>Hızlı İşlemler</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: palette.card, borderColor: palette.border }]}
          onPress={() => router.push('/(tabs)/dersler')}
        >
          <View style={[styles.actionIcon, { backgroundColor: palette.primaryLight }]}>
            <Ionicons name="calendar" size={22} color={palette.primary} />
          </View>
          <Text style={[styles.actionLabel, { color: palette.text }]}>Haftalık Program</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: palette.card, borderColor: palette.border }]}
          onPress={() => router.push('/(tabs)/yoklama')}
        >
          <View style={[styles.actionIcon, { backgroundColor: palette.successBg }]}>
            <Ionicons name="checkmark-done" size={22} color={palette.success} />
          </View>
          <Text style={[styles.actionLabel, { color: palette.text }]}>Yoklama Raporu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: palette.card, borderColor: palette.border }]}
          onPress={() => router.push('/(tabs)/cuzdan')}
        >
          <View style={[styles.actionIcon, { backgroundColor: palette.warningBg }]}>
            <Ionicons name="card" size={22} color={palette.warning} />
          </View>
          <Text style={[styles.actionLabel, { color: palette.text }]}>Ödeme Yap</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Announcements */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 20 }]}>Duyurular</Text>
      <Card>
        <View style={styles.announcementRow}>
          <Ionicons name="megaphone-outline" size={24} color={palette.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.announcementTitle, { color: palette.text }]}>Yarıyıl Deneme Sınavı Takvimi</Text>
            <Text style={[styles.announcementDesc, { color: palette.textSecondary }]}>
              Bu cumartesi günü saat 10:00'da tüm 12. sınıf şubelerimiz için Türkiye Geneli deneme sınavı yapılacaktır.
            </Text>
            <Text style={[styles.announcementDate, { color: palette.textMuted }]}>1 Ekim 2026</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 50,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  announcementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  announcementDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  announcementDate: {
    fontSize: 11,
    marginTop: 6,
  },
});
