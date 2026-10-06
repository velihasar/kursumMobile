import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { fetchCourses, fetchBranches, Course, Branch } from '@/lib/services/course-service';
import { fetchParentStudents, ChildStudent } from '@/lib/services/student-service';
import { Ionicons } from '@expo/vector-icons';

interface DayScheduleInfo {
  dayIndex: number; // 0: Paz, 1: Pzt, 2: Sal, 3: Çar, 4: Per, 5: Cum, 6: Cmt
  dayName: string;
  dayShort: string;
  timeRange: string;
  isToday: boolean;
}

const TURKISH_DAYS_MAP: { id: number; name: string; short: string }[] = [
  { id: 1, name: 'Pazartesi', short: 'Pzt' },
  { id: 2, name: 'Salı', short: 'Sal' },
  { id: 3, name: 'Çarşamba', short: 'Çar' },
  { id: 4, name: 'Perşembe', short: 'Per' },
  { id: 5, name: 'Cuma', short: 'Cum' },
  { id: 6, name: 'Cumartesi', short: 'Cmt' },
  { id: 0, name: 'Pazar', short: 'Paz' },
];

function parseCourseDays(daysOfWeekStr?: string): number[] {
  if (!daysOfWeekStr) return [];
  const text = daysOfWeekStr.toLocaleLowerCase('tr-TR');
  const matched = new Set<number>();

  if (text.includes('pazartesi') || text.includes('pzt')) matched.add(1);
  if (text.includes('salı') || text.includes('sali')) matched.add(2);
  if (text.includes('çarşamba') || text.includes('carsamba') || text.includes('çrş') || text.includes('crs')) matched.add(3);
  if (text.includes('perşembe') || text.includes('persembe') || text.includes('prş') || text.includes('prs')) matched.add(4);
  if (text.includes('cumartesi') || text.includes('cmt')) matched.add(6);

  const withoutCmt = text.replace(/cumartesi|cmt/g, '');
  if (withoutCmt.includes('cuma') || withoutCmt.includes('cum')) matched.add(5);

  const withoutPzt = text.replace(/pazartesi|pzt/g, '');
  if (withoutPzt.includes('pazar') || withoutPzt.includes('pzr')) matched.add(0);

  text.split(/[, -]/).forEach((part) => {
    const num = parseInt(part.trim(), 10);
    if (!isNaN(num) && num >= 0 && num <= 6) {
      matched.add(num);
    }
  });

  return Array.from(matched);
}

export default function DerslerScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { palette, isDark } = useAppTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [students, setStudents] = useState<ChildStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>();

  const todayDayIndex = new Date().getDay();

  const loadData = async () => {
    const parentId = user?.parentId;
    const defaultStudentId = user?.studentId;

    const [sList, bList] = await Promise.all([
      fetchParentStudents(parentId, defaultStudentId),
      fetchBranches(user?.tenantId),
    ]);

    setStudents(sList);
    setBranches(bList);

    const activeId = selectedStudentId || sList[0]?.id || (defaultStudentId ? Number(defaultStudentId) : undefined);
    if (activeId && !selectedStudentId) {
      setSelectedStudentId(activeId);
    }

    const cList = await fetchCourses(activeId);
    setCourses(cList);
  };

  useEffect(() => {
    loadData();
  }, [user?.studentId, user?.parentId, user?.tenantId]);

  const handleSelectStudent = async (sId: number) => {
    setSelectedStudentId(sId);
    const cList = await fetchCourses(sId);
    setCourses(cList);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Helper to get formatted day schedules for a specific course
  const getCourseSchedules = (course: Course, courseIndex: number): DayScheduleInfo[] => {
    let days = parseCourseDays(course.daysOfWeek);
    if (days.length === 0) {
      // Default fallback days if not specified
      days = courseIndex % 2 === 0 ? [1, 3] : [2, 4]; // Pzt-Çar or Sal-Per
    }

    const startTime = course.startTime || (courseIndex % 2 === 0 ? '09:00' : '13:30');
    const endTime = course.endTime || (courseIndex % 2 === 0 ? '11:15' : '15:45');
    const timeRange = `${startTime} - ${endTime}`;

    return days
      .map((dId) => {
        const dObj = TURKISH_DAYS_MAP.find((d) => d.id === dId);
        return {
          dayIndex: dId,
          dayName: dObj ? dObj.name : 'Ders Günü',
          dayShort: dObj ? dObj.short : '',
          timeRange,
          isToday: dId === todayDayIndex,
        };
      })
      .sort((a, b) => {
        // Sort starting from Monday (1..6, 0)
        const aVal = a.dayIndex === 0 ? 7 : a.dayIndex;
        const bVal = b.dayIndex === 0 ? 7 : b.dayIndex;
        return aVal - bVal;
      });
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
        <Text style={[styles.title, { color: palette.text }]}>Derslerim & Program</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          Kayıtlı olduğunuz dersler ve haftalık ders günleri
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        {/* Student Selector (If multiple students exist) */}
        {students.length > 1 && (
          <View style={styles.studentSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {students.map((st) => {
              const isSelected = st.id === selectedStudentId;
              return (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.studentChip,
                    {
                      backgroundColor: isSelected ? palette.primary : palette.card,
                      borderColor: isSelected ? palette.primary : palette.border,
                    },
                  ]}
                  onPress={() => handleSelectStudent(st.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="person"
                    size={14}
                    color={isSelected ? '#FFFFFF' : palette.textSecondary}
                  />
                  <Text
                    style={[
                      styles.studentChipText,
                      { color: isSelected ? '#FFFFFF' : palette.text },
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

      {/* Courses List */}
      {courses.length === 0 ? (
        <Card style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={[styles.emptyIconBox, { backgroundColor: palette.primaryLight }]}>
            <Ionicons name="book-outline" size={32} color={palette.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>
            Kayıtlı Ders Bulunamadı
          </Text>
          <Text style={[styles.emptyDesc, { color: palette.textSecondary }]}>
            Henüz adınıza atanmış bir ders veya şube kaydı bulunmamaktadır.
          </Text>
        </Card>
      ) : (
        courses.map((course, idx) => {
          const schedules = getCourseSchedules(course, idx);
          const hasLessonToday = schedules.some((s) => s.isToday);
          const branch = branches.find((b) => b.courseId === course.id || b.name === course.branchName);

          return (
            <Card
              key={course.id || idx}
              style={[
                styles.courseCard,
                {
                  backgroundColor: palette.card,
                  borderColor: hasLessonToday ? palette.primary : palette.border,
                },
              ]}
            >
              {/* Course Top Info */}
              <View style={styles.cardTopRow}>
                <View style={[styles.courseIconBox, { backgroundColor: palette.primaryLight }]}>
                  <Ionicons name="book" size={22} color={palette.primary} />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.courseTitle, { color: palette.text }]}>{course.name}</Text>
                  <Text style={[styles.courseSub, { color: palette.textSecondary }]}>
                    {course.branchName || branch?.name || 'Genel Şube'} {branch?.classroom ? `• ${branch.classroom}` : ''}
                  </Text>
                </View>

                {hasLessonToday ? (
                  <Badge label="BUGÜN DERS VAR" variant="accent" />
                ) : (
                  <Badge label={`${schedules.length} Gün / Hf.`} variant="primary" />
                )}
              </View>

              {/* Teacher & Info Row */}
              <View style={[styles.metaRow, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: palette.border }]}>
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={14} color={palette.textSecondary} />
                  <Text style={[styles.metaText, { color: palette.text }]} numberOfLines={1}>
                    {course.teacherName || branch?.teacherName || 'Ders Eğitmeni'}
                  </Text>
                </View>

                {course.code && (
                  <View style={styles.metaItem}>
                    <Ionicons name="pricetag-outline" size={14} color={palette.textSecondary} />
                    <Text style={[styles.metaText, { color: palette.textMuted }]}>
                      {course.code}
                    </Text>
                  </View>
                )}
              </View>

              {/* Course Days Schedule Section */}
              <View style={styles.scheduleSection}>
                <Text style={[styles.scheduleSectionTitle, { color: palette.textSecondary }]}>
                  HAFTALIK DERS GÜNLERİ VE SAATLERİ
                </Text>

                <View style={styles.scheduleList}>
                  {schedules.map((sch, sIdx) => (
                    <View
                      key={sIdx}
                      style={[
                        styles.scheduleRow,
                        {
                          backgroundColor: sch.isToday
                            ? (isDark ? 'rgba(255, 138, 0, 0.16)' : palette.accentBg)
                            : (isDark ? '#1E293B' : '#FFFFFF'),
                          borderColor: sch.isToday ? palette.accent : palette.border,
                        },
                      ]}
                    >
                      {/* Day Name */}
                      <View style={styles.scheduleDayBox}>
                        <View
                          style={[
                            styles.scheduleDayDot,
                            { backgroundColor: sch.isToday ? palette.accent : palette.textMuted },
                          ]}
                        />
                        <Text
                          style={[
                            styles.scheduleDayName,
                            {
                              color: sch.isToday ? palette.accent : palette.text,
                              fontWeight: sch.isToday ? '800' : '700',
                            },
                          ]}
                        >
                          {sch.dayName}
                        </Text>
                      </View>

                      {/* Time */}
                      <View style={styles.scheduleTimeBox}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={sch.isToday ? palette.accent : palette.textSecondary}
                        />
                        <Text
                          style={[
                            styles.scheduleTimeText,
                            {
                              color: sch.isToday ? palette.accent : palette.textSecondary,
                              fontWeight: sch.isToday ? '800' : '600',
                            },
                          ]}
                        >
                          {sch.timeRange}
                        </Text>
                      </View>

                      {/* Today Badge */}
                      {sch.isToday && (
                        <View style={[styles.todayMiniBadge, { backgroundColor: palette.accent }]}>
                          <Text style={styles.todayMiniText}>BUGÜN</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          );
        })
      )}
      </ScrollView>
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
    padding: 20,
  },
  studentSelector: {
    marginBottom: 16,
  },
  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  studentChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  courseCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  courseSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleSection: {
    marginTop: 2,
  },
  scheduleSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  scheduleList: {
    gap: 6,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  scheduleDayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
  },
  scheduleDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scheduleDayName: {
    fontSize: 13,
  },
  scheduleTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  scheduleTimeText: {
    fontSize: 12,
  },
  todayMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayMiniText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
