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

export interface TransactionItem {
  id: string | number;
  title: string;
  amount: number;
  date: string;
  rawDate?: string;
  type: 'payment' | 'due' | 'canteen';
  status: 'completed' | 'pending';
  receiptNo?: string;
}

export interface WalletInfo {
  balance: number;
  totalDebt: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  dues: FeeDueItem[];
  transactions: TransactionItem[];
}

export function formatTurkishDate(dateStr?: string | null): string {
  if (!dateStr) return 'Ödeme Yok';

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];

  if (months.some((m) => dateStr.includes(m))) {
    return dateStr;
  }

  try {
    const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const year = isoMatch[1];
      const monthIndex = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }

    const dmyMatch = dateStr.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const monthIndex = parseInt(dmyMatch[2], 10) - 1;
      const year = dmyMatch[3];
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }

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
    let txs: TransactionItem[] = [];
    let duesList: FeeDueItem[] = [];

    if (studentId) {
      // 1. Fetch Canteen Wallet & Canteen Transactions
      try {
        const walletRes = await apiClient.get(`/api/StudentWallets/getbystudentid?studentId=${studentId}`);
        const walletData = walletRes.data?.data || walletRes.data;
        if (walletData) {
          balance = walletData.balance || 0;
        }

        const txRes = await apiClient.get(`/api/StudentWallets/transactions/getall?studentId=${studentId}`);
        const txData = txRes.data?.data || txRes.data;
        if (Array.isArray(txData)) {
          txData.forEach((t: any) => {
            const isDeposit = t.transactionType === 1 || t.type === 2 || (t.amount > 0 && !t.isSpend);
            const amountVal = Math.abs(t.amount || 0);
            txs.push({
              id: `wtx-${t.id}`,
              title: t.description || (isDeposit ? 'Kantin Bakiye Yükleme' : 'Kantin Harcaması'),
              amount: isDeposit ? amountVal : -amountVal,
              date: t.transactionDate ? formatTurkishDate(t.transactionDate) : 'Bugün',
              rawDate: t.transactionDate,
              type: isDeposit ? 'payment' : 'canteen',
              status: 'completed',
            });
          });
        }
      } catch {}

      // 2. Fetch Installment Payments (Tahsilatlar)
      try {
        const paymentsRes = await apiClient.get('/api/Payments/getall');
        const allPayments = paymentsRes.data?.data || paymentsRes.data;
        if (Array.isArray(allPayments)) {
          const studentPayments = allPayments.filter((p: any) => String(p.studentId) === String(studentId));
          studentPayments.forEach((p: any) => {
            const amountVal = Math.abs(p.amount || 0);
            txs.push({
              id: `pay-${p.id}`,
              title: p.notes || (p.receiptNo ? `Ödeme Yapıldı (${p.receiptNo})` : 'Kurs Taksit Ödemesi'),
              amount: amountVal,
              date: p.paymentDate ? formatTurkishDate(p.paymentDate) : 'Bugün',
              rawDate: p.paymentDate,
              type: 'payment',
              status: 'completed',
              receiptNo: p.receiptNo,
            });
          });
        }
      } catch {}

      // 3. Fetch FeeDues (Taksitler & Aidat Tahakkukları)
      try {
        const feeRes = await apiClient.get('/api/FeeDues/getall');
        const allDues = feeRes.data?.data || feeRes.data;
        if (Array.isArray(allDues)) {
          const studentDues = allDues.filter((d: any) => String(d.studentId) === String(studentId));
          const unpaidDues = studentDues.filter((d: any) => d.status !== 2 && (d.remainingAmount === undefined || d.remainingAmount > 0));

          if (unpaidDues.length > 0) {
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
            remainingAmount: d.remainingAmount ?? (d.status === 2 ? 0 : d.amount ?? 0),
            dueDate: d.dueDate ? formatTurkishDate(d.dueDate) : 'Belirtilmedi',
            isPaid: d.status === 2 || d.remainingAmount === 0,
            statusText: d.status === 2 ? 'Ödendi' : (d.status === 1 || (d.paidAmount > 0 && d.remainingAmount > 0) ? 'Kısmi Ödendi' : 'Bekliyor'),
          }));

          // Add dues to transaction list as planned dues
          studentDues.forEach((d: any) => {
            txs.push({
              id: `due-${d.id}`,
              title: d.title || `${d.period || 'Dönem'} Taksit Tahakkuku`,
              amount: -(d.amount || 0),
              date: d.dueDate ? formatTurkishDate(d.dueDate) : 'Belirtilmedi',
              rawDate: d.dueDate,
              type: 'due',
              status: d.status === 2 || d.remainingAmount === 0 ? 'completed' : 'pending',
            });
          });
        }
      } catch {}

      // Sort all combined transactions by date (newest first)
      txs.sort((a, b) => {
        const timeA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
        const timeB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
        return timeB - timeA;
      });
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

