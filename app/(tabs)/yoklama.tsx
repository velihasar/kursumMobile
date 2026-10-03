import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { fetchAttendances, AttendanceRecord } from '@/lib/services/attendance-service';
import { fetchParentStudents, ChildStudent } from '@/lib/services/student-service';
import { QrScannerModal } from '@/components/ui/QrScannerModal';
import { Ionicons } from '@expo/vector-icons';

export default function YoklamaScreen() {
  const { palette, isDark } = useAppTheme();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<ChildStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(
    user?.studentId ? Number(user?.studentId) : undefined
  );
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Geldi' | 'Gelmedi' | 'İzinli' | 'Geç Kaldı'>('all');
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const loadData = async (targetStudentId?: number) => {
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
  };

  useEffect(() => {
    loadData();
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
    await loadData(selectedStudentId);
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
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: palette.text }]}>Devamsızlık & Yoklama</Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              Ders katılım ve yoklama durumlarınızın anlık takibi
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.qrHeaderBtn, { backgroundColor: palette.primary }]}
            onPress={() => setQrModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code" size={16} color="#FFFFFF" />
            <Text style={styles.qrHeaderBtnText}>QR Giriş</Text>
          </TouchableOpacity>
        </View>

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
            <Text style={[styles.rateLabel, { color: palette.textSecondary }]}>Genel Katılım Oranı</Text>
            <Text style={[styles.rateValue, { color: attendanceRate >= 85 ? palette.success : palette.warning }]}>
              %{attendanceRate}
            </Text>
            <Text style={[styles.rateSub, { color: palette.textMuted }]}>
              Toplam {totalRecords} ders kaydından
            </Text>
          </View>
          <View style={[styles.rateBadgeBox, { backgroundColor: attendanceRate >= 85 ? palette.successBg : palette.warningBg }]}>
            <Ionicons
              name={attendanceRate >= 85 ? 'shield-checkmark' : 'alert-circle'}
              size={36}
              color={attendanceRate >= 85 ? palette.success : palette.warning}
            />
          </View>
        </View>
      </Card>

      {/* Stats Summary Row (Dynamic) */}
      <View style={styles.statsRow}>
        <StatCard title="Gelinen" value={`${presentCount} Ders`} icon="checkmark-circle" color={palette.success} />
        <StatCard title="İzinli" value={`${leaveCount} Ders`} icon="information-circle" color={palette.info} />
        <StatCard title="Devamsız" value={`${absentCount} Ders`} icon="close-circle" color={palette.danger} />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
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
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isSelected ? '#FFFFFF' : palette.textSecondary, fontWeight: isSelected ? '700' : '500' },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Attendance History Section */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 16 }]}>
        Yoklama Kayıtları ({filteredRecords.length})
      </Text>

      {filteredRecords.length === 0 ? (
        <Card style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Ionicons name="clipboard-outline" size={40} color={palette.textMuted} />
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
                <Text style={[styles.recordCourse, { color: palette.text }]}>{r.courseName}</Text>
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
    </ScrollView>

    {/* QR Attendance Scanner Modal */}
    <QrScannerModal
      visible={qrModalVisible}
      onClose={() => setQrModalVisible(false)}
      students={students}
      initialStudentId={selectedStudentId}
      onSuccess={() => loadData(selectedStudentId)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 32,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  qrHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#2C98F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  qrHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    borderRadius: 12,
    borderWidth: 1,
  },
  studentTabText: {
    fontSize: 13,
  },
  rateCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  rateValue: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  rateSub: {
    fontSize: 11,
    marginTop: 2,
  },
  rateBadgeBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  recordCard: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordCourse: {
    fontSize: 15,
    fontWeight: '700',
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
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
