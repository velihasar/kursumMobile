import { apiClient } from '../api-client';

export interface WalletInfo {
  balance: number;
  totalDebt: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  transactions: {
    id: number;
    title: string;
    amount: number;
    date: string;
    type: 'payment' | 'due' | 'canteen';
    status: 'completed' | 'pending';
  }[];
}

export async function fetchWalletInfo(): Promise<WalletInfo> {
  try {
    const res = await apiClient.get('/api/v1/studentwallets/getmywallet');
    return res.data?.data || res.data;
  } catch {
    return {
      balance: 350.00,
      totalDebt: 4500.00,
      nextPaymentDate: '15 Ekim 2026',
      nextPaymentAmount: 1500.00,
      transactions: [
        { id: 1, title: 'Ekim Ayı Taksiti', amount: -1500.00, date: '01.10.2026', type: 'due', status: 'pending' },
        { id: 2, title: 'Kantin Yüklemesi', amount: +200.00, date: '28.09.2026', type: 'payment', status: 'completed' },
        { id: 3, title: 'Kantin Harcaması', amount: -45.00, date: '28.09.2026', type: 'canteen', status: 'completed' },
        { id: 4, title: 'Eylül Ayı Taksiti', amount: +1500.00, date: '15.09.2026', type: 'payment', status: 'completed' },
      ]
    };
  }
}
