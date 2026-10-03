import Constants from 'expo-constants';
import { getExpoGoProjectConfig } from 'expo';
import { NativeModules, Platform } from 'react-native';
import { DEFAULT_API_PORT } from '@/constants/config';

function hostFromBundleUrl(): string | null {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
    if (!scriptURL || typeof scriptURL !== 'string') return null;
    let normalized = scriptURL.trim();
    if (normalized.startsWith('exp://') || normalized.startsWith('exps://')) {
      normalized = normalized.replace(/^exps?:\/\//, 'http://');
    }
    if (normalized.startsWith('file://')) return null;
    const parsed = new URL(normalized);
    return parsed.hostname || null;
  } catch {
    const m = String(NativeModules?.SourceCode?.scriptURL ?? '').match(/https?:\/\/([^/:]+)/);
    return m?.[1] ?? null;
  }
}

function resolveDevMachineHost(): string | null {
  const dbg = getExpoGoProjectConfig()?.debuggerHost;
  if (dbg) {
    const h = dbg.split(':')[0]?.trim();
    if (h) return h;
  }

  const fromBundle = hostFromBundleUrl();
  if (fromBundle) return fromBundle;

  const uri = Constants.expoConfig?.hostUri;
  if (uri) {
    const h = uri.split(':')[0]?.trim();
    if (h) return h;
  }

  return null;
}

export function inferDevApiBaseUrl(): string | null {
  if (!__DEV__) return null;

  const port = DEFAULT_API_PORT;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:${port}`;
    }
    return `http://localhost:${port}`;
  }

  const host = resolveDevMachineHost();
  if (!host) return null;

  if (host === 'localhost' || host === '127.0.0.1') {
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${port}`;
    }
    return `http://127.0.0.1:${port}`;
  }
  return `http://${host}:${port}`;
}
