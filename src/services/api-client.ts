import { getFirebaseAuth } from '@/config/firebase';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit & { requiresAuth?: boolean } = {},
): Promise<T> {
  const { requiresAuth = true, headers: customHeaders, ...restOptions } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (requiresAuth) {
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Auth token retrieval failed or auth not initialized
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...restOptions,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      'No se pudo conectar con el servidor municipal. Verifica tu conexión a internet o el estado del backend.',
      0,
      err,
    );
  }

  let json: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      json = await res.json();
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    let errorMessage = 'Ocurrió un error en la solicitud.';
    if (json && typeof json.message === 'string') {
      errorMessage = json.message;
    } else if (json && Array.isArray(json.message)) {
      errorMessage = json.message.join('. ');
    } else if (res.status === 401) {
      errorMessage = 'Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.';
    } else if (res.status === 403) {
      errorMessage = 'No tienes permisos suficientes para realizar esta acción.';
    } else if (res.status === 404) {
      errorMessage = 'Recurso no encontrado en el servidor.';
    }

    throw new ApiError(errorMessage, res.status, json);
  }

  return json as T;
}
