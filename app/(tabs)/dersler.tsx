import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { fetchCourses, fetchBranches, Course, Branch } from '@/lib/services/course-service';
import { Ionicons } from '@expo/vector-icons';

export default function DerslerScreen() {
  const { palette } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const loadData = async () => {
    const [c, b] = await Promise.all([fetchCourses(), fetchBranches()]);
    setCourses(c);
    setBranches(b);
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
      <Text style={[styles.title, { color: palette.text }]}>Dersler & Şubeler</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        Kayıtlı olduğunuz dersler ve haftalık şube programı
      </Text>

      {/* Branches List */}
      <Text style={[styles.sectionTitle, { color: palette.text }]}>Aktif Şubelerim</Text>
      {branches.map((b) => (
        <Card key={b.id} style={styles.branchCard}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.branchName, { color: palette.text }]}>{b.name}</Text>
              <Text style={[styles.courseName, { color: palette.primary }]}>{b.courseName}</Text>
            </View>
            <Badge label={b.classroom || 'Derslik'} variant="info" />
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={palette.textSecondary} />
            <Text style={[styles.detailText, { color: palette.textSecondary }]}>{b.teacherName || 'Eğitmen'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={palette.textSecondary} />
            <Text style={[styles.detailText, { color: palette.textSecondary }]}>{b.schedule || 'Belirlenmedi'}</Text>
          </View>
        </Card>
      ))}

      {/* Courses List */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 20 }]}>Tüm Müfredat Dersleri</Text>
      {courses.map((c) => (
        <Card key={c.id} style={styles.courseCard}>
          <View style={styles.courseRow}>
            <View style={[styles.courseIcon, { backgroundColor: palette.primaryLight }]}>
              <Ionicons name="book" size={20} color={palette.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.courseTitle, { color: palette.text }]}>{c.name}</Text>
              <Text style={[styles.courseCode, { color: palette.textMuted }]}>{c.code || 'KOD-101'} • {c.description || 'Ders Detayı'}</Text>
            </View>
            <Badge label="Kayıtlı" variant="success" />
          </View>
        </Card>
      ))}
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
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  branchCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  branchName: {
    fontSize: 17,
    fontWeight: '700',
  },
  courseName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  detailText: {
    fontSize: 13,
  },
  courseCard: {
    marginBottom: 8,
    padding: 12,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  courseCode: {
    fontSize: 12,
    marginTop: 2,
  },
});
