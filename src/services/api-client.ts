import { getFirebaseAuth } from '@/config/firebase';

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
/** Render's free tier can take ~75 s to wake up from cold start; retry once if it times out. */
const TIMEOUT_MS = 75_000;

let wakeUpPromise: Promise<void> | null = null;

/** Envía un ping silencioso a /health al iniciar la app para despertar el servidor Render cuanto antes. */
export function warmUpServer(): Promise<void> {
  if (!wakeUpPromise) {
    wakeUpPromise = fetch(`${BASE_URL}/health`, { method: 'GET', headers: { Accept: 'application/json' } })
      .then(() => undefined)
      .catch(() => undefined);
  }
  return wakeUpPromise;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const STATUS_MESSAGE: Record<number, string> = {
  401: 'Sesión expirada o no autorizada. Inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción con tu rol o coordinación actual.',
  404: 'No se encontró el recurso en el servidor.',
};

export async function getAuthToken(): Promise<string | null> {
  try {
    const user = getFirebaseAuth().currentUser;
    return user ? await user.getIdToken() : null;
  } catch {
    return null;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errorMessage(json: unknown, status: number) {
  const msg = (json as { message?: unknown } | null)?.message;
  if (typeof msg === 'string') return msg;
  if (Array.isArray(msg)) return msg.join('. ');
  return STATUS_MESSAGE[status] ?? 'Ocurrió un error en la solicitud.';
}

/** JSON request to the CityPay backend, with the Firebase ID token when there is a session. */
export async function apiClient<T>(
  endpoint: string,
  options: Omit<RequestInit, 'body'> & { body?: unknown; requiresAuth?: boolean } = {},
): Promise<T> {
  const { requiresAuth = true, headers, body, ...rest } = options;
  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const method = (rest.method ?? 'GET').toUpperCase();
  const maxAttempts = method === 'GET' ? 2 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        ...rest,
        signal: controller.signal,
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(requiresAuth ? await authHeader() : {}),
          ...(headers as Record<string, string>),
        },
      });
    } catch (err) {
      clearTimeout(timer);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión a internet.', 0, err);
    } finally {
      clearTimeout(timer);
    }

    if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }

    let json: unknown = null;
    if ((res.headers.get('content-type') || '').includes('application/json')) {
      json = await res.json().catch(() => null);
    }
    if (!res.ok) throw new ApiError(errorMessage(json, res.status), res.status, json);
    return json as T;
  }

  throw new ApiError('No se pudo conectar con el servidor.', 0);
}
