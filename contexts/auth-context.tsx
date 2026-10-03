import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken, getRefreshToken, getUserData, saveAuthTokens, saveUserData, clearAuth } from '@/lib/auth-storage';
import { loginApi, registerApi, LoginDto, RegisterDto } from '@/lib/services/auth-service';
import { jwtDecode } from 'jwt-decode';

export interface UserSession {
  userId?: string | number;
  email?: string;
  fullName?: string;
  roles?: string[];
  tenantId?: string | number;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<{ success: boolean; message?: string }>;
  register: (dto: RegisterDto) => Promise<{ success: boolean; message?: string }>;
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
      if (decoded.role) {
        if (Array.isArray(decoded.role)) roles.push(...decoded.role);
        else roles.push(decoded.role);
      }
      return {
        userId: decoded.nameid || decoded.sub || storedUser?.userId || '1',
        email: decoded.email || storedUser?.email || '',
        fullName: decoded.name || storedUser?.fullName || storedUser?.name || 'Öğrenci / Kullanıcı',
        roles: roles.length ? roles : ['Student'],
        tenantId: storedUser?.tenantId || 1,
      };
    } catch {
      return storedUser || { email: 'kullanici@kursum.com', fullName: 'Kurs Öğrencisi', roles: ['Student'] };
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
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
