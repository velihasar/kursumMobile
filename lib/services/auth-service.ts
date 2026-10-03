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

export async function loginApi(dto: LoginDto): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', dto);
  return res.data;
}

export async function registerApi(dto: RegisterDto): Promise<any> {
  const res = await apiClient.post('/api/v1/auth/register', dto);
  return res.data;
}

export async function registerParentApi(dto: RegisterParentDto): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/v1/auth/register-parent', dto);
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
