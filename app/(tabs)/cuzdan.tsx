import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAppTheme } from '@/contexts/theme-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchWalletInfo, WalletInfo } from '@/lib/services/wallet-service';
import { Ionicons } from '@expo/vector-icons';

export default function CuzdanScreen() {
  const { palette } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  const loadData = async () => {
    const w = await fetchWalletInfo();
    setWallet(w);
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
      <Text style={[styles.title, { color: palette.text }]}>Ödemeler & Cüzdan</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        Kantin bakiyesi, kurs aidatları ve hesap hareketleri
      </Text>

      {/* Main Balance Card */}
      <Card style={[styles.balanceCard, { backgroundColor: palette.primaryDark }]}>
        <Text style={styles.balanceLabel}>Kantin & Harçlık Bakiyesi</Text>
        <Text style={styles.balanceAmount}>₺{wallet?.balance?.toFixed(2) || '350.00'}</Text>

        <View style={styles.balanceActions}>
          <Button
            title="Bakiye Yükle"
            size="sm"
            style={{ backgroundColor: '#FFFFFF' }}
            textStyle={{ color: palette.primaryDark }}
            onPress={() => {}}
            icon={<Ionicons name="add-circle" size={18} color={palette.primaryDark} />}
          />
        </View>
      </Card>

      {/* Fee & Dues Summary */}
      <Card style={styles.duesCard}>
        <View style={styles.duesHeader}>
          <View>
            <Text style={[styles.duesTitle, { color: palette.text }]}>Kurs Taksit Durumu</Text>
            <Text style={[styles.duesSub, { color: palette.textSecondary }]}>
              Kalan Toplam Borç: <Text style={{ fontWeight: '700', color: palette.danger }}>₺{wallet?.totalDebt || '4,500'}</Text>
            </Text>
          </View>
          <Badge label="Aktif" variant="warning" />
        </View>

        <View style={[styles.nextDueBox, { backgroundColor: palette.borderLight }]}>
          <Ionicons name="alert-circle-outline" size={22} color={palette.warning} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.nextDueLabel, { color: palette.text }]}>Yaklaşan Ödeme: ₺{wallet?.nextPaymentAmount || '1,500'}</Text>
            <Text style={[styles.nextDueDate, { color: palette.textSecondary }]}>Son Gün: {wallet?.nextPaymentDate || '15 Ekim 2026'}</Text>
          </View>
        </View>
      </Card>

      {/* Transactions History */}
      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 16 }]}>Hesap Hareketleri</Text>
      {wallet?.transactions?.map((t) => (
        <Card key={t.id} style={styles.txCard}>
          <View style={styles.txRow}>
            <View
              style={[
                styles.txIcon,
                { backgroundColor: t.amount > 0 ? palette.successBg : palette.dangerBg },
              ]}
            >
              <Ionicons
                name={t.amount > 0 ? 'arrow-down' : 'arrow-up'}
                size={18}
                color={t.amount > 0 ? palette.success : palette.danger}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.txTitle, { color: palette.text }]}>{t.title}</Text>
              <Text style={[styles.txDate, { color: palette.textMuted }]}>{t.date}</Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                { color: t.amount > 0 ? palette.success : palette.text },
              ]}
            >
              {t.amount > 0 ? `+₺${t.amount}` : `₺${t.amount}`}
            </Text>
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
  balanceCard: {
    padding: 22,
    borderRadius: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  balanceActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  duesCard: {
    padding: 16,
    marginBottom: 12,
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
  },
  nextDueLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  nextDueDate: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  txCard: {
    marginBottom: 8,
    padding: 12,
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
});
