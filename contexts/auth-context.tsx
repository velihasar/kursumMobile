import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken, getRefreshToken, getUserData, saveAuthTokens, saveUserData, clearAuth } from '@/lib/auth-storage';
import { loginApi, registerApi, registerParentApi, LoginDto, RegisterDto, RegisterParentDto } from '@/lib/services/auth-service';
import { jwtDecode } from 'jwt-decode';

export interface UserSession {
  userId?: string | number;
  email?: string;
  fullName?: string;
  roles?: string[];
  role?: 'Parent' | 'Teacher' | 'Admin' | 'Student';
  tenantId?: string | number;
  studentId?: string | number;
  teacherId?: string | number;
  parentId?: string | number;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<{ success: boolean; message?: string }>;
  register: (dto: RegisterDto) => Promise<{ success: boolean; message?: string }>;
  registerParent: (dto: RegisterParentDto) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  registerParent: async () => ({ success: false }),
  logout: async () => {},
  checkAuth: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const parseTokenUser = (jwt: string, storedUser?: any): UserSession => {
    try {
      const decoded: any = jwtDecode(jwt);
      const roles: string[] = [];

      // Extract roles from standard or custom claims
      const rawRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || decoded.roles;
      if (rawRole) {
        if (Array.isArray(rawRole)) roles.push(...rawRole);
        else roles.push(rawRole);
      }

      const claimsList: string[] = storedUser?.claims || decoded.claims || [];
      claimsList.forEach((c: string) => {
        if (!roles.includes(c)) roles.push(c);
      });

      // Extract TenantId, StudentId, TeacherId, ParentId from claims
      let tenantId = storedUser?.tenantId;
      let studentId = storedUser?.studentId;
      let teacherId = storedUser?.teacherId;
      let parentId = storedUser?.parentId;

      roles.forEach((r) => {
        if (typeof r === 'string') {
          if (r.startsWith('TenantId:')) tenantId = r.split(':')[1];
          if (r.startsWith('StudentId:')) studentId = r.split(':')[1];
          if (r.startsWith('TeacherId:')) teacherId = r.split(':')[1];
          if (r.startsWith('ParentId:')) parentId = r.split(':')[1];
        }
      });

      // Primary role detection
      let primaryRole: 'Parent' | 'Teacher' | 'Admin' | 'Student' = 'Student';
      if (roles.some((r) => r.toLowerCase().includes('parent') || r.toLowerCase().includes('veli'))) {
        primaryRole = 'Parent';
      } else if (roles.some((r) => r.toLowerCase().includes('teacher') || r.toLowerCase().includes('ogretmen'))) {
        primaryRole = 'Teacher';
      } else if (roles.some((r) => r.toLowerCase().includes('admin') || r.toLowerCase().includes('yonetici'))) {
        primaryRole = 'Admin';
      }

      return {
        userId: decoded.nameid || decoded.sub || storedUser?.userId || '1',
        email: decoded.email || storedUser?.email || '',
        fullName: decoded.name || storedUser?.fullName || storedUser?.name || 'Kullanıcı',
        roles: roles.length ? roles : [primaryRole],
        role: primaryRole,
        tenantId: tenantId || 1,
        studentId,
        teacherId,
        parentId,
      };
    } catch {
      return storedUser || { email: 'veli@kursum.com', fullName: 'Kurs Velisi', roles: ['Parent'], role: 'Parent' };
    }
  };

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const storedToken = await getAccessToken();
      const storedUser = await getUserData();

      if (storedToken) {
        setToken(storedToken);
        const parsed = parseTokenUser(storedToken, storedUser);
        setUser(parsed);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (dto: LoginDto) => {
    try {
      const res = await loginApi(dto);
      if (res.success && res.data?.token) {
        const { token: jwt, refreshToken, claims } = res.data;
        await saveAuthTokens(jwt, refreshToken);

        const decodedUser = parseTokenUser(jwt, { email: dto.email, claims });
        await saveUserData(decodedUser);

        setToken(jwt);
        setUser(decodedUser);
        return { success: true };
      }
      return { success: false, message: res.message || 'Giriş başarısız' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Sunucuya bağlanılamadı';
      return { success: false, message: typeof msg === 'string' ? msg : 'Giriş yapılamadı' };
    }
  };

  const register = async (dto: RegisterDto) => {
    try {
      const res = await registerApi(dto);
      if (res.success) {
        return { success: true };
      }
      return { success: false, message: res.message || 'Kayıt başarısız' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Kayıt yapılamadı';
      return { success: false, message: msg };
    }
  };

  const registerParent = async (dto: RegisterParentDto) => {
    try {
      const res = await registerParentApi(dto);
      if (res.success && res.data?.token) {
        const { token: jwt, refreshToken, claims } = res.data;
        await saveAuthTokens(jwt, refreshToken);

        const decodedUser = parseTokenUser(jwt, { email: dto.emailOrPhone, claims });
        await saveUserData(decodedUser);

        setToken(jwt);
        setUser(decodedUser);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Aktivasyon başarısız oldu.' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Kayıt yapılamadı';
      return { success: false, message: typeof msg === 'string' ? msg : 'Kayıt yapılamadı' };
    }
  };

  const logout = async () => {
    await clearAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        registerParent,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
