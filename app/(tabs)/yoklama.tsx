import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { fetchAttendances, AttendanceRecord } from '@/lib/services/attendance-service';
import { fetchParentStudents, ChildStudent } from '@/lib/services/student-service';
import { QrScannerModal } from '@/components/ui/QrScannerModal';
import { AttendanceSkeleton } from '@/components/ui/Skeleton';
import { Ionicons } from '@expo/vector-icons';

export default function YoklamaScreen() {
  const insets = useSafeAreaInsets();
  const { palette, isDark } = useAppTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<ChildStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(
    user?.studentId ? Number(user?.studentId) : undefined
  );
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Geldi' | 'Gelmedi' | 'İzinli' | 'Geç Kaldı'>('all');
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const loadData = async (targetStudentId?: number, isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const parentId = user?.parentId;
      const defaultStudentId = user?.studentId;

      const sList = await fetchParentStudents(parentId, defaultStudentId);
      setStudents(sList);

      const activeId = targetStudentId !== undefined
        ? targetStudentId
        : (selectedStudentId !== undefined ? selectedStudentId : (sList[0]?.id || (defaultStudentId ? Number(defaultStudentId) : undefined)));

      if (activeId !== selectedStudentId && activeId !== undefined) {
        setSelectedStudentId(activeId);
      }

      const list = await fetchAttendances(activeId);
      setRecords(list);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(undefined, true);
  }, [user?.studentId, user?.parentId]);

  const handleSelectStudent = async (sId: number) => {
    setSelectedStudentId(sId);
    setRefreshing(true);
    const list = await fetchAttendances(sId);
    setRecords(list);
    setRefreshing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(selectedStudentId, false);
    setRefreshing(false);
  };

  // Dynamic statistics
  const totalRecords = records.length;
  const presentCount = records.filter((r) => r.status === 'Geldi').length;
  const leaveCount = records.filter((r) => r.status === 'İzinli').length;
  const absentCount = records.filter((r) => r.status === 'Gelmedi').length;
  const lateCount = records.filter((r) => r.status === 'Geç Kaldı').length;

  const attendanceRate = totalRecords > 0
    ? Math.round(((presentCount + lateCount) / totalRecords) * 100)
    : 100;

  // Filtered records
  const filteredRecords = selectedFilter === 'all'
    ? records
    : records.filter((r) => r.status === selectedFilter);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Geldi': return 'success';
      case 'Gelmedi': return 'danger';
      case 'İzinli': return 'info';
      case 'Geç Kaldı': return 'warning';
      default: return 'primary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Geldi': return 'checkmark-circle';
      case 'Gelmedi': return 'close-circle';
      case 'İzinli': return 'information-circle';
      case 'Geç Kaldı': return 'time';
      default: return 'calendar-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Geldi': return palette.success;
      case 'Gelmedi': return palette.danger;
      case 'İzinli': return palette.info;
      case 'Geç Kaldı': return palette.warning;
      default: return palette.textSecondary;
    }
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
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: palette.text }]}>Devamsızlık & Yoklama</Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              Ders katılım ve yoklama durumlarınızın anlık takibi
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.qrHeaderBtn, { backgroundColor: palette.accent }]}
            onPress={() => setQrModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code" size={16} color="#FFFFFF" />
            <Text style={styles.qrHeaderBtnText}>QR Giriş</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        {loading ? (
          <AttendanceSkeleton />
        ) : (
          <>
            {/* Multiple Children Switcher Tabs (if Parent has > 1 student) */}
            {students.length > 1 && (
              <View style={styles.studentTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.studentTabsScroll}>
            {students.map((st) => {
              const isSelected = selectedStudentId === st.id;
              return (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.studentTab,
                    {
                      backgroundColor: isSelected ? palette.primary : palette.card,
                      borderColor: isSelected ? palette.primary : palette.border,
                    },
                  ]}
                  onPress={() => handleSelectStudent(st.id)}
                >
                  <Ionicons
                    name="person"
                    size={14}
                    color={isSelected ? '#FFFFFF' : palette.textSecondary}
                  />
                  <Text
                    style={[
                      styles.studentTabText,
                      { color: isSelected ? '#FFFFFF' : palette.text, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {st.fullName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Overall Attendance Rate Card */}
      <Card style={[styles.rateCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.rateRow}>
          <View>
            <Text style={[styles.rateLabel, { color: palette.textSecondary }]}>GENEL KATILIM ORANI</Text>
            <Text style={[styles.rateValue, { color: attendanceRate >= 85 ? palette.success : palette.warning }]}>
              %{attendanceRate}
            </Text>
            <Text style={[styles.rateSub, { color: palette.textMuted }]}>
              Toplam <Text style={{ fontWeight: '700', color: palette.text }}>{totalRecords}</Text> ders kaydından
            </Text>
          </View>
          <View style={[styles.rateBadgeBox, { backgroundColor: attendanceRate >= 85 ? (isDark ? '#064E3B' : '#ECFDF5') : (isDark ? '#78350F' : '#FFFBEB') }]}>
            <Ionicons
              name={attendanceRate >= 85 ? 'shield-checkmark' : 'alert-circle'}
              size={32}
              color={attendanceRate >= 85 ? palette.success : palette.warning}
            />
          </View>
        </View>
      </Card>

      {/* 3-Column Metrics Grid */}
      <View style={styles.statsRow}>
        {/* Gelinen */}
        <View style={[styles.statBox, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.statBoxTop}>
            <Text style={[styles.statBoxLabel, { color: palette.textSecondary }]}>Gelinen</Text>
            <View style={[styles.statMiniBadge, { backgroundColor: palette.successBg }]}>
              <Ionicons name="checkmark" size={11} color={palette.success} />
            </View>
          </View>
          <Text style={[styles.statBoxNumber, { color: palette.text }]}>
            {presentCount} <Text style={[styles.statBoxUnit, { color: palette.textSecondary }]}>Ders</Text>
          </Text>
        </View>

        {/* İzinli */}
        <View style={[styles.statBox, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.statBoxTop}>
            <Text style={[styles.statBoxLabel, { color: palette.textSecondary }]}>İzinli</Text>
            <View style={[styles.statMiniBadge, { backgroundColor: palette.infoBg }]}>
              <Ionicons name="information" size={11} color={palette.info} />
            </View>
          </View>
          <Text style={[styles.statBoxNumber, { color: palette.text }]}>
            {leaveCount} <Text style={[styles.statBoxUnit, { color: palette.textSecondary }]}>Ders</Text>
          </Text>
        </View>

        {/* Devamsız */}
        <View style={[styles.statBox, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.statBoxTop}>
            <Text style={[styles.statBoxLabel, { color: palette.textSecondary }]}>Devamsız</Text>
            <View style={[styles.statMiniBadge, { backgroundColor: palette.dangerBg }]}>
              <Ionicons name="close" size={11} color={palette.danger} />
            </View>
          </View>
          <Text style={[styles.statBoxNumber, { color: palette.text }]}>
            {absentCount} <Text style={[styles.statBoxUnit, { color: palette.textSecondary }]}>Ders</Text>
          </Text>
        </View>
      </View>

      {/* Filter Chips Horizontal Scroll */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {(['all', 'Geldi', 'Gelmedi', 'İzinli', 'Geç Kaldı'] as const).map((filter) => {
            const isSelected = selectedFilter === filter;
            const label = filter === 'all' ? 'Tümü' : filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? palette.primary : palette.card,
                    borderColor: isSelected ? palette.primary : palette.border,
                  },
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : palette.textSecondary, fontWeight: isSelected ? '700' : '600' },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Attendance History Section */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 14 }]}>
        Yoklama Kayıtları ({filteredRecords.length})
      </Text>

      {filteredRecords.length === 0 ? (
        <Card style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#111C2E' : '#F8FAFC' }]}>
            <Ionicons name="clipboard-outline" size={32} color={palette.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>Kayıt Bulunamadı</Text>
          <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
            {selectedFilter === 'all'
              ? 'Henüz girilmiş bir yoklama kaydı bulunmamaktadır.'
              : `Seçilen "${selectedFilter}" filtresine uygun kayıt bulunamadı.`}
          </Text>
        </Card>
      ) : (
        filteredRecords.map((r) => (
          <Card key={r.id} style={[styles.recordCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.recordRow}>
              <View style={[styles.iconBox, { backgroundColor: palette.borderLight }]}>
                <Ionicons name={getStatusIcon(r.status)} size={22} color={getStatusColor(r.status)} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.recordCourse, { color: palette.text }]} numberOfLines={1}>{r.courseName}</Text>
                <Text style={[styles.recordDate, { color: palette.textMuted }]}>{r.date}</Text>
                {r.note ? (
                  <Text style={[styles.recordNote, { color: palette.textSecondary }]}>
                    {r.note}
                  </Text>
                ) : null}
              </View>
              <Badge label={r.status} variant={getStatusBadgeVariant(r.status)} />
            </View>
          </Card>
        ))
      )}
          </>
        )}
      </ScrollView>

      {/* QR Attendance Scanner Modal */}
      <QrScannerModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        students={students}
        initialStudentId={selectedStudentId}
        onSuccess={() => loadData(selectedStudentId)}
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
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
  qrHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  qrHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  studentTabsContainer: {
    marginBottom: 14,
  },
  studentTabsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  studentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  studentTabText: {
    fontSize: 13,
  },
  rateCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  rateValue: {
    fontSize: 34,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  rateSub: {
    fontSize: 12,
    marginTop: 3,
  },
  rateBadgeBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* 3-Column Metrics */
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  statBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statBoxLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statMiniBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBoxNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  statBoxUnit: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* Filters */
  filterContainer: {
    marginBottom: 10,
    marginHorizontal: -18,
  },
  filterScrollContent: {
    paddingHorizontal: 18,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  recordCard: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordCourse: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  recordDate: {
    fontSize: 12,
    marginTop: 2,
  },
  recordNote: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 26,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});

