/** Business rules of the manual reconciliation form, kept apart from the UI. */
export const OTHER_REASON = 'Otro motivo (especificar)';

export const REASONS = [
  'Confirmación bancaria recibida por correo',
  'Error tipográfico en referencia del ciudadano',
  'Cargo por comisión bancaria pendiente',
  'Instrucción de tesorería municipal',
  OTHER_REASON,
];

export const MIN_NOTES = 11;

export function reconcileCheck(reason: string, notes: string, confirmed: boolean) {
  const needsNotes = reason === OTHER_REASON;
  const notesOk = !needsNotes || notes.trim().length >= MIN_NOTES;
  const missing = [
    reason === '' && 'elige un motivo',
    !notesOk && `escribe al menos ${MIN_NOTES} caracteres en las notas`,
    !confirmed && 'marca la casilla de confirmación',
  ].filter((m): m is string => !!m);
  return { needsNotes, notesOk, missing, ok: missing.length === 0 };
}
