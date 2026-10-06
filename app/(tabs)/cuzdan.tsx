import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Family totals if multiple students
  const familyTotalBalance = students.reduce((acc, s) => acc + (s.paymentInfo?.balance || 0), 0);
  const familyTotalDebt = students.reduce((acc, s) => acc + (s.paymentInfo?.totalDebt || 0), 0);

  // Filtered transactions
  const transactions = wallet?.transactions || [];
  const filteredTransactions =
    selectedFilter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === selectedFilter);

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
        <Text style={[styles.title, { color: palette.text }]}>Ödemeler & Cüzdan</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          Kantin bakiyesi, kurs aidatları ve taksit planı
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        {/* Family / Overall Summary Card (if multiple students) */}
      {students.length > 1 && (
        <Card style={[styles.familySummaryCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.familyHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.familyIconBadge, { backgroundColor: palette.primaryLight }]}>
                <Ionicons name="people" size={18} color={palette.primary} />
              </View>
              <Text style={[styles.familyTitle, { color: palette.text }]}>
                Aile Genel Finans Özeti ({students.length} Öğrenci)
              </Text>
            </View>
          </View>

          <View style={[styles.familyDivider, { backgroundColor: palette.border }]} />

          <View style={styles.familyStatsRow}>
            <View style={styles.familyStatItem}>
              <Text style={[styles.familyStatLabel, { color: palette.textSecondary }]}>Toplam Kantin Bakiyesi</Text>
              <Text style={[styles.familyStatValue, { color: palette.success }]}>
                ₺{familyTotalBalance.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.familyVerticalDivider, { backgroundColor: palette.border }]} />

            <View style={styles.familyStatItem}>
              <Text style={[styles.familyStatLabel, { color: palette.textSecondary }]}>Toplam Kalan Borç</Text>
              <Text style={[styles.familyStatValue, { color: familyTotalDebt > 0 ? palette.accent : palette.text }]}>
                ₺{familyTotalDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Multiple Students Selection Cards */}
      {students.length > 1 && (
        <>
          <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 4, marginBottom: 10 }]}>
            Öğrencilerim & Cüzdanları
          </Text>

          <View style={styles.studentCardsList}>
            {students.map((st) => {
              const isSelected = st.id === selectedStudentId;
              const pInfo = st.paymentInfo;
              const hasDebt = pInfo && (pInfo.nextPaymentAmount > 0 || pInfo.totalDebt > 0);

              return (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.studentWalletCard,
                    {
                      backgroundColor: palette.card,
                      borderColor: isSelected ? palette.primary : palette.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleSelectStudent(st.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.studentCardTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={[
                          styles.studentAvatarBox,
                          {
                            backgroundColor: isSelected ? palette.primaryLight : (isDark ? '#0F172A' : '#F1F5F9'),
                          },
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={18}
                          color={isSelected ? palette.primary : palette.textSecondary}
                        />
                      </View>
                      <View>
                        <Text style={[styles.studentCardName, { color: palette.text }]}>{st.fullName}</Text>
                        <Text style={[styles.studentCardSub, { color: palette.textSecondary }]}>
                          Kantin: <Text style={{ color: palette.success, fontWeight: '700' }}>₺{pInfo?.balance?.toFixed(2) || '0.00'}</Text>
                        </Text>
                      </View>
                    </View>

                    {isSelected ? (
                      <View style={[styles.selectedPill, { backgroundColor: palette.primary }]}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        <Text style={styles.selectedPillText}>Seçili</Text>
                      </View>
                    ) : (
                      <Badge
                        label={hasDebt ? 'Taksit Var' : 'Ödendi'}
                        variant={hasDebt ? 'accent' : 'success'}
                      />
                    )}
                  </View>

                  {/* Installment Line inside student card */}
                  <View
                    style={[
                      styles.studentCardBottom,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    {hasDebt ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.studentDueLabel, { color: palette.textSecondary }]}>
                          Sonraki: <Text style={{ color: palette.accent, fontWeight: '700' }}>₺{pInfo.nextPaymentAmount.toFixed(2)}</Text>
                        </Text>
                        <Text style={[styles.studentDueDate, { color: palette.textMuted }]}>
                          {pInfo.nextPaymentDate}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.studentNoDueText, { color: palette.success }]}>
                        ✓ Tüm taksitler ödendi • Borç bulunmuyor
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Selected Student Balance Card (if single student or detailed for selected) */}
      <Card style={[styles.balanceCard, { backgroundColor: isDark ? '#0F2D4A' : '#1A7AD4' }]}>
        <View style={styles.balanceHeader}>
          <View>
            <Text style={styles.balanceLabel}>
              {selectedStudent ? `${selectedStudent.fullName} • Kantin Bakiyesi` : 'Kantin & Harçlık Bakiyesi'}
            </Text>
            <Text style={styles.balanceAmount}>
              ₺{wallet?.balance !== undefined ? wallet.balance.toFixed(2) : '0.00'}
            </Text>
          </View>
          <View style={styles.balanceIconBadge}>
            <Ionicons name="fast-food-outline" size={26} color="#FFFFFF" />
          </View>
        </View>
      </Card>

      {/* Fee & Dues Summary Card for Selected Student */}
      <Card style={[styles.duesCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.duesHeader}>
          <View>
            <Text style={[styles.duesTitle, { color: palette.text }]}>
              {selectedStudent ? `${selectedStudent.fullName} • Taksit Durumu` : 'Kurs Taksit Durumu'}
            </Text>
            <Text style={[styles.duesSub, { color: palette.textSecondary }]}>
              Kalan Toplam Borç:{' '}
              <Text style={{ fontWeight: '800', color: (wallet?.totalDebt || 0) > 0 ? palette.accent : palette.success }}>
                ₺{(wallet?.totalDebt || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Text>
          </View>
          <Badge
            label={(wallet?.totalDebt || 0) > 0 ? 'Ödeme Var' : 'Borç Yok'}
            variant={(wallet?.totalDebt || 0) > 0 ? 'accent' : 'success'}
          />
        </View>

        {(wallet?.nextPaymentAmount || 0) > 0 ? (
          <View
            style={[
              styles.nextDueBox,
              {
                backgroundColor: isDark ? '#2B1904' : '#FFF8F0',
                borderColor: palette.accent,
              },
            ]}
          >
            <Ionicons name="calendar" size={22} color={palette.accent} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.nextDueLabel, { color: palette.accent }]}>
                Yaklaşan Ödeme: ₺{(wallet?.nextPaymentAmount || 0).toFixed(2)}
              </Text>
              <Text style={[styles.nextDueDate, { color: palette.textSecondary }]}>
                Son Gün: {wallet?.nextPaymentDate ? formatTurkishDate(wallet.nextPaymentDate) : 'Yakında'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.nextDueBox, { backgroundColor: palette.successBg, borderColor: palette.success }]}>
            <Ionicons name="checkmark-circle" size={22} color={palette.success} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.nextDueLabel, { color: palette.success }]}>Tüm Ödemeler Tamamlandı</Text>
              <Text style={[styles.nextDueDate, { color: palette.textSecondary }]}>Gecikmiş veya bekleyen taksit bulunmuyor.</Text>
            </View>
          </View>
        )}

        {/* Dues List */}
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
                    variant={due.isPaid ? 'success' : due.statusText === 'Kısmi Ödendi' ? 'warning' : 'accent'}
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
          { key: 'payment', label: 'Ödeme & Yükleme' },
          { key: 'canteen', label: 'Kantin' },
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
          <Ionicons name="receipt-outline" size={36} color={palette.textMuted} />
          <Text style={[styles.emptyTitle, { color: palette.text }]}>İşlem Bulunamadı</Text>
          <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
            Bu kategoriye ait herhangi bir hesap hareketi bulunmamaktadır.
          </Text>
        </Card>
      ) : (
        filteredTransactions.map((t) => {
          const isPayment = t.type === 'payment';
          const isCanteen = t.type === 'canteen';
          const isDue = t.type === 'due';
          const isPositive = t.amount > 0;
          const absAmount = Math.abs(t.amount);

          return (
            <Card key={t.id} style={[styles.txCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={styles.txRow}>
                <View
                  style={[
                    styles.txIcon,
                    {
                      backgroundColor: isPayment
                        ? palette.successBg
                        : isCanteen
                        ? (isDark ? '#2D1B0B' : '#FFF4E6')
                        : palette.primaryLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      isPayment
                        ? 'arrow-down'
                        : isCanteen
                        ? 'fast-food'
                        : 'calendar'
                    }
                    size={18}
                    color={
                      isPayment
                        ? palette.success
                        : isCanteen
                        ? palette.accent
                        : palette.primary
                    }
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.txTitle, { color: palette.text }]}>{t.title}</Text>
                  <Text style={[styles.txDate, { color: palette.textMuted }]}>{t.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.txAmount,
                      {
                        color: isPayment
                          ? palette.success
                          : isCanteen
                          ? palette.accent
                          : palette.text,
                      },
                    ]}
                  >
                    {isPayment
                      ? `+₺${absAmount.toFixed(2)}`
                      : isCanteen
                      ? `-₺${absAmount.toFixed(2)}`
                      : `₺${absAmount.toFixed(2)}`}
                  </Text>
                  {isDue && (
                    <Badge
                      label={t.status === 'completed' ? 'Ödendi' : 'Planlandı'}
                      variant={t.status === 'completed' ? 'success' : 'accent'}
                    />
                  )}
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
  familySummaryCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  familyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  familyIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  familyDivider: {
    height: 1,
    marginVertical: 12,
  },
  familyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  familyStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  familyVerticalDivider: {
    width: 1,
    height: 34,
  },
  familyStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  familyStatValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  studentCardsList: {
    gap: 10,
    marginBottom: 16,
  },
  studentWalletCard: {
    padding: 14,
    borderRadius: 16,
  },
  studentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentCardName: {
    fontSize: 15,
    fontWeight: '800',
  },
  studentCardSub: {
    fontSize: 12,
    marginTop: 1,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  selectedPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  studentCardBottom: {
    padding: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  studentDueLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  studentDueDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  studentNoDueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  balanceCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  balanceIconBadge: {
    width: 44,
    height: 44,
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
    fontSize: 15,
    fontWeight: '800',
  },
  duesSub: {
    fontSize: 12,
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
    fontWeight: '800',
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
    fontSize: 11,
    fontWeight: '800',
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
    fontSize: 15,
    fontWeight: '800',
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
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
