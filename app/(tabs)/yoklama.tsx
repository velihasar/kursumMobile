import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { fetchAttendances, AttendanceRecord } from '@/lib/services/attendance-service';
import { Ionicons } from '@expo/vector-icons';

export default function YoklamaScreen() {
  const { palette } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const loadData = async () => {
    const list = await fetchAttendances();
    setRecords(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Geldi': return 'success';
      case 'Gelmedi': return 'danger';
      case 'İzinli': return 'info';
      case 'Geç Kaldı': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
    >
      <Text style={[styles.title, { color: palette.text }]}>Devamsızlık & Yoklama</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        Ders katılım ve yoklama durumlarınızın anlık takibi
      </Text>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <StatCard title="Gelinen" value="28 Ders" icon="checkmark-circle" color={palette.success} />
        <StatCard title="İzinli" value="2 Ders" icon="information-circle" color={palette.info} />
        <StatCard title="Devamsız" value="1 Ders" icon="close-circle" color={palette.danger} />
      </View>

      {/* Attendance History */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 24 }]}>Son Yoklama Kayıtları</Text>
      {records.map((r) => (
        <Card key={r.id} style={styles.recordCard}>
          <View style={styles.recordRow}>
            <View style={[styles.iconBox, { backgroundColor: palette.borderLight }]}>
              <Ionicons name="calendar-outline" size={20} color={palette.textSecondary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.recordCourse, { color: palette.text }]}>{r.courseName}</Text>
              <Text style={[styles.recordDate, { color: palette.textMuted }]}>{r.date}</Text>
              {r.note && <Text style={[styles.recordNote, { color: palette.textSecondary }]}>{r.note}</Text>}
            </View>
            <Badge label={r.status} variant={getStatusBadgeVariant(r.status)} />
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  recordCard: {
    marginBottom: 10,
    padding: 14,
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
});
