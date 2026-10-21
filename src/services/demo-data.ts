/**
 * DEMO DATA — copied from the original mockups (web/src/data/transactions.ts
 * and MobileReports.tsx). These are NOT real payments or reports.
 */
import type { Report, Transaction } from '@/types';

export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: '1', folio: 'OP-2024-08471', referenciaBancaria: 'BBVA-2024-00932', concepto: 'Pago de Predial — 3er Bimestre', servicio: 'predial', fecha: '2024-09-28', montoSistema: 4820.5, montoBanco: 4820.5, estado: 'conciliado', ciudadano: 'Carlos Ramírez Vega', metodoPago: 'Transferencia SPEI', banco: 'BBVA México' },
  { id: '2', folio: 'OP-2024-08472', referenciaBancaria: 'SANT-2024-11204', concepto: 'Pago de Agua — Agosto 2024', servicio: 'agua', fecha: '2024-09-28', montoSistema: 1250, montoBanco: 1175, estado: 'discrepancia', ciudadano: 'María Elena Ávila Torres', metodoPago: 'Tarjeta de Débito', banco: 'Santander' },
  { id: '3', folio: 'OP-2024-08473', referenciaBancaria: 'HSBC-2024-05517', concepto: 'Multa por Infracción Vial — Folio V-3829', servicio: 'multas', fecha: '2024-09-28', montoSistema: 2080, montoBanco: 2080, estado: 'conciliado', ciudadano: 'Roberto Fuentes Leal', metodoPago: 'Pago en Ventanilla', banco: 'HSBC' },
  { id: '4', folio: 'OP-2024-08474', referenciaBancaria: '—', concepto: 'Pago de Predial — 4to Bimestre', servicio: 'predial', fecha: '2024-09-28', montoSistema: 6340, montoBanco: 0, estado: 'pendiente', ciudadano: 'Ana Sofía Guerrero', metodoPago: 'CoDi / QR', banco: 'Banamex' },
  { id: '5', folio: 'OP-2024-08475', referenciaBancaria: 'BNM-2024-88341', concepto: 'Pago de Agua — Septiembre 2024', servicio: 'agua', fecha: '2024-09-27', montoSistema: 890, montoBanco: 940, estado: 'discrepancia', ciudadano: 'Ernesto Villanueva Cruz', metodoPago: 'Transferencia SPEI', banco: 'Banamex' },
  { id: '6', folio: 'OP-2024-08476', referenciaBancaria: 'BBVA-2024-00944', concepto: 'Multa Administrativa — Uso de Suelo', servicio: 'multas', fecha: '2024-09-27', montoSistema: 15600, montoBanco: 15600, estado: 'conciliado', ciudadano: 'Constructora Altamira S.A.', metodoPago: 'Transferencia SPEI', banco: 'BBVA México' },
  { id: '7', folio: 'OP-2024-08477', referenciaBancaria: 'INTR-2024-22901', concepto: 'Pago de Predial — 1er Bimestre (rezago)', servicio: 'predial', fecha: '2024-09-27', montoSistema: 3190, montoBanco: 3190, estado: 'conciliado', ciudadano: 'Guadalupe Moreno Ibáñez', metodoPago: 'Tarjeta de Crédito', banco: 'Inbursa' },
  { id: '8', folio: 'OP-2024-08478', referenciaBancaria: '—', concepto: 'Pago de Agua — Julio 2024', servicio: 'agua', fecha: '2024-09-26', montoSistema: 420, montoBanco: 0, estado: 'pendiente', ciudadano: 'Javier Escobar Ríos', metodoPago: 'CoDi / QR', banco: 'Scotiabank' },
];

export const DEMO_REPORTS: Report[] = [
  { id: 'r1', title: 'Lámpara apagada', address: 'Av. Independencia #4392', date: '12 may 2026', estado: 'Nuevo', categoria: 'Alumbrado público', prioridad: 'Media', icon: '💡' },
  { id: 'r2', title: 'Bache en la calle', address: 'Calle Morelos', date: '11 may 2026', estado: 'En proceso', categoria: 'Vialidad', prioridad: 'Alta', icon: '🚧' },
  { id: 'r3', title: 'Contenedor lleno', address: 'Av. Juárez #128', date: '10 may 2026', estado: 'Asignado', categoria: 'Limpieza y residuos', prioridad: 'Media', icon: '🗑️' },
  { id: 'r4', title: 'Fuga de agua', address: 'Calle Hidalgo #56', date: '09 may 2026', estado: 'En proceso', categoria: 'Agua', prioridad: 'Alta', icon: '💧' },
  { id: 'r5', title: 'Juego dañado', address: 'Parque Central', date: '08 may 2026', estado: 'Resuelto', categoria: 'Parques y jardines', prioridad: 'Baja', icon: '🛝' },
];
