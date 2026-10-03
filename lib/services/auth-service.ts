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

export async function checkServerPing(): Promise<{ ok: boolean; url: string; timeMs: number; message?: string }> {
  const url = await getActiveApiBaseUrl();
  const start = Date.now();
  try {
    const res = await axios.get(`${url}/swagger/index.html`, { timeout: 4000 });
    return { ok: res.status >= 200 && res.status < 400, url, timeMs: Date.now() - start };
  } catch (err: any) {
    try {
      const res2 = await axios.get(`${url}/`, { timeout: 4000 });
      return { ok: res2.status < 500, url, timeMs: Date.now() - start };
    } catch {
      return { ok: false, url, timeMs: Date.now() - start, message: err?.message || 'Bağlantı hatası' };
    }
  }
}
