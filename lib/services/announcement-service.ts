import { apiClient } from '../api-client';

export interface AnnouncementItem {
  id: string | number;
  title: string;
  summary: string;
  content: string;
  date: string;
  author: string;
  tag: string;
  icon?: string;
  imageUrl?: string;
  isImportant?: boolean;
  branchName?: string;
}

export async function fetchAnnouncements(
  tenantId?: string | number,
  branchId?: string | number
): Promise<AnnouncementItem[]> {
  try {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId.toString());
    if (branchId) params.append('branchId', branchId.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get(`/api/Announcements/getall${queryString}`);
    const list = res.data?.data || res.data || [];

    if (Array.isArray(list) && list.length > 0) {
      return list
        .filter((item: any) => item.isPublished !== false && item.isActive !== false)
        .map((item: any) => {
          const rawDate = item.publishDate || item.createdDate || new Date().toISOString();
          const d = new Date(rawDate);
          const dateStr = !isNaN(d.getTime())
            ? d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
            : 'Güncel';

          return {
            id: item.id,
            title: item.title,
            summary: item.summary || item.content?.slice(0, 100) || '',
            content: item.content || '',
            date: dateStr,
            author: item.author || item.tenantName || 'Yönetim',
            tag: item.tag || 'Genel',
            icon: item.icon || 'megaphone-outline',
            imageUrl: item.imageUrl,
            isImportant: item.isImportant === true,
            branchName: item.branchName,
          };
        });
    }
    return [];
  } catch {
    return [];
  }
}
