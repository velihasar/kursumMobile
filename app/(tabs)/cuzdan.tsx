import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  fetchWalletInfo,
  WalletInfo,
  formatTurkishDate,
} from '@/lib/services/wallet-service';
import { fetchParentStudents, ChildStudent } from '@/lib/services/student-service';
import { Ionicons } from '@expo/vector-icons';

export default function CuzdanScreen() {
  const { palette, isDark } = useAppTheme();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<ChildStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(
    user?.studentId ? Number(user?.studentId) : undefined
  );
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'payment' | 'canteen' | 'due'>('all');

  const loadData = async (targetStudentId?: number) => {
    const parentId = user?.parentId;
    const defaultStudentId = user?.studentId;

    const sList = await fetchParentStudents(parentId, defaultStudentId);
    setStudents(sList);

    const activeId =
      targetStudentId !== undefined
        ? targetStudentId
        : selectedStudentId !== undefined
        ? selectedStudentId
        : sList[0]?.id || (defaultStudentId ? Number(defaultStudentId) : undefined);

    if (activeId !== selectedStudentId && activeId !== undefined) {
      setSelectedStudentId(activeId);
    }

    const w = await fetchWalletInfo(activeId);
    setWallet(w);
  };

  useEffect(() => {
    loadData();
  }, [user?.studentId, user?.parentId]);

  const handleSelectStudent = async (sId: number) => {
    setSelectedStudentId(sId);
    setRefreshing(true);
    const w = await fetchWalletInfo(sId);
    setWallet(w);
    setRefreshing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(selectedStudentId);
    setRefreshing(false);
  };

  // Filtered transactions
  const transactions = wallet?.transactions || [];
  const filteredTransactions =
    selectedFilter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === selectedFilter);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
    >
      <Text style={[styles.title, { color: palette.text }]}>Ödemeler & Cüzdan</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        Kantin bakiyesi, kurs aidatları ve hesap hareketleri
      </Text>

      {/* Multiple Children Switcher Tabs */}
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

      {/* Main Balance Card */}
      <Card style={[styles.balanceCard, { backgroundColor: palette.primaryDark }]}>
        <View style={styles.balanceHeader}>
          <View>
            <Text style={styles.balanceLabel}>Kantin & Harçlık Bakiyesi</Text>
            <Text style={styles.balanceAmount}>
              ₺{wallet?.balance !== undefined ? wallet.balance.toFixed(2) : '0.00'}
            </Text>
          </View>
          <View style={styles.balanceIconBadge}>
            <Ionicons name="fast-food-outline" size={28} color="#FFFFFF" />
          </View>
        </View>
      </Card>

      {/* Fee & Dues Summary Card */}
      <Card style={[styles.duesCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.duesHeader}>
          <View>
            <Text style={[styles.duesTitle, { color: palette.text }]}>Kurs Taksit Durumu</Text>
            <Text style={[styles.duesSub, { color: palette.textSecondary }]}>
              Kalan Toplam Borç:{' '}
              <Text style={{ fontWeight: '800', color: (wallet?.totalDebt || 0) > 0 ? palette.danger : palette.success }}>
                ₺{(wallet?.totalDebt || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Text>
          </View>
          <Badge
            label={(wallet?.totalDebt || 0) > 0 ? 'Ödeme Var' : 'Borç Yok'}
            variant={(wallet?.totalDebt || 0) > 0 ? 'warning' : 'success'}
          />
        </View>

        {(wallet?.nextPaymentAmount || 0) > 0 ? (
          <View style={[styles.nextDueBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: palette.border }]}>
            <Ionicons name="calendar" size={22} color={palette.warning} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.nextDueLabel, { color: palette.text }]}>
                Yaklaşan Ödeme: ₺{(wallet?.nextPaymentAmount || 0).toFixed(2)}
              </Text>
              <Text style={[styles.nextDueDate, { color: palette.textSecondary }]}>
                Son Gün: {wallet?.nextPaymentDate ? formatTurkishDate(wallet.nextPaymentDate) : 'Yakında'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.nextDueBox, { backgroundColor: palette.successBg }]}>
            <Ionicons name="checkmark-circle" size={22} color={palette.success} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.nextDueLabel, { color: palette.success }]}>Tüm Ödemeler Tamamlandı</Text>
              <Text style={[styles.nextDueDate, { color: palette.textSecondary }]}>Gecikmiş veya bekleyen taksit bulunmuyor.</Text>
            </View>
          </View>
        )}

        {/* Dues List (if any) */}
        {wallet?.dues && wallet.dues.length > 0 && (
          <View style={styles.dueListContainer}>
            <Text style={[styles.dueListTitle, { color: palette.textSecondary }]}>Taksit Planı</Text>
            {wallet.dues.map((due) => (
              <View key={due.id} style={[styles.dueItemRow, { borderBottomColor: palette.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dueItemName, { color: palette.text }]}>{due.title}</Text>
                  <Text style={[styles.dueItemDate, { color: palette.textMuted }]}>Vade: {due.dueDate}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.dueItemAmount, { color: due.isPaid ? palette.textMuted : palette.text }]}>
                    ₺{due.amount.toFixed(2)}
                  </Text>
                  <Badge
                    label={due.statusText}
                    variant={due.isPaid ? 'success' : due.statusText === 'Kısmi Ödendi' ? 'warning' : 'danger'}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'Tümü' },
          { key: 'payment', label: 'Yüklemeler' },
          { key: 'canteen', label: 'Harcamalar' },
          { key: 'due', label: 'Taksitler' },
        ].map((filter) => {
          const isSelected = selectedFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected ? palette.primary : palette.card,
                  borderColor: isSelected ? palette.primary : palette.border,
                },
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isSelected ? '#FFFFFF' : palette.textSecondary, fontWeight: isSelected ? '700' : '500' },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transactions History */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 12 }]}>
        Hesap Hareketleri ({filteredTransactions.length})
      </Text>

      {filteredTransactions.length === 0 ? (
        <Card style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Ionicons name="receipt-outline" size={40} color={palette.textMuted} />
          <Text style={[styles.emptyTitle, { color: palette.text }]}>İşlem Bulunamadı</Text>
          <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
            Bu kategoriye ait herhangi bir hesap hareketi bulunmamaktadır.
          </Text>
        </Card>
      ) : (
        filteredTransactions.map((t) => {
          const isPositive = t.amount > 0;
          return (
            <Card key={t.id} style={[styles.txCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={styles.txRow}>
                <View
                  style={[
                    styles.txIcon,
                    { backgroundColor: isPositive ? palette.successBg : palette.dangerBg },
                  ]}
                >
                  <Ionicons
                    name={isPositive ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={isPositive ? palette.success : palette.danger}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.txTitle, { color: palette.text }]}>{t.title}</Text>
                  <Text style={[styles.txDate, { color: palette.textMuted }]}>{t.date}</Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    { color: isPositive ? palette.success : palette.text },
                  ]}
                >
                  {isPositive ? `+₺${t.amount.toFixed(2)}` : `₺${t.amount.toFixed(2)}`}
                </Text>
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
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
  balanceCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  balanceIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  duesCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  duesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  duesTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  duesSub: {
    fontSize: 13,
    marginTop: 2,
  },
  nextDueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  nextDueLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  nextDueDate: {
    fontSize: 12,
    marginTop: 2,
  },
  dueListContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  dueListTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dueItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  dueItemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  dueItemDate: {
    fontSize: 11,
    marginTop: 2,
  },
  dueItemAmount: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
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
  txCard: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
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
