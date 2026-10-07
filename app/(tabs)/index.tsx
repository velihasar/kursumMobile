import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { fetchParentStudents, ChildStudent } from '@/lib/services/student-service';
import { fetchInstitutionInfo, InstitutionInfo } from '@/lib/services/institution-service';
import { fetchAnnouncements, AnnouncementItem } from '@/lib/services/announcement-service';
import { fetchEvents, EventItem } from '@/lib/services/event-service';
import { QrScannerModal } from '@/components/ui/QrScannerModal';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { Ionicons } from '@expo/vector-icons';

export { EventItem, AnnouncementItem };

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { palette, isDark } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<ChildStudent[]>([]);
  const [institution, setInstitution] = useState<InstitutionInfo | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [logoError, setLogoError] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [activeQrStudentId, setActiveQrStudentId] = useState<number | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  const loadData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const parentId = user?.parentId;
      const defaultStudentId = user?.studentId;

      const [sList, inst, annList, evtList] = await Promise.all([
        fetchParentStudents(parentId, defaultStudentId),
        fetchInstitutionInfo(user?.tenantId),
        fetchAnnouncements(user?.tenantId),
        fetchEvents(user?.tenantId),
      ]);

      setStudents(sList);
      setInstitution(inst);
      setAnnouncements(annList);
      setEvents(evtList);
      setLogoError(false);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [user?.studentId, user?.parentId, user?.tenantId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  const isParent = user?.role === 'Parent' || (user?.roles?.some((r) => r.toLowerCase().includes('veli') || r.toLowerCase().includes('parent')));

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      {/* Fixed Top Header with Dual Branding (Kursum Brand + Institution Badge) */}
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
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <Image
              source={require('@/assets/images/screen.png')}
              style={styles.brandLogoImg}
              resizeMode="contain"
            />
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
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: 40,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
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
            <View style={{ alignItems: 'center', padding: 20 }}>
              <View style={[styles.emptyAvatarBox, { backgroundColor: palette.primaryLight }]}>
                <Ionicons name="person-outline" size={28} color={palette.primary} />
              </View>
              <Text style={{ color: palette.textSecondary, marginTop: 12, fontSize: 13, textAlign: 'center' }}>
                Kayıtlı öğrenci bilgisi yükleniyor veya atanmış öğrenci bulunmuyor.
              </Text>
            </View>
          </Card>
        ) : (
          students.map((st) => (
            <Card key={st.id} style={[styles.childCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              {/* Child Header with avatar, checkmark & participation badge */}
              <View style={styles.childHeader}>
                <View style={styles.avatarWrapper}>
                  <View style={[styles.childAvatarBox, { backgroundColor: palette.primaryLight }]}>
                    <Ionicons name="person" size={22} color={palette.primary} />
                  </View>
                  <View style={[styles.verifiedCheckDot, { backgroundColor: palette.success }]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.childRoleTag, { color: palette.textSecondary }]}>ÖĞRENCİ</Text>
                  <Text style={[styles.childName, { color: palette.text }]}>{st.fullName}</Text>
                </View>
                <Badge
                  label={`%${st.attendanceRate ?? 100} Katılım`}
                  variant={st.attendanceRate && st.attendanceRate < 85 ? 'warning' : 'success'}
                />
              </View>

              {/* Next Lesson Focus Card */}
              <TouchableOpacity
                style={[
                  styles.nextLessonBox,
                  {
                    backgroundColor: isDark ? '#111C2E' : '#F0F5FF',
                    borderColor: isDark ? '#1E2F48' : '#DBEAFE',
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/dersler')}
              >
                <View style={styles.nextLessonTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.nextLessonMiniIcon, { backgroundColor: isDark ? '#2D1A04' : '#FFF7ED' }]}>
                      <Ionicons name="time" size={14} color={palette.accent} />
                    </View>
                    <Text style={[styles.nextLessonTag, { color: palette.accent }]}>ÖNÜMÜZDEKİ DERS</Text>
                  </View>

                  {st.nextLesson?.time ? (
                    <View style={[styles.timeBadge, { backgroundColor: palette.accent }]}>
                      <Text style={styles.timeBadgeText}>
                        {st.nextLesson.time.toLowerCase().includes('bugün') ? st.nextLesson.time : `Bugün ${st.nextLesson.time}`}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.nextLessonContentRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.nextLessonTitle, { color: palette.text }]} numberOfLines={1}>
                      {st.nextLesson?.subject || (st.courseCount > 0 ? 'Kayıtlı Dersler' : 'Ders Kaydı Yok')}
                    </Text>
                    {(st.nextLesson?.teacher || st.nextLesson?.classroom) ? (
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={13} color={palette.textSecondary} />
                        <Text style={[styles.nextLessonSub, { color: palette.textSecondary }]} numberOfLines={1}>
                          {[st.nextLesson.classroom, st.nextLesson.teacher].filter(Boolean).join(' • ')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.nextLessonSub, { color: palette.textSecondary }]}>
                        {(st.courseCount ?? 0) > 0 ? `${st.courseCount} Aktif Ders Kaydı` : 'Ders programı tanımlanmadı'}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.nextLessonArrowBtn, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                    <Ionicons name="arrow-forward" size={16} color={palette.primary} />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Child Payment & Canteen Box */}
              <TouchableOpacity
                style={[
                  styles.childPaymentBox,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: palette.border,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/cuzdan')}
              >
                <View
                  style={[
                    styles.childPaymentIconBadge,
                    { backgroundColor: st.paymentInfo?.hasDebt ? palette.accentLight : palette.successBg },
                  ]}
                >
                  <Ionicons
                    name={st.paymentInfo?.hasDebt ? 'card' : 'checkmark-circle'}
                    size={18}
                    color={st.paymentInfo?.hasDebt ? palette.accent : palette.success}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                      <Text style={[styles.paymentStatusTitle, { color: palette.text }]} numberOfLines={1}>
                        {st.paymentInfo?.hasDebt ? 'Sonraki Taksit' : 'Taksit & Ödeme'}
                      </Text>
                      <Badge
                        label={st.paymentInfo?.hasDebt ? 'Taksit Var' : 'Ödendi'}
                        variant={st.paymentInfo?.hasDebt ? 'accent' : 'success'}
                      />
                    </View>

                    {st.paymentInfo?.balance !== undefined ? (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.canteenLabelText, { color: palette.textSecondary }]}>Kantin Bakiye</Text>
                        <Text style={[styles.canteenAmountText, { color: palette.primary }]}>
                          ₺{st.paymentInfo.balance.toFixed(2)}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={[styles.paymentDateSub, { color: palette.textSecondary }]} numberOfLines={1}>
                    {st.paymentInfo?.hasDebt
                      ? `Son Ödeme: ${st.paymentInfo.nextPaymentDate}`
                      : 'Tüm ödemeler güncel • Borç yok'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 3-Grid Quick Action Cards (QR Giriş, Program, Yoklama) */}
              <View style={styles.quickActionGrid}>
                {/* 1. QR Giriş */}
                <TouchableOpacity
                  style={[
                    styles.quickActionCard,
                    {
                      backgroundColor: isDark ? '#2D1B0B' : '#FFF7ED',
                      borderColor: isDark ? '#451A03' : '#FFEDD5',
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => {
                    setActiveQrStudentId(st.id);
                    setQrModalVisible(true);
                  }}
                >
                  <View style={[styles.quickActionIconBox, { backgroundColor: isDark ? '#3D2406' : '#FFEDD5' }]}>
                    <Ionicons name="qr-code" size={18} color={palette.accent} />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: palette.text }]}>QR Giriş</Text>
                </TouchableOpacity>

                {/* 2. Program */}
                <TouchableOpacity
                  style={[
                    styles.quickActionCard,
                    {
                      backgroundColor: isDark ? '#111C2E' : '#EEF2FF',
                      borderColor: isDark ? '#1E2F48' : '#E0E7FF',
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => router.push('/(tabs)/dersler')}
                >
                  <View style={[styles.quickActionIconBox, { backgroundColor: isDark ? '#1E293B' : '#E0E7FF' }]}>
                    <Ionicons name="calendar" size={18} color={palette.primary} />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: palette.text }]}>
                    Program({st.courseCount ?? 0})
                  </Text>
                </TouchableOpacity>

                {/* 3. Yoklama */}
                <TouchableOpacity
                  style={[
                    styles.quickActionCard,
                    {
                      backgroundColor: isDark ? '#063B28' : '#ECFDF5',
                      borderColor: isDark ? '#065F46' : '#D1FAE5',
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => router.push('/(tabs)/yoklama')}
                >
                  <View style={[styles.quickActionIconBox, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }]}>
                    <Ionicons name="checkbox" size={18} color={palette.success} />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: palette.text }]}>Yoklama</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Events / Activities Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="sparkles" size={17} color={palette.accent} />
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Yaklaşan Etkinlikler & Sınavlar</Text>
          </View>
          <Badge label={`${events.length} Etkinlik`} variant="accent" />
        </View>

        {events.length === 0 ? (
          <Card style={[styles.emptySectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Ionicons name="calendar-outline" size={24} color={palette.textSecondary} />
            <Text style={[styles.emptySectionText, { color: palette.textSecondary }]}>
              Planlanmış aktif etkinlik bulunmuyor.
            </Text>
          </Card>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsScrollContainer}
          >
            {events.map((evt) => (
              <TouchableOpacity
                key={evt.id}
                style={[
                  styles.eventCard,
                  {
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedEvent(evt)}
              >
                {/* Top row: Date badge + Category Pill */}
                <View style={styles.eventTopRow}>
                  <View style={[styles.eventDateBox, { backgroundColor: isDark ? '#2D1A04' : '#FFF4E6', borderColor: palette.accent }]}>
                    <Text style={[styles.eventDayNumber, { color: palette.accent }]}>{evt.dayNumber}</Text>
                    <Text style={[styles.eventMonthName, { color: palette.accent }]}>{evt.monthName}</Text>
                  </View>

                  <Badge label={evt.category} variant={evt.categoryVariant} />
                </View>

                <Text style={[styles.eventTitle, { color: palette.text }]} numberOfLines={2}>
                  {evt.title}
                </Text>

                <View style={styles.eventInfoFooter}>
                  <View style={styles.eventInfoRow}>
                    <Ionicons name="time-outline" size={13} color={palette.textSecondary} />
                    <Text style={[styles.eventInfoText, { color: palette.textSecondary }]}>{evt.time}</Text>
                  </View>

                  <View style={styles.eventInfoRow}>
                    <Ionicons name="location-outline" size={13} color={palette.textSecondary} />
                    <Text style={[styles.eventInfoText, { color: palette.textSecondary }]} numberOfLines={1}>
                      {evt.location}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Announcements Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="megaphone" size={17} color={palette.primary} />
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Kurum Duyuruları</Text>
          </View>
          <Badge label={`${announcements.length} Duyuru`} variant="info" />
        </View>

        {announcements.length === 0 ? (
          <Card style={[styles.emptySectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={[styles.emptyAnnouncementIconBox, { backgroundColor: palette.primaryLight }]}>
              <Ionicons name="megaphone-outline" size={24} color={palette.primary} />
            </View>
            <Text style={[styles.emptySectionTitle, { color: palette.text }]}>
              Her Şey Güncel!
            </Text>
            <Text style={[styles.emptySectionText, { color: palette.textSecondary }]}>
              Yayınlanmış aktif bir duyuru bulunmuyor. Yeni bir haber olduğunda burada göreceksiniz.
            </Text>
          </Card>
        ) : (
          <View style={styles.announcementsList}>
            {announcements.map((ann) => (
              <TouchableOpacity
                key={ann.id}
                style={[
                  styles.announcementCard,
                  {
                    backgroundColor: palette.card,
                    borderColor: ann.isImportant ? palette.primary : palette.border,
                    borderLeftWidth: ann.isImportant ? 4 : 1,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedAnnouncement(ann)}
              >
                <View style={styles.announcementHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Badge label={ann.tag} variant={ann.isImportant ? 'primary' : 'accent'} />
                    {ann.isImportant && (
                      <View style={[styles.importantPill, { backgroundColor: palette.primaryLight }]}>
                        <Ionicons name="alert-circle" size={12} color={palette.primary} />
                        <Text style={[styles.importantPillText, { color: palette.primary }]}>Önemli</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.announcementDateText, { color: palette.textMuted }]}>{ann.date}</Text>
                </View>

                <Text style={[styles.announcementTitle, { color: palette.text }]}>{ann.title}</Text>
                <Text style={[styles.announcementSummary, { color: palette.textSecondary }]} numberOfLines={2}>
                  {ann.summary}
                </Text>

                <View style={styles.announcementFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="business-outline" size={13} color={palette.textMuted} />
                    <Text style={[styles.announcementAuthor, { color: palette.textMuted }]}>{ann.author}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={[styles.readMoreText, { color: palette.primary }]}>Detayları Gör</Text>
                    <Ionicons name="chevron-forward" size={13} color={palette.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
          </>
        )}
      </ScrollView>

      {/* Event Detail Modal */}
      <Modal
        visible={!!selectedEvent}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {selectedEvent && (
              <>
                <View style={styles.modalHeaderRow}>
                  <Badge label={selectedEvent.category} variant={selectedEvent.categoryVariant} />
                  <TouchableOpacity
                    onPress={() => setSelectedEvent(null)}
                    style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                  >
                    <Ionicons name="close" size={18} color={palette.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalTitle, { color: palette.text }]}>{selectedEvent.title}</Text>

                <View style={[styles.modalMetaBox, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: palette.border }]}>
                  <View style={styles.modalMetaRow}>
                    <Ionicons name="calendar" size={16} color={palette.accent} />
                    <Text style={[styles.modalMetaText, { color: palette.text }]}>{selectedEvent.date}</Text>
                  </View>

                  <View style={styles.modalMetaRow}>
                    <Ionicons name="time" size={16} color={palette.primary} />
                    <Text style={[styles.modalMetaText, { color: palette.text }]}>{selectedEvent.time}</Text>
                  </View>

                  <View style={styles.modalMetaRow}>
                    <Ionicons name="location" size={16} color={palette.success} />
                    <Text style={[styles.modalMetaText, { color: palette.text }]}>{selectedEvent.location}</Text>
                  </View>

                  <View style={styles.modalMetaRow}>
                    <Ionicons name="people" size={16} color={palette.textSecondary} />
                    <Text style={[styles.modalMetaText, { color: palette.textSecondary }]}>Hedef Kitle: {selectedEvent.targetAudience}</Text>
                  </View>
                </View>

                <Text style={[styles.modalDesc, { color: palette.textSecondary }]}>{selectedEvent.description}</Text>

                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: palette.primary }]}
                  onPress={() => setSelectedEvent(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalActionBtnText}>Anladım / Kapat</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Announcement Detail Modal */}
      <Modal
        visible={!!selectedAnnouncement}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {selectedAnnouncement && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Badge label={selectedAnnouncement.tag} variant={selectedAnnouncement.isImportant ? 'primary' : 'accent'} />
                    {selectedAnnouncement.isImportant && (
                      <Badge label="Önemli" variant="primary" />
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedAnnouncement(null)}
                    style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                  >
                    <Ionicons name="close" size={18} color={palette.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalTitle, { color: palette.text }]}>{selectedAnnouncement.title}</Text>
                <Text style={[styles.modalSubtitle, { color: palette.textMuted }]}>
                  {selectedAnnouncement.author} • {selectedAnnouncement.date}
                </Text>

                <ScrollView style={{ maxHeight: 240, marginVertical: 12 }}>
                  <Text style={[styles.modalLongContent, { color: palette.text }]}>{selectedAnnouncement.content}</Text>
                </ScrollView>

                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: palette.primary }]}
                  onPress={() => setSelectedAnnouncement(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalActionBtnText}>Kapat</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* QR Attendance Scanner Modal */}
      <QrScannerModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        students={students}
        initialStudentId={activeQrStudentId}
        onSuccess={loadData}
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
  content: {
    padding: 18,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoImg: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginLeft: 8,
  },
  institutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '54%',
    gap: 6,
  },
  instMiniLogo: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  institutionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  childCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  childAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedCheckDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  emptyAvatarBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childRoleTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  childName: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },

  /* Next Lesson */
  nextLessonBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  nextLessonTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nextLessonMiniIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextLessonTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  nextLessonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextLessonTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  nextLessonSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  nextLessonArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },

  /* Child Payment Box */
  childPaymentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  childPaymentIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  canteenLabelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  canteenAmountText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  paymentDateSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  /* 3-Grid Quick Action Cards */
  quickActionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  quickActionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  /* Empty Cards */
  emptySectionCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  emptyAnnouncementIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptySectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySectionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },

  /* Events Styles */
  eventsScrollContainer: {
    gap: 12,
    paddingRight: 10,
    paddingVertical: 2,
  },
  eventCard: {
    width: 270,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventDateBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 50,
  },
  eventDayNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  eventMonthName: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventInfoFooter: {
    gap: 5,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventInfoText: {
    fontSize: 11,
    fontWeight: '500',
  },

  /* Announcements Styles */
  announcementsList: {
    gap: 12,
  },
  announcementCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  announcementHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  importantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 12,
  },
  importantPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  announcementDateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  announcementSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 10,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.12)',
  },
  announcementAuthor: {
    fontSize: 11,
    fontWeight: '500',
  },
  readMoreText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  modalMetaBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginVertical: 12,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalLongContent: {
    fontSize: 13,
    lineHeight: 21,
  },
  modalActionBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

