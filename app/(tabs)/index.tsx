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
import { Ionicons } from '@expo/vector-icons';

export { EventItem, AnnouncementItem };

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { palette, isDark } = useAppTheme();

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

  const loadData = async () => {
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
                Kayıtlı öğrenci bilgisi yükleniyor veya atanmış öğrenci bulunmuyor.
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
                <View style={[styles.nextLessonIconBadge, { backgroundColor: palette.accentLight }]}>
                  <Ionicons name="time" size={18} color={palette.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={[styles.nextLessonTag, { color: palette.accent }]}>ÖNÜMÜZDEKİ DERS</Text>
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

              {/* Child Payment & Installment Box */}
              <TouchableOpacity
                style={[
                  styles.childPaymentBox,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: st.paymentInfo?.hasDebt ? (isDark ? '#451A03' : '#FFEDD5') : palette.border,
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
                    size={16}
                    color={st.paymentInfo?.hasDebt ? palette.accent : palette.success}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.paymentStatusTitle, { color: palette.text }]}>
                      {st.paymentInfo?.hasDebt ? 'Sonraki Taksit' : 'Taksit & Ödeme Durumu'}
                    </Text>
                    {st.paymentInfo?.hasDebt ? (
                      <Text style={[styles.paymentAmountText, { color: palette.accent }]}>
                        ₺{st.paymentInfo.nextPaymentAmount.toFixed(2)}
                      </Text>
                    ) : (
                      <Badge label="Ödendi" variant="success" />
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={[styles.paymentDateSub, { color: palette.textSecondary }]}>
                      {st.paymentInfo?.hasDebt
                        ? `Son Ödeme: ${st.paymentInfo.nextPaymentDate}`
                        : 'Tüm ödemeler güncel • Borç yok'}
                    </Text>
                    {st.paymentInfo?.balance !== undefined && (
                      <Text style={[styles.canteenBalSub, { color: palette.textMuted }]}>
                        Kantin: ₺{st.paymentInfo.balance.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Action Quick Links for this Child */}
              <View style={styles.childActionsRow}>
                <TouchableOpacity
                  style={[styles.childActionBtn, { borderColor: palette.accent, backgroundColor: palette.accentLight }]}
                  onPress={() => {
                    setActiveQrStudentId(st.id);
                    setQrModalVisible(true);
                  }}
                >
                  <Ionicons name="qr-code" size={15} color={palette.accent} />
                  <Text style={[styles.childActionText, { color: palette.accent }]}>QR Giriş</Text>
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
            <Ionicons name="megaphone-outline" size={24} color={palette.textSecondary} />
            <Text style={[styles.emptySectionText, { color: palette.textSecondary }]}>
              Yayınlanmış aktif duyuru bulunmuyor.
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
    </>
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

  announcementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '800',
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
  childPaymentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 13,
    borderWidth: 1,
    marginBottom: 12,
  },
  childPaymentIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  paymentAmountText: {
    fontSize: 13,
    fontWeight: '900',
  },
  paymentDateSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  canteenBalSub: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Empty Cards */
  emptySectionCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  emptySectionText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  /* Events Styles */
  eventsScrollContainer: {
    gap: 12,
    paddingRight: 10,
    paddingVertical: 2,
  },
  eventCard: {
    width: 260,
    padding: 16,
    borderRadius: 18,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 48,
  },
  eventDayNumber: {
    fontSize: 16,
    fontWeight: '900',
  },
  eventMonthName: {
    fontSize: 9,
    fontWeight: '800',
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
    borderRadius: 16,
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
    borderRadius: 8,
  },
  importantPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  announcementDateText: {
    fontSize: 11,
    fontWeight: '500',
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
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
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
    borderRadius: 22,
    padding: 20,
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
    width: 30,
    height: 30,
    borderRadius: 15,
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
    padding: 12,
    borderRadius: 14,
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
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
