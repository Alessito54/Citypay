import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { fmtDate, fmtMoney, SERVICE_LABEL } from '@/features/reconciliation/format';
import type { Transaction } from '@/types';

export interface PdfPropertyAval {
  cadastralKey?: string;
  propertyAddress?: string;
  propertyType?: string;
  waterContract?: string;
  vehiclePlate?: string;
  ownerName?: string;
  coordinates?: string;
}

export interface GeneratePdfOptions {
  kind: 'reconciliation' | 'payment';
  transaction: Transaction;
  issuerName?: string;
  propertyAval?: PdfPropertyAval;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildVerificationSeal(tx: Transaction): string {
  const raw = `${tx.folio}|${tx.referenciaBancaria}|${tx.montoSistema.toFixed(2)}|${tx.montoBanco.toFixed(2)}|${tx.estado}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `CP-${tx.folio.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase()}-${hex}`;
}

function buildOfficialHtml({ kind, transaction: tx, issuerName, propertyAval }: GeneratePdfOptions): string {
  const isReconciliation = kind === 'reconciliation';
  const docTitle = isReconciliation
    ? 'DICTAMEN FORMAL DE CONCILIACIÓN DE PAGO'
    : 'COMPROBANTE OFICIAL DE PAGO MUNICIPAL';
  const docSubtitle = isReconciliation
    ? 'Documento oficial de respaldo contable y acreditación bancaria'
    : 'Constancia oficial de liquidación y acreditación en Tesorería Municipal';

  const now = new Date();
  const emissionDate = now.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const emissionTime = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const diff = tx.montoBanco - tx.montoSistema;
  const seal = buildVerificationSeal(tx);
  const serviceName = SERVICE_LABEL[tx.servicio] ?? tx.servicio;

  const propertyRows: { label: string; value: string }[] = [];
  if (propertyAval?.ownerName) propertyRows.push({ label: 'Titular / Contribuyente avalado', value: propertyAval.ownerName });
  if (propertyAval?.cadastralKey) propertyRows.push({ label: 'Clave catastral', value: propertyAval.cadastralKey });
  if (propertyAval?.propertyType) propertyRows.push({ label: 'Tipo / Uso de inmueble', value: propertyAval.propertyType });
  if (propertyAval?.propertyAddress) propertyRows.push({ label: 'Ubicación verificada del predio / servicio', value: propertyAval.propertyAddress });
  if (propertyAval?.coordinates) propertyRows.push({ label: 'Coordenadas de ubicación (GPS)', value: propertyAval.coordinates });
  if (propertyAval?.waterContract) propertyRows.push({ label: 'No. de contrato de agua', value: propertyAval.waterContract });
  if (propertyAval?.vehiclePlate) propertyRows.push({ label: 'Placas del vehículo', value: propertyAval.vehiclePlate });

  const propertySectionHtml =
    propertyRows.length > 0
      ? `
      <div class="section">
        <div class="section-title">II. AVAL DE UBICACIÓN Y DATOS DE LA PROPIEDAD / SERVICIO</div>
        <table>
          ${propertyRows
            .map(
              (r) => `
            <tr>
              <th>${escapeHtml(r.label)}</th>
              <td>${escapeHtml(r.value)}</td>
            </tr>`,
            )
            .join('')}
        </table>
      </div>`
      : '';

  const auditSectionHtml = isReconciliation
    ? `
      <div class="section">
        <div class="section-title">${propertyRows.length > 0 ? 'IV' : 'III'}. DICTAMEN, PÓLIZA Y REGISTRO DE AUDITORÍA</div>
        <table>
          <tr>
            <th>Motivo normativo / Póliza</th>
            <td>${escapeHtml(tx.reconciliationReason || 'Conciliación bancaria verificada contra estado de cuenta')}</td>
          </tr>
          <tr>
            <th>Observaciones de auditoría</th>
            <td>${escapeHtml(tx.reconciliationNotes || 'Movimiento verificado y acreditado conforme a normativa contable municipal.')}</td>
          </tr>
          <tr>
            <th>Servidor público que avala</th>
            <td>${escapeHtml(issuerName || 'Tesorería Municipal · Área de Conciliación Bancaria')}</td>
          </tr>
          <tr>
            <th>Estatus contable final</th>
            <td><strong style="color:#166534;">CONCILIADO / CUADRADO</strong></td>
          </tr>
        </table>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(docTitle)} - ${escapeHtml(tx.folio)}</title>
  <style>
    @page { size: letter; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.45;
      background: #FFFFFF;
    }
    .top-bar {
      background: #12296B;
      color: #FFFFFF;
      padding: 18px 22px;
      border-bottom: 5px solid #2F5FC4;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: 1px; }
    .brand span { color: #93C5FD; }
    .org { font-size: 10.5px; letter-spacing: 0.6px; text-transform: uppercase; opacity: 0.9; margin-top: 3px; }
    .folio-box {
      text-align: right;
      border: 1px solid rgba(255,255,255,0.35);
      padding: 8px 12px;
      background: rgba(255,255,255,0.08);
    }
    .folio-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.85; }
    .folio-value { font-family: "Courier New", monospace; font-size: 14px; font-weight: 700; margin-top: 2px; }
    .title-strip {
      background: #EEF4FF;
      border: 1px solid #D0DDF5;
      border-left: 5px solid #1B3FA0;
      padding: 12px 16px;
      margin: 16px 0 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .doc-title { font-size: 15px; font-weight: 800; color: #12296B; margin: 0; }
    .doc-sub { font-size: 11px; color: #475569; margin: 3px 0 0; }
    .status-pill {
      background: #ECFDF3;
      color: #166534;
      border: 1.5px solid #86EFAC;
      padding: 5px 11px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #475569;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #E2E8F0;
    }
    .section { margin-bottom: 14px; }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #1B3FA0;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 2px solid #D0DDF5;
    }
    table { width: 100%; border-collapse: collapse; border: 1px solid #CBD5E1; }
    th, td {
      padding: 8px 10px;
      border-bottom: 1px solid #E2E8F0;
      text-align: left;
      vertical-align: top;
    }
    tr:last-child th, tr:last-child td { border-bottom: none; }
    th {
      width: 36%;
      background: #F8FAFC;
      color: #334155;
      font-weight: 700;
      font-size: 11px;
    }
    td { color: #0F172A; font-size: 11.5px; }
    .mono { font-family: "Courier New", monospace; font-weight: 700; }
    .amount-grid {
      display: flex;
      gap: 10px;
      margin-top: 8px;
    }
    .amount-card {
      flex: 1;
      border: 1px solid #CBD5E1;
      background: #F8FAFC;
      padding: 10px 12px;
    }
    .amount-card.highlight {
      border-color: #1B3FA0;
      background: #EEF4FF;
    }
    .amount-label { font-size: 10px; text-transform: uppercase; color: #475569; font-weight: 700; }
    .amount-value { font-family: "Courier New", monospace; font-size: 16px; font-weight: 800; color: #12296B; margin-top: 3px; }
    .signatures {
      display: flex;
      justify-content: space-between;
      gap: 28px;
      margin-top: 28px;
      padding-top: 10px;
    }
    .sig-box { flex: 1; text-align: center; }
    .sig-line { border-top: 1.5px solid #334155; margin: 36px 12px 6px; }
    .sig-name { font-weight: 700; font-size: 11px; color: #0F172A; }
    .sig-role { font-size: 10px; color: #475569; }
    .seal-box {
      margin-top: 18px;
      padding: 10px 12px;
      background: #F8FAFC;
      border: 1px dashed #94A3B8;
      font-size: 10px;
      color: #475569;
    }
    .seal-code { font-family: "Courier New", monospace; font-weight: 700; color: #12296B; font-size: 11px; }
  </style>
</head>
<body>
  <div class="top-bar">
    <div>
      <div class="brand">CITY<span>PAY</span> · TESORERÍA MUNICIPAL</div>
      <div class="org">Dirección de Ingresos, Recaudación y Conciliación Bancaria</div>
    </div>
    <div class="folio-box">
      <div class="folio-label">Folio de Operación</div>
      <div class="folio-value">${escapeHtml(tx.folio)}</div>
    </div>
  </div>

  <div class="title-strip">
    <div>
      <h1 class="doc-title">${escapeHtml(docTitle)}</h1>
      <p class="doc-sub">${escapeHtml(docSubtitle)}</p>
    </div>
    <div class="status-pill">${isReconciliation ? '✓ CONCILIADO' : '✓ PAGADO'}</div>
  </div>

  <div class="meta-row">
    <div><strong>Fecha de emisión:</strong> ${escapeHtml(emissionDate)} · ${escapeHtml(emissionTime)}</div>
    <div><strong>Fecha de movimiento:</strong> ${escapeHtml(fmtDate(tx.fecha))}</div>
  </div>

  <div class="section">
    <div class="section-title">I. DATOS GENERALES DE LA OPERACIÓN</div>
    <table>
      <tr><th>Servicio / Rubro municipal</th><td>${escapeHtml(serviceName)}</td></tr>
      <tr><th>Concepto</th><td>${escapeHtml(tx.concepto)}</td></tr>
      <tr><th>Contribuyente / Ciudadano</th><td>${escapeHtml(tx.ciudadano)}</td></tr>
      <tr><th>Folio de operación</th><td class="mono">${escapeHtml(tx.folio)}</td></tr>
    </table>
  </div>

  ${propertySectionHtml}

  <div class="section">
    <div class="section-title">${propertyRows.length > 0 ? 'III' : 'II'}. COTEJO FINANCIERO Y REFERENCIA BANCARIA</div>
    <table>
      <tr><th>Método de pago</th><td>${escapeHtml(tx.metodoPago)}</td></tr>
      <tr><th>Institución bancaria</th><td>${escapeHtml(tx.banco)}</td></tr>
      <tr><th>Referencia bancaria / Clave SPEI</th><td class="mono">${escapeHtml(tx.referenciaBancaria)}</td></tr>
    </table>
    <div class="amount-grid">
      <div class="amount-card">
        <div class="amount-label">Importe en sistema</div>
        <div class="amount-value">${escapeHtml(fmtMoney(tx.montoSistema))} MXN</div>
      </div>
      <div class="amount-card highlight">
        <div class="amount-label">Importe acreditado en banco</div>
        <div class="amount-value">${escapeHtml(fmtMoney(tx.montoBanco || tx.montoSistema))} MXN</div>
      </div>
      <div class="amount-card">
        <div class="amount-label">Variación neta</div>
        <div class="amount-value">${escapeHtml(fmtMoney(isReconciliation ? diff : 0))} MXN</div>
      </div>
    </div>
  </div>

  ${auditSectionHtml}

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-name">${escapeHtml(isReconciliation ? issuerName || 'Titular de Conciliación Bancaria' : tx.ciudadano)}</div>
      <div class="sig-role">${isReconciliation ? 'Responsable de Validación y Dictamen' : 'Contribuyente / Solicitante'}</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-name">Tesorería Municipal · CityPay</div>
      <div class="sig-role">Sello Digital de Acreditación Oficial</div>
    </div>
  </div>

  <div class="seal-box">
    <div><strong>Sello digital de integridad:</strong> <span class="seal-code">${escapeHtml(seal)}</span></div>
    <div style="margin-top:4px;">
      Este documento avala formalmente la realización y registro del movimiento señalado en el Sistema Municipal CityPay.
      Conserve este PDF como comprobante oficial para cualquier aclaración o auditoría administrativa.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Genera y comparte/descarga un documento PDF formal para conciliación bancaria o pago ciudadano.
 * En Expo Go Android, `ExpoSharing.shareAsync` puede rechazar URIs del directorio temporal de `Print`,
 * por lo que en ese caso abre automáticamente la vista nativa de impresión / "Guardar como PDF".
 */
export async function exportFormalPaymentPdf(options: GeneratePdfOptions): Promise<void> {
  const html = buildOfficialHtml(options);

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  try {
    const { uri } = await Print.printToFileAsync({ html });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle:
          options.kind === 'reconciliation'
            ? `Dictamen de Conciliación ${options.transaction.folio}`
            : `Comprobante Oficial ${options.transaction.folio}`,
      });
      return;
    }
  } catch {
    // Fallback al diálogo nativo de impresión / Guardar como PDF (funciona siempre en Expo Go Android/iOS)
  }

  await Print.printAsync({ html });
}
