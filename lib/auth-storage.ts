import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'kursum_access_token';
const REFRESH_TOKEN_KEY = 'kursum_refresh_token';
const USER_DATA_KEY = 'kursum_user_data';
const TENANT_ID_KEY = 'kursum_tenant_id';

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(key);
  } else {
    try {
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) return val;
      return await AsyncStorage.getItem(key);
    } catch {
      return await AsyncStorage.getItem(key);
    }
  }
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
    await AsyncStorage.removeItem(key);
  }
}

export async function saveAuthTokens(token: string, refreshToken?: string): Promise<void> {
  await setItem(TOKEN_KEY, token);
  if (refreshToken) {
    await setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function getAccessToken(): Promise<string | null> {
  return await getItem(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return await getItem(REFRESH_TOKEN_KEY);
}

export async function saveUserData(data: any): Promise<void> {
  await setItem(USER_DATA_KEY, JSON.stringify(data));
}

export async function getUserData(): Promise<any | null> {
  const str = await getItem(USER_DATA_KEY);
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export async function saveTenantId(tenantId: string | number): Promise<void> {
  await setItem(TENANT_ID_KEY, String(tenantId));
}

export async function getTenantId(): Promise<string | null> {
  return await getItem(TENANT_ID_KEY);
}

export async function clearAuth(): Promise<void> {
  await removeItem(TOKEN_KEY);
  await removeItem(REFRESH_TOKEN_KEY);
  await removeItem(USER_DATA_KEY);
  await removeItem(TENANT_ID_KEY);
}
