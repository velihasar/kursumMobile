import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_BASE_URL } from '@/constants/config';
import { inferDevApiBaseUrl } from './infer-api-base-url';

const SERVER_URL_KEY = '@kursum_custom_server_url';

export async function getStoredServerUrl(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SERVER_URL_KEY);
  } catch {
    return null;
  }
}

export async function setStoredServerUrl(url: string): Promise<void> {
  try {
    if (!url.trim()) {
      await AsyncStorage.removeItem(SERVER_URL_KEY);
    } else {
      await AsyncStorage.setItem(SERVER_URL_KEY, url.trim().replace(/\/+$/, ''));
    }
  } catch (err) {
    console.error('Failed to store server URL', err);
  }
}

export async function getActiveApiBaseUrl(): Promise<string> {
  const stored = await getStoredServerUrl();
  if (stored) return stored;

  const inferred = inferDevApiBaseUrl();
  if (inferred) return inferred;

  return DEFAULT_API_BASE_URL;
}
