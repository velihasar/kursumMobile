import { apiClient } from '../api-client';

export interface FeeDueItem {
  id: number;
  title: string;
  period?: string;
  amount: number;
  remainingAmount: number;
  dueDate: string;
  isPaid: boolean;
  statusText: string;
}

export interface WalletInfo {
  balance: number;
  totalDebt: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  dues: FeeDueItem[];
  transactions: {
    id: number;
    title: string;
    amount: number;
    date: string;
    type: 'payment' | 'due' | 'canteen';
    status: 'completed' | 'pending';
  }[];
}

export function formatTurkishDate(dateStr?: string | null): string {
  if (!dateStr) return 'Ödeme Yok';

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];

  // If already contains a Turkish month name, return directly
  if (months.some((m) => dateStr.includes(m))) {
    return dateStr;
  }

  try {
    // 1. Match ISO formats (e.g. 2026-10-31, 2026-10-31T00:00:00, 2026-10-31T00.00)
    const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const year = isoMatch[1];
      const monthIndex = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }

    // 2. Match DD.MM.YYYY or DD/MM/YYYY
    const dmyMatch = dateStr.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const monthIndex = parseInt(dmyMatch[2], 10) - 1;
      const year = dmyMatch[3];
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }

    // 3. Fallback standard Date parsing
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch {}

  return dateStr;
}

export async function fetchWalletInfo(studentId?: string | number): Promise<WalletInfo> {
  try {
    let balance = 0;
    let nextPaymentDate = 'Ödeme Bulunmuyor';
    let nextPaymentAmount = 0;
    let totalDebt = 0;
    let txs: any[] = [];
    let duesList: FeeDueItem[] = [];

    if (studentId) {
      try {
        const walletRes = await apiClient.get(`/api/StudentWallets/getbystudentid?studentId=${studentId}`);
        const walletData = walletRes.data?.data || walletRes.data;
        if (walletData) {
          balance = walletData.balance || 0;
        }

        const txRes = await apiClient.get(`/api/StudentWallets/transactions/getall?studentId=${studentId}`);
        const txData = txRes.data?.data || txRes.data;
        if (Array.isArray(txData)) {
          txs = txData.map((t: any) => {
            const isDeposit = t.transactionType === 1 || t.type === 2 || (t.amount > 0 && !t.isSpend);
            const amountVal = Math.abs(t.amount || 0);
            return {
              id: t.id,
              title: t.description || (isDeposit ? 'Bakiye Yükleme' : 'Kantin Harcaması'),
              amount: isDeposit ? amountVal : -amountVal,
              date: t.transactionDate ? formatTurkishDate(t.transactionDate) : 'Bugün',
              type: isDeposit ? 'payment' : 'canteen',
              status: 'completed',
            };
          });
        }
      } catch {}

      try {
        const feeRes = await apiClient.get('/api/FeeDues/getall');
        const allDues = feeRes.data?.data || feeRes.data;
        if (Array.isArray(allDues)) {
          const studentDues = allDues.filter((d: any) => d.studentId == studentId);
          const unpaidDues = studentDues.filter((d: any) => d.isPaid !== true && (d.remainingAmount === undefined || d.remainingAmount > 0));

          if (unpaidDues.length > 0) {
            // Sort unpaid by dueDate ascending
            unpaidDues.sort((a: any, b: any) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
            const firstUnpaid = unpaidDues[0];
            nextPaymentAmount = firstUnpaid.remainingAmount ?? firstUnpaid.amount ?? 0;
            nextPaymentDate = firstUnpaid.dueDate ? formatTurkishDate(firstUnpaid.dueDate) : 'Yakında';
            totalDebt = unpaidDues.reduce((acc: number, d: any) => acc + (d.remainingAmount ?? d.amount ?? 0), 0);
          }

          duesList = studentDues.map((d: any) => ({
            id: d.id,
            title: d.title || `${d.period || 'Dönem'} Taksiti`,
            period: d.period,
            amount: d.amount || 0,
            remainingAmount: d.remainingAmount ?? (d.isPaid ? 0 : d.amount ?? 0),
            dueDate: d.dueDate ? formatTurkishDate(d.dueDate) : 'Belirtilmedi',
            isPaid: d.isPaid === true || d.remainingAmount === 0,
            statusText: d.isPaid ? 'Ödendi' : (d.remainingAmount < d.amount ? 'Kısmi Ödendi' : 'Bekliyor'),
          }));
        }
      } catch {}
    }

    return {
      balance,
      totalDebt,
      nextPaymentDate,
      nextPaymentAmount,
      dues: duesList,
      transactions: txs,
    };
  } catch {
    return {
      balance: 0,
      totalDebt: 0,
      nextPaymentDate: 'Ödeme Yok',
      nextPaymentAmount: 0,
      dues: [],
      transactions: [],
    };
  }
}
