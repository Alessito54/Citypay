import { isEmail, MIN_PASSWORD } from '@/lib/validation';

export type AuthMode = 'login' | 'register' | 'forgot';
export type AuthErrors = { name?: string; email?: string; password?: string };

export const AUTH_COPY: Record<AuthMode, { title: string; sub: string; cta: string }> = {
  login: { title: '¡Bienvenido!', sub: 'Inicia sesión para continuar', cta: 'Iniciar sesión' },
  register: { title: 'Crear cuenta', sub: 'Regístrate para realizar trámites y reportes', cta: 'Crear mi cuenta' },
  forgot: { title: 'Recuperar acceso', sub: 'Escribe tu correo y te enviaremos instrucciones', cta: 'Enviar instrucciones' },
};

/** Client-side checks so the user learns what is wrong next to the field, before any network call. */
export function validateAuth(mode: AuthMode, name: string, email: string, password: string): AuthErrors {
  const e: AuthErrors = {};
  if (mode === 'register' && name.trim().length < 3) e.name = 'Escribe tu nombre completo.';
  if (!email.trim()) e.email = 'Escribe tu correo electrónico.';
  else if (!isEmail(email)) e.email = 'Revisa el formato del correo (ejemplo: nombre@correo.com).';
  if (mode !== 'forgot') {
    if (!password) e.password = 'Escribe tu contraseña.';
    else if (mode === 'register' && password.length < MIN_PASSWORD) e.password = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  }
  return e;
}
