import { apiClient } from '../api-client';

export interface AttendanceRecord {
  id: number;
  date: string;
  courseName: string;
  status: 'Geldi' | 'Gelmedi' | 'İzinli' | 'Geç Kaldı';
  note?: string;
}

export async function fetchAttendances(): Promise<AttendanceRecord[]> {
  try {
    const res = await apiClient.get('/api/v1/attendances/getall');
    return res.data?.data || res.data || [];
  } catch {
    return [
      { id: 1, date: '2026-09-30', courseName: 'Matematik - YKS', status: 'Geldi', note: 'Zamanında katıldı' },
      { id: 2, date: '2026-09-29', courseName: 'Fizik', status: 'Geldi', note: 'Ödev teslim edildi' },
      { id: 3, date: '2026-09-27', courseName: 'Kimya', status: 'İzinli', note: 'Veli izin dilekçesi' },
      { id: 4, date: '2026-09-25', courseName: 'Biyoloji', status: 'Geç Kaldı', note: '10 dk gecikme' },
      { id: 5, date: '2026-09-23', courseName: 'Türkçe', status: 'Geldi' },
    ];
  }
}
