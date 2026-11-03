import { Platform } from 'react-native';

import type { Informe } from '@/types';

/** Quotes a value so Excel and Google Sheets read the column separators right. */
function cell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Spreadsheet text for an informe. Semicolons are the separator because that is
 * what Excel expects in Spanish locales, where the comma is the decimal mark.
 */
export function buildCsv(informe: Informe): string {
  const lines: string[] = [];
  lines.push(cell(informe.title));
  lines.push(cell(informe.subtitle));
  lines.push(cell(`Periodo: ${informe.periodLabel}`));
  lines.push(
    cell(`Generado: ${new Date(informe.generatedAt).toLocaleString('es-MX')}`),
  );
  lines.push('');
  lines.push(informe.columns.map((c) => cell(c.label)).join(';'));
  for (const row of informe.rows) {
    lines.push(informe.columns.map((c) => cell(row[c.key])).join(';'));
  }
  if (informe.totals) {
    lines.push(informe.columns.map((c) => cell(informe.totals?.[c.key])).join(';'));
  }
  return lines.join('\n');
}

export function csvFileName(informe: Informe): string {
  const stamp = new Date(informe.generatedAt).toISOString().slice(0, 10);
  return `citypay-${informe.type}-${informe.groupBy}-${stamp}.csv`;
}

/**
 * Hands the CSV to the browser as a download. On a device there is no file
 * dialog and no sharing module in this project, so the caller shows the text
 * instead — hence the boolean.
 */
export function downloadCsv(informe: Informe): boolean {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return false;
  try {
    // The BOM keeps accents readable when the file is opened in Excel.
    const blob = new Blob([`﻿${buildCsv(informe)}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = csvFileName(informe);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
