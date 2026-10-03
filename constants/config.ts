const raw = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

export const DEFAULT_API_BASE_URL = raw.replace(/\/+$/, '');
export const DEFAULT_API_PORT = Number(process.env.EXPO_PUBLIC_API_PORT ?? '5000');
export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME ?? 'Kursum Mobile';
export const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION ?? '1.0.0';
