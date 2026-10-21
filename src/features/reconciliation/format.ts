export const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export const fmtDate = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const SERVICE_LABEL = { predial: 'Predial', agua: 'Agua', multas: 'Multas' } as const;
export const SERVICE_ICON = { predial: '🏠', agua: '💧', multas: '⚠️' } as const;
