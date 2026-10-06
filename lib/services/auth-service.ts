import { apiClient } from '../api-client';
import { getActiveApiBaseUrl } from '../server-url-storage';
import axios from 'axios';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  citizenId?: string;
}

export interface RegisterParentDto {
  accessCode: string;
  emailOrPhone: string;
  password: string;
  fullName?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    expiration: string;
    claims: string[];
  };
}

export function normalizeContact(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length === 12) {
    digits = digits.substring(2);
  }
  if (digits.length === 10 && digits.startsWith('5')) {
    digits = '0' + digits;
  }
  return digits || trimmed;
}

export async function loginApi(dto: LoginDto): Promise<AuthResponse> {
  const normalizedDto: LoginDto = {
    ...dto,
    email: normalizeContact(dto.email),
  };
  const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', normalizedDto);
  return res.data;
}

export async function registerApi(dto: RegisterDto): Promise<any> {
  const res = await apiClient.post('/api/v1/auth/register', dto);
  return res.data;
}

export async function registerParentApi(dto: RegisterParentDto): Promise<AuthResponse> {
  const normalizedDto: RegisterParentDto = {
    ...dto,
    emailOrPhone: normalizeContact(dto.emailOrPhone),
  };
  const res = await apiClient.post<AuthResponse>('/api/v1/auth/register-parent', normalizedDto);
  return res.data;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  currentPassword?: string;
  newPassword?: string;
}

export async function updateProfileApi(
  payload: UpdateProfilePayload
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const res = await apiClient.put('/api/v1/auth/update-profile', payload);
    const data = res.data?.data || res.data;
    return {
      success: true,
      message: res.data?.message || 'Profil bilgileriniz güncellendi.',
      data,
    };
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      (typeof error?.response?.data === 'string' ? error?.response?.data : error?.message) ||
      'Profil güncellenemedi.';
    return {
      success: false,
      message: msg,
    };
  }
}

export async function deleteAccountApi(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiClient.post('/api/v1/auth/delete-account');
    return {
      success: true,
      message: res.data?.message || (typeof res.data === 'string' ? res.data : 'Hesabınız başarıyla silindi.'),
    };
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      (typeof error?.response?.data === 'string' ? error?.response?.data : error?.message) ||
      'Hesap silme işlemi gerçekleştirilemedi.';
    return {
      success: false,
      message: msg,
    };
  }
}

export async function checkServerPing(url?: string): Promise<{ ok: boolean; message?: string; timeMs?: number }> {
  const start = Date.now();
  try {
    const baseUrl = url || (await getActiveApiBaseUrl());
    const res = await axios.get(`${baseUrl}/api/v1/health`, { timeout: 4000 });
    const elapsed = Date.now() - start;
    return { ok: true, message: `Bağlantı başarılı (${elapsed}ms)`, timeMs: elapsed };
  } catch (error: any) {
    const elapsed = Date.now() - start;
    if (error?.response?.status) {
      return { ok: true, message: `Sunucuya ulaşıldı (${error.response.status}) (${elapsed}ms)`, timeMs: elapsed };
    }
    return { ok: false, message: error?.message || 'Sunucuya ulaşılamadı', timeMs: elapsed };
  }
}
