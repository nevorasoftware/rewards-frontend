import type { AuthResponse, User } from './types';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100').replace(/\/$/, '');

const TOKENS_KEY = 'rw.tokens';
const USER_KEY = 'rw.user';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const session = {
  getTokens(): Tokens | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(TOKENS_KEY);
      return raw ? (JSON.parse(raw) as Tokens) : null;
    } catch {
      return null;
    }
  },
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },
  save(auth: AuthResponse): void {
    localStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken: auth.accessToken, refreshToken: auth.refreshToken }));
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  },
  clear(): void {
    localStorage.removeItem(TOKENS_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  form?: FormData;
  auth?: boolean;
}

let refreshing: Promise<boolean> | null = null;

/** Exchanges the refresh token for a new pair. Concurrent callers share one request. */
async function refreshTokens(): Promise<boolean> {
  const tokens = session.getTokens();
  if (!tokens?.refreshToken) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      if (!res.ok) return false;
      session.save((await res.json()) as AuthResponse);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

export async function api<T>(path: string, options: RequestOptions = {}, retry = true): Promise<T> {
  const { method = 'GET', body, form, auth = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const tokens = auth ? session.getTokens() : null;
  if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0);
  }

  if (res.status === 401 && auth && retry && tokens) {
    if (await refreshTokens()) return api<T>(path, options, false);
    session.clear();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError('Tu sesión expiró', 401);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(errorMessage(data, `Error ${res.status}`), res.status);
  return data as T;
}
