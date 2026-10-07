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
import { WalletSkeleton } from '@/components/ui/Skeleton';
import { Ionicons } from '@expo/vector-icons';

export default function CuzdanScreen() {
  const insets = useSafeAreaInsets();
  const { palette, isDark } = useAppTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<ChildStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(
    user?.studentId ? Number(user?.studentId) : undefined
  );
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'payment' | 'canteen' | 'due'>('all');

  const loadData = async (targetStudentId?: number, isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
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
    const w = await fetchWalletInfo(sId);
    setWallet(w);
    setRefreshing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(selectedStudentId, false);
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
        {loading ? (
          <WalletSkeleton />
        ) : (
          <>
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
                    <View style={styles.studentInfoLeft}>
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
                      <View style={styles.studentNameBox}>
                        <Text
                          style={[styles.studentCardName, { color: palette.text }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {st.fullName}
                        </Text>
                        <Text style={[styles.studentCardSub, { color: palette.textSecondary }]}>
                          Kantin: <Text style={{ color: palette.success, fontWeight: '700' }}>₺{pInfo?.balance?.toFixed(2) || '0.00'}</Text>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.studentBadgeGroup}>
                      {isSelected && (
                        <View style={[styles.selectedPill, { backgroundColor: palette.primaryLight }]}>
                          <Ionicons name="checkmark-circle" size={13} color={palette.primary} />
                          <Text style={[styles.selectedPillText, { color: palette.primary }]}>Seçili</Text>
                        </View>
                      )}
                      <Badge
                        label={hasDebt ? 'Taksit Var' : 'Ödendi'}
                        variant={hasDebt ? 'accent' : 'success'}
                      />
                    </View>
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

      {/* Selected Student Balance Card (Digital Bank Card Form) */}
      <View
        style={[
          styles.digitalCard,
          {
            backgroundColor: isDark ? '#172554' : '#1E3A8A',
          },
        ]}
      >
        {/* Card Top Row: Chip icon & Student name + canteen icon */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardChipRow}>
            <View style={styles.simChip}>
              <View style={styles.simChipInner} />
            </View>
            <Text style={styles.cardHolderText} numberOfLines={1}>
              {selectedStudent ? `${selectedStudent.fullName.toLocaleUpperCase('tr-TR')} • KANTİN BAKİYESİ` : 'KANTİN & HARÇLIK BAKİYESİ'}
            </Text>
          </View>

          <View style={styles.cardCanteenBadge}>
            <Ionicons name="fast-food" size={16} color="#FFFFFF" />
          </View>
        </View>

        {/* Card Middle: Available Balance */}
        <View style={styles.cardBalanceSection}>
          <Text style={styles.cardBalanceLabel}>KULLANILABİLİR BAKİYE</Text>
          <Text style={styles.cardBalanceAmount}>
            ₺{wallet?.balance !== undefined ? wallet.balance.toFixed(2) : '0.00'}
          </Text>
        </View>
      </View>

      {/* Fee & Dues Summary Card for Selected Student */}
      <Card style={[styles.duesCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.duesHeader}>
          <View style={styles.duesHeaderLeft}>
            <Text
              style={[styles.duesTitle, { color: palette.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedStudent ? `${selectedStudent.fullName} • Taksit Durumu` : 'Kurs Taksit Durumu'}
            </Text>
            <Text style={[styles.duesSub, { color: palette.textSecondary }]}>
              Kalan Toplam Borç:{' '}
              <Text style={{ fontWeight: '800', color: (wallet?.totalDebt || 0) > 0 ? palette.accent : palette.success }}>
                ₺{(wallet?.totalDebt || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Text>
          </View>
          <View style={styles.duesBadgeWrap}>
            <Badge
              label={(wallet?.totalDebt || 0) > 0 ? 'Taksit Var' : 'Borç Yok'}
              variant={(wallet?.totalDebt || 0) > 0 ? 'accent' : 'success'}
            />
          </View>
        </View>

        {(wallet?.nextPaymentAmount || 0) > 0 ? (
          <View
            style={[
              styles.nextDueBox,
              {
                backgroundColor: isDark ? '#2D1B0B' : '#FFF7ED',
                borderColor: isDark ? '#451A03' : '#FFEDD5',
              },
            ]}
          >
            <View style={[styles.dueStatusIconBox, { backgroundColor: isDark ? '#3D2406' : '#FFEDD5' }]}>
              <Ionicons name="calendar" size={20} color={palette.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.nextDueLabel, { color: palette.accent }]}>
                Yaklaşan Ödeme: ₺{(wallet?.nextPaymentAmount || 0).toFixed(2)}
              </Text>
              <Text style={[styles.nextDueDate, { color: palette.textSecondary }]}>
                Son Gün: {wallet?.nextPaymentDate ? formatTurkishDate(wallet.nextPaymentDate) : 'Yakında'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.nextDueBox, { backgroundColor: palette.successBg, borderColor: isDark ? '#065F46' : '#D1FAE5' }]}>
            <View style={[styles.dueStatusIconBox, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={20} color={palette.success} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.nextDueLabel, { color: palette.success }]}>Tüm Ödemeler Tamamlandı</Text>
              <Text style={[styles.nextDueDate, { color: palette.textSecondary }]}>Gecikmiş veya bekleyen bir taksitiniz bulunmuyor.</Text>
            </View>
          </View>
        )}

        {/* Dues List */}
        {wallet?.dues && wallet.dues.length > 0 && (
          <View style={styles.dueListContainer}>
            <Text style={[styles.dueListTitle, { color: palette.textSecondary }]}>Taksit Planı</Text>
            {wallet.dues.map((due) => (
              <View key={due.id} style={[styles.dueItemRow, { borderBottomColor: palette.borderLight }]}>
                <View style={styles.dueLeftCol}>
                  <View style={[styles.dueItemIconBox, { backgroundColor: due.isPaid ? palette.successBg : palette.primaryLight }]}>
                    <Ionicons
                      name={due.isPaid ? 'checkmark-circle-outline' : 'calendar-outline'}
                      size={16}
                      color={due.isPaid ? palette.success : palette.primary}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.dueItemName, { color: palette.text }]}>{due.title}</Text>
                    <Text style={[styles.dueItemDate, { color: palette.textMuted }]}>Vade: {due.dueDate}</Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.dueItemAmount, { color: palette.text }]}>
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

      {/* Filter Chips Horizontal Scroll */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
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
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : palette.textSecondary, fontWeight: isSelected ? '700' : '600' },
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Transactions History */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 14 }]}>
        Hesap Hareketleri ({filteredTransactions.length})
      </Text>

      {filteredTransactions.length === 0 ? (
        <Card style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={[styles.emptyTxIconBox, { backgroundColor: palette.primaryLight }]}>
            <Ionicons name="receipt-outline" size={28} color={palette.primary} />
          </View>
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
                        ? (isDark ? '#2D1B0B' : '#FFF7ED')
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
                  <Text style={[styles.txTitle, { color: palette.text }]} numberOfLines={1}>{t.title}</Text>
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
          </>
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
    padding: 18,
  },
  familySummaryCard: {
    padding: 16,
    borderRadius: 20,
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
    borderRadius: 18,
  },
  studentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  studentInfoLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  studentNameBox: {
    flex: 1,
    minWidth: 0,
  },
  studentAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  studentCardName: {
    fontSize: 15,
    fontWeight: '800',
  },
  studentCardSub: {
    fontSize: 12,
    marginTop: 1,
  },
  studentBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  selectedPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  studentCardBottom: {
    padding: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
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

  /* Digital Bank Card Form */
  digitalCard: {
    padding: 20,
    borderRadius: 22,
    marginBottom: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  simChip: {
    width: 26,
    height: 19,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simChipInner: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 2,
  },
  cardHolderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  cardCanteenBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBalanceSection: {
    marginTop: 14,
    marginBottom: 4,
  },
  cardBalanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.8,
  },
  cardBalanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.5,
  },

  /* Fee & Dues Summary */
  duesCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  duesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  duesHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  duesBadgeWrap: {
    flexShrink: 0,
    paddingTop: 2,
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
    borderRadius: 16,
    borderWidth: 1,
  },
  dueStatusIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderTopColor: 'rgba(150, 150, 150, 0.12)',
  },
  dueListTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  dueItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dueLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dueItemIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
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
  },

  /* Transactions */
  txCard: {
    marginBottom: 8,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyTxIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
});

