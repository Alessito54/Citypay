/**
 * Reglas de validación para el proceso riguroso de conciliación bancaria.
 * Exige cotejo de clave de rastreo, monto real en estado de cuenta, póliza de respaldo,
 * justificación detallada, triple verificación y confirmación por folio.
 */
export const OTHER_REASON = 'Otro ajuste autorizado por Tesorería (detallar oficio)';

export const REASONS = [
  'Acreditación SPEI diferida verificada en estado de cuenta',
  'Ficha de ventanilla sellada con captura errónea de referencia',
  'Diferencia por comisión bancaria o retención institucional',
  'Aplicación de convenio o bonificación con póliza de Ingresos',
  OTHER_REASON,
];

export const MIN_NOTES = 25;
export const MIN_BANK_REF = 6;
export const MIN_FOLIO_DOC = 5;

export interface ReconcileAuditInput {
  folio: string;
  systemAmount: number;
  bankReference: string;
  verifiedAmountText: string;
  evidenceFolio: string;
  reason: string;
  notes: string;
  checkStatement: boolean;
  checkContributor: boolean;
  checkResponsibility: boolean;
  folioConfirmDigits: string;
}

export function expectedFolioSuffix(folio: string): string {
  const clean = folio.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return clean.slice(-4);
}

export function reconcileCheck(input: ReconcileAuditInput) {
  const refClean = input.bankReference.trim();
  const refOk = refClean !== '—' && refClean.length >= MIN_BANK_REF;

  const parsedAmount = Number(input.verifiedAmountText.replace(/,/g, '').trim());
  const amountOk = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const variance = amountOk ? parsedAmount - input.systemAmount : 0;

  const docOk = input.evidenceFolio.trim().length >= MIN_FOLIO_DOC;
  const reasonOk = input.reason.trim().length > 0;
  const notesOk = input.notes.trim().length >= MIN_NOTES;

  const expectedSuffix = expectedFolioSuffix(input.folio);
  const suffixOk =
    expectedSuffix.length === 0 ||
    input.folioConfirmDigits.trim().toUpperCase() === expectedSuffix;

  const allChecksOk =
    input.checkStatement && input.checkContributor && input.checkResponsibility;

  const missing = [
    !refOk && `captura la clave de rastreo/referencia bancaria (mín. ${MIN_BANK_REF} caracteres)`,
    !amountOk && 'ingresa el importe real verificado en el estado de cuenta',
    !docOk && `indica el folio de póliza o corte bancario (mín. ${MIN_FOLIO_DOC} caracteres)`,
    !reasonOk && 'selecciona el motivo contable',
    !notesOk && `redacta la justificación detallada (mín. ${MIN_NOTES} caracteres)`,
    !allChecksOk && 'marca las 3 casillas del protocolo de verificación',
    !suffixOk && `escribe los últimos 4 caracteres del folio (${expectedSuffix}) para autorizar`,
  ].filter((m): m is string => !!m);

  return {
    refOk,
    amountOk,
    parsedAmount: amountOk ? parsedAmount : 0,
    variance,
    docOk,
    reasonOk,
    notesOk,
    allChecksOk,
    expectedSuffix,
    suffixOk,
    missing,
    ok: missing.length === 0,
  };
}
