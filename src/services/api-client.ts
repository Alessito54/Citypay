import { getFirebaseAuth } from '@/config/firebase';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
/** Render's free tier can take ~50 s to wake up; anything longer is treated as offline. */
const TIMEOUT_MS = 60_000;

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
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No se encontró el recurso en el servidor.',
};

async function authHeader(): Promise<Record<string, string>> {
  try {
    const user = getFirebaseAuth().currentUser;
    return user ? { Authorization: `Bearer ${await user.getIdToken()}` } : {};
  } catch {
    return {};
  }
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
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión a internet.', 0, err);
  } finally {
    clearTimeout(timer);
  }

  let json: unknown = null;
  if ((res.headers.get('content-type') || '').includes('application/json')) {
    json = await res.json().catch(() => null);
  }
  if (!res.ok) throw new ApiError(errorMessage(json, res.status), res.status, json);
  return json as T;
}
