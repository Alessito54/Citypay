/** Shared input rules, so the login form and the auth service never disagree. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD = 6;

export const isEmail = (v: string) => EMAIL_RE.test(v.trim());
