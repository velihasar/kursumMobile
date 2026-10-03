import { apiClient } from '../api-client';
import { getActiveApiBaseUrl } from '../server-url-storage';

export interface InstitutionInfo {
  name: string;
  code?: string;
  logoUrl?: string;
}

export async function resolveMediaUrl(path?: string | null): Promise<string | undefined> {
  if (!path || !path.trim()) return undefined;
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const baseUrl = await getActiveApiBaseUrl();
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const fileName = trimmed.split('/').pop() || trimmed;
  return `${cleanBase}/api/Tenants/logo/${fileName}`;
}

export async function fetchInstitutionInfo(tenantId?: string | number): Promise<InstitutionInfo> {
  try {
    let name = 'Kursum';
    let code: string | undefined = undefined;
    let logoUrl: string | undefined = undefined;

    if (tenantId) {
      try {
        const tenantRes = await apiClient.get(`/api/Tenants/getbyid?id=${tenantId}`);
        const tData = tenantRes.data?.data || tenantRes.data;
        if (tData) {
          if (tData.name) name = tData.name;
          if (tData.code) code = tData.code;
          if (tData.logoUrl) logoUrl = tData.logoUrl;
        }
      } catch {}
    }

    if (!code || name === 'Kursum') {
      try {
        const allRes = await apiClient.get('/api/Tenants/getall');
        const list = allRes.data?.data || allRes.data;
        if (Array.isArray(list) && list.length > 0) {
          const first = list[0];
          if (first.name) name = first.name;
          if (first.code) code = first.code;
          if (first.logoUrl) logoUrl = first.logoUrl;
        }
      } catch {}
    }

    if (logoUrl) {
      logoUrl = await resolveMediaUrl(logoUrl);
    }

    return {
      name,
      code,
      logoUrl,
    };
  } catch {
    return {
      name: 'Kursum Eğitim Kurumu',
      code: 'KRS-01',
    };
  }
}
