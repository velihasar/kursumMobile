import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken, getRefreshToken, getUserData, saveAuthTokens, saveUserData, clearAuth } from '@/lib/auth-storage';
import { loginApi, registerApi, registerParentApi, deleteAccountApi, LoginDto, RegisterDto, RegisterParentDto } from '@/lib/services/auth-service';
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
  deleteAccount: () => Promise<{ success: boolean; message?: string }>;
  updateUserSession: (updates: Partial<UserSession>) => Promise<void>;
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
  deleteAccount: async () => ({ success: false }),
  updateUserSession: async () => { },
  logout: async () => { },
  checkAuth: async () => { },
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

      // Extract full name from various JWT claim keys (.NET Identity claim formats)
      const tokenFullName =
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/name'] ||
        decoded.unique_name ||
        decoded.name ||
        decoded.fullName ||
        decoded.FullName ||
        decoded.given_name;

      const fullName =
        (storedUser?.fullName && storedUser?.fullName !== 'Kullanıcı' ? storedUser.fullName : undefined) ||
        (storedUser?.name && storedUser?.name !== 'Kullanıcı' ? storedUser.name : undefined) ||
        tokenFullName ||
        'Kullanıcı';

      const email =
        storedUser?.email ||
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
        decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/emailaddress'] ||
        decoded.email ||
        '';

      const userId =
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier'] ||
        decoded.nameid ||
        decoded.sub ||
        storedUser?.userId ||
        '1';

      return {
        userId,
        email,
        fullName,
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

  function formatAuthError(msg: any): string {
    if (!msg || typeof msg !== 'string') return 'Kullanıcı adı veya şifre hatalı.';
    const lower = msg.toLowerCase();
    if (
      lower.includes('usernotfound') ||
      lower.includes('user not found') ||
      lower.includes('kullanıcı bulunamadı') ||
      lower.includes('kullanici bulunamadi') ||
      lower.includes('password') ||
      lower.includes('şifre') ||
      lower.includes('sifre') ||
      lower.includes('unauthorized') ||
      lower.includes('invalid') ||
      lower.includes('credentials') ||
      lower.includes('token') ||
      lower.includes('401') ||
      lower.includes('400')
    ) {
      return 'Kullanıcı adı veya şifre hatalı.';
    }
    return msg;
  }

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
      return { success: false, message: formatAuthError(res.message) };
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response?.data : null) ||
        err.message;

      return { success: false, message: formatAuthError(serverMsg) };
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

  const deleteAccount = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await deleteAccountApi();
      if (res.success) {
        await clearAuth();
        setToken(null);
        setUser(null);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Hesap silme işlemi gerçekleştirilemedi.' };
    }
  };

  const updateUserSession = async (updates: Partial<UserSession>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await saveUserData(updated);
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
        deleteAccount,
        updateUserSession,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
