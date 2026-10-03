import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { fetchWalletInfo, WalletInfo, formatTurkishDate } from '@/lib/services/wallet-service';
import { fetchParentStudents, ChildStudent } from '@/lib/services/student-service';
import { fetchInstitutionInfo, InstitutionInfo } from '@/lib/services/institution-service';
import { QrScannerModal } from '@/components/ui/QrScannerModal';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { palette, isDark } = useAppTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [students, setStudents] = useState<ChildStudent[]>([]);
  const [institution, setInstitution] = useState<InstitutionInfo | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [activeQrStudentId, setActiveQrStudentId] = useState<number | undefined>();

  const loadData = async () => {
    const parentId = user?.parentId;
    const defaultStudentId = user?.studentId;

    const [w, sList, inst] = await Promise.all([
      fetchWalletInfo(defaultStudentId),
      fetchParentStudents(parentId, defaultStudentId),
      fetchInstitutionInfo(user?.tenantId),
    ]);
    setWallet(w);
    setStudents(sList);
    setInstitution(inst);
    setLogoError(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.studentId, user?.parentId, user?.tenantId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isParent = user?.role === 'Parent' || (user?.roles?.some((r) => r.toLowerCase().includes('veli') || r.toLowerCase().includes('parent')));

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top + 12, 32),
          paddingBottom: 32,
        },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
    >
      {/* Top Header with Dual Branding (Kursum Brand + Institution Badge) */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={[styles.logoBadge, { backgroundColor: palette.primary }]}>
            <Ionicons name="school" size={20} color="#FFFFFF" />
          </View>
          <Text style={[styles.brandTitle, { color: palette.text }]}>KURSUM</Text>
        </View>

        {institution?.name ? (
          <View
            style={[
              styles.institutionBadge,
              {
                backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                borderColor: isDark ? '#334155' : '#DBEAFE',
              },
            ]}
          >
            {institution.logoUrl && !logoError ? (
              <Image
                source={{ uri: institution.logoUrl }}
                style={styles.instMiniLogo}
                resizeMode="contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Ionicons name="business" size={14} color={palette.primary} />
            )}
            <Text
              style={[styles.institutionBadgeText, { color: palette.primary }]}
              numberOfLines={1}
            >
              {institution.name}
            </Text>
          </View>
        ) : null}
      </View>

      {/* QR Attendance Quick Action Banner */}
      <TouchableOpacity
        style={[
          styles.qrBannerCard,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: palette.primary,
          },
        ]}
        activeOpacity={0.8}
        onPress={() => {
          setActiveQrStudentId(students[0]?.id);
          setQrModalVisible(true);
        }}
      >
        <View style={[styles.qrBannerIconBox, { backgroundColor: palette.primary }]}>
          <Ionicons name="qr-code" size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.qrBannerTitle, { color: palette.text }]}>QR ile Yoklama Ver</Text>
            <View style={[styles.qrLiveBadge, { backgroundColor: palette.primaryLight }]}>
              <View style={[styles.qrLiveDot, { backgroundColor: palette.primary }]} />
              <Text style={[styles.qrLiveText, { color: palette.primary }]}>HIZLI GİRİŞ</Text>
            </View>
          </View>
          <Text style={[styles.qrBannerSub, { color: palette.textSecondary }]}>
            Masadaki QR kodu taratarak derse anında giriş yapın
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.textSecondary} />
      </TouchableOpacity>

      {/* Course Finance Card */}
      <Card style={[styles.sharedWalletCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.walletHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.walletIconCircle, { backgroundColor: palette.primaryLight }]}>
              <Ionicons name="wallet" size={20} color={palette.primary} />
            </View>
            <View>
              <Text style={[styles.walletCardTitle, { color: palette.text }]}>Kurs Cüzdanım</Text>
              <Text style={[styles.walletCardSub, { color: palette.textSecondary }]}>
                {students.length > 1 ? `${students.length} Öğrenci İçin Geçerli` : 'Kullanılabilir Bakiye & Aidat'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.payBtn, { backgroundColor: palette.primary }]}
            onPress={() => router.push('/(tabs)/cuzdan')}
          >
            <Text style={styles.payBtnText}>Cüzdan</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.walletDivider} />

        <View style={styles.walletRow}>
          <View style={styles.walletItem}>
            <Text style={[styles.walletItemLabel, { color: palette.textSecondary }]}>Kantin Bakiyesi</Text>
            <Text style={[styles.walletItemValue, { color: palette.success }]}>
              ₺{wallet?.balance?.toFixed(2) || '0.00'}
            </Text>
          </View>

          <View style={[styles.verticalDivider, { backgroundColor: palette.border }]} />

          <View style={styles.walletItem}>
            <Text style={[styles.walletItemLabel, { color: palette.textSecondary }]}>Sonraki Taksit</Text>
            <Text style={[styles.walletItemValue, { color: palette.warning }]}>
              {wallet?.nextPaymentAmount ? `₺${wallet.nextPaymentAmount.toFixed(2)}` : '₺0.00'}
            </Text>
            <Text style={[styles.walletDueDate, { color: palette.textMuted }]}>
              {wallet?.nextPaymentDate ? formatTurkishDate(wallet.nextPaymentDate) : 'Ödeme Yok'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Children Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {isParent && students.length > 1 ? 'Öğrencilerim & Ders Durumları' : 'Öğrenci & Ders Durumu'}
        </Text>
        {students.length > 1 && (
          <Badge label={`${students.length} Öğrenci`} variant="info" />
        )}
      </View>

      {/* Individual Child Cards */}
      {students.length === 0 ? (
        <Card style={[styles.childCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={{ alignItems: 'center', padding: 16 }}>
            <Ionicons name="person-outline" size={32} color={palette.textSecondary} />
            <Text style={{ color: palette.textSecondary, marginTop: 8, fontSize: 14 }}>
              Kayıtlı öğrenci bilgisi yükleniyor...
            </Text>
          </View>
        </Card>
      ) : (
        students.map((st) => (
          <Card key={st.id} style={[styles.childCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {/* Child Header */}
            <View style={styles.childHeader}>
              <View style={styles.childAvatarBox}>
                <Ionicons name="person" size={20} color={palette.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.childName, { color: palette.text }]}>{st.fullName}</Text>
              </View>
              <Badge label={`%${st.attendanceRate ?? 100} Katılım`} variant={st.attendanceRate && st.attendanceRate < 85 ? 'warning' : 'success'} />
            </View>

            {/* Next Lesson Box */}
            <View style={[styles.nextLessonBox, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: palette.border }]}>
              <View style={[styles.nextLessonIconBadge, { backgroundColor: palette.primaryLight }]}>
                <Ionicons name="time" size={18} color={palette.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={[styles.nextLessonTag, { color: palette.primary }]}>ÖNÜMÜZDEKİ DERS</Text>
                  {st.nextLesson?.time && (
                    <View style={[styles.timeBadge, { backgroundColor: palette.card, borderColor: palette.border }]}>
                      <Text style={[styles.timeBadgeText, { color: palette.textSecondary }]}>
                        {st.nextLesson.time}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.nextLessonTitle, { color: palette.text }]} numberOfLines={1}>
                  {st.nextLesson?.subject || (st.courseCount > 0 ? 'Kayıtlı Dersler' : 'Ders Kaydı Yok')}
                </Text>
                {(st.nextLesson?.teacher || st.nextLesson?.classroom) ? (
                  <Text style={[styles.nextLessonSub, { color: palette.textSecondary }]} numberOfLines={1}>
                    {[st.nextLesson.teacher, st.nextLesson.classroom].filter(Boolean).join(' • ')}
                  </Text>
                ) : (
                  <Text style={[styles.nextLessonSub, { color: palette.textSecondary }]}>
                    {(st.courseCount ?? 0) > 0 ? `${st.courseCount} Aktif Ders Kaydı` : 'Ders programı tanımlanmadı'}
                  </Text>
                )}
              </View>
            </View>

            {/* Action Quick Links for this Child */}
            <View style={styles.childActionsRow}>
              <TouchableOpacity
                style={[styles.childActionBtn, { borderColor: palette.primary, backgroundColor: palette.primaryLight }]}
                onPress={() => {
                  setActiveQrStudentId(st.id);
                  setQrModalVisible(true);
                }}
              >
                <Ionicons name="qr-code" size={15} color={palette.primary} />
                <Text style={[styles.childActionText, { color: palette.primary }]}>QR Giriş</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.childActionBtn, { borderColor: palette.border }]}
                onPress={() => router.push('/(tabs)/dersler')}
              >
                <Ionicons name="calendar-outline" size={15} color={palette.textSecondary} />
                <Text style={[styles.childActionText, { color: palette.text }]}>Program ({st.courseCount ?? 0})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.childActionBtn, { borderColor: palette.border }]}
                onPress={() => router.push('/(tabs)/yoklama')}
              >
                <Ionicons name="checkmark-done-circle-outline" size={15} color={palette.success} />
                <Text style={[styles.childActionText, { color: palette.text }]}>Yoklama</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}

      {/* Quick Action Buttons */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 12 }]}>Hızlı İşlemler</Text>
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
          <Text style={[styles.actionLabel, { color: palette.text }]}>Ödeme & Bakiye</Text>
        </TouchableOpacity>
      </View>

      {/* Announcements */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 20 }]}>Duyurular</Text>
      <Card>
        <View style={styles.announcementRow}>
          <Ionicons name="megaphone-outline" size={24} color={palette.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.announcementTitle, { color: palette.text }]}>2026 - 2027 Eğitim Öğretim Dönemi</Text>
            <Text style={[styles.announcementDesc, { color: palette.textSecondary }]}>
              Kurs merkezimizdeki dersler ve yoklamalar dijital sistem üzerinden anlık olarak takip edilmektedir.
            </Text>
            <Text style={[styles.announcementDate, { color: palette.textMuted }]}>Kurs Yönetimi</Text>
          </View>
        </View>
      </Card>
    </ScrollView>

    {/* QR Attendance Scanner Modal */}
    <QrScannerModal
      visible={qrModalVisible}
      onClose={() => setQrModalVisible(false)}
      students={students}
      initialStudentId={activeQrStudentId}
      onSuccess={loadData}
    />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 50,
  },
  qrBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: '#2C98F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  qrBannerIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  qrLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  qrLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  qrLiveText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  qrBannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C98F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  institutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '52%',
    gap: 6,
  },
  instMiniLogo: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  institutionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  sharedWalletCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  walletCardSub: {
    fontSize: 12,
    marginTop: 1,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  walletDivider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    marginVertical: 14,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  walletItem: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 36,
  },
  walletItemLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  walletItemValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  walletDueDate: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  childCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  childAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(44, 152, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childName: {
    fontSize: 16,
    fontWeight: '800',
  },
  childGrade: {
    fontSize: 12,
    marginTop: 2,
  },
  nextLessonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  nextLessonIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextLessonTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  nextLessonTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  nextLessonSub: {
    fontSize: 11,
    marginTop: 2,
  },
  childActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  childActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  childActionText: {
    fontSize: 12,
    fontWeight: '700',
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
