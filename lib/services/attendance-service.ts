import { apiClient } from '../api-client';
import { formatTurkishDate } from './wallet-service';

export interface AttendanceRecord {
  id: number;
  date: string;
  courseName: string;
  status: 'Geldi' | 'Gelmedi' | 'İzinli' | 'Geç Kaldı';
  note?: string;
  studentId?: number;
  studentName?: string;
}

export async function fetchAttendances(studentId?: string | number): Promise<AttendanceRecord[]> {
  try {
    const url = studentId ? `/api/Attendances/getall?studentId=${studentId}` : '/api/Attendances/getall';
    const res = await apiClient.get(url);
    const list = res.data?.data || res.data || [];
    if (Array.isArray(list) && list.length > 0) {
      return list.map((a: any) => {
        let status: 'Geldi' | 'Gelmedi' | 'İzinli' | 'Geç Kaldı' = 'Geldi';

        if (typeof a.status === 'number') {
          if (a.status === 1) status = 'Geldi';
          else if (a.status === 2) status = 'Gelmedi';
          else if (a.status === 3) status = 'İzinli';
          else if (a.status === 4) status = 'Geç Kaldı';
        } else if (typeof a.isPresent === 'boolean') {
          if (a.isPresent) {
            status = 'Geldi';
          } else {
            const reasonLower = (a.reason || '').toLowerCase();
            if (reasonLower.includes('izin') || reasonLower.includes('rapor')) {
              status = 'İzinli';
            } else if (reasonLower.includes('geç') || reasonLower.includes('gecik')) {
              status = 'Geç Kaldı';
            } else {
              status = 'Gelmedi';
            }
          }
        } else if (typeof a.status === 'string') {
          status = a.status as any;
        }

        const rawDate = a.attendanceDate || a.date || '';
        return {
          id: a.id,
          date: rawDate ? formatTurkishDate(rawDate) : 'Bugün',
          courseName: a.courseName || 'Ders',
          status,
          note: a.reason || a.note || '',
          studentId: a.studentId,
          studentName: a.studentName,
        };
      });
    }
    return [];
  } catch {
    return [];
  }
}
