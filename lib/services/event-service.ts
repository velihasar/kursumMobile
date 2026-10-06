import { apiClient } from '../api-client';

export interface EventItem {
  id: string | number;
  title: string;
  description: string;
  date: string;
  dayNumber: string;
  monthName: string;
  time: string;
  location: string;
  category: string;
  categoryVariant: 'accent' | 'primary' | 'success' | 'warning';
  icon: string;
  targetAudience: string;
  capacity?: number;
  isRegistrationRequired?: boolean;
  branchName?: string;
}

const MONTH_NAMES = [
  'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
  'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK',
];

export async function fetchEvents(
  tenantId?: string | number,
  branchId?: string | number
): Promise<EventItem[]> {
  try {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId.toString());
    if (branchId) params.append('branchId', branchId.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get(`/api/Events/getall${queryString}`);
    const list = res.data?.data || res.data || [];

    if (Array.isArray(list) && list.length > 0) {
      return list
        .filter((item: any) => item.isActive !== false)
        .map((item: any) => {
          const startD = new Date(item.startDate);
          const hasValidDate = !isNaN(startD.getTime());

          const dayNumber = hasValidDate ? startD.getDate().toString().padStart(2, '0') : '01';
          const monthName = hasValidDate ? MONTH_NAMES[startD.getMonth()] : 'GÜN';
          const dateStr = hasValidDate
            ? startD.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
            : 'Tarih Belirtilmedi';

          let timeStr = 'Belirtilmedi';
          if (hasValidDate) {
            const startT = startD.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            if (item.endDate) {
              const endD = new Date(item.endDate);
              if (!isNaN(endD.getTime())) {
                const endT = endD.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                timeStr = `${startT} - ${endT}`;
              } else {
                timeStr = startT;
              }
            } else {
              timeStr = startT;
            }
          }

          let categoryVariant: 'accent' | 'primary' | 'success' | 'warning' = 'accent';
          const catLower = (item.category || '').toLowerCase();
          if (catLower.includes('veli') || catLower.includes('toplantı')) {
            categoryVariant = 'primary';
          } else if (catLower.includes('atölye') || catLower.includes('kodlama') || catLower.includes('sanat')) {
            categoryVariant = 'success';
          } else if (catLower.includes('gezi') || catLower.includes('spor')) {
            categoryVariant = 'warning';
          }

          return {
            id: item.id,
            title: item.title,
            description: item.description || 'Etkinlik açıklaması henüz girilmedi.',
            date: dateStr,
            dayNumber,
            monthName,
            time: timeStr,
            location: item.location || 'Merkez Kampüs',
            category: item.category || 'Genel Etkinlik',
            categoryVariant,
            icon: item.icon || 'calendar-outline',
            targetAudience: item.targetAudience || 'Tüm Veliler & Öğrenciler',
            capacity: item.capacity,
            isRegistrationRequired: item.isRegistrationRequired,
            branchName: item.branchName,
          };
        });
    }
    return [];
  } catch {
    return [];
  }
}
