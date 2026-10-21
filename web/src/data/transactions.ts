export type Status = 'conciliado' | 'discrepancia' | 'pendiente'

export interface Transaction {
  id: string
  folio: string
  referenciaBancaria: string
  concepto: string
  servicio: 'predial' | 'agua' | 'multas'
  fecha: string
  montoSistema: number
  montoBanco: number
  estado: Status
  ciudadano: string
  metodoPago: string
  banco: string
}

export const transactions: Transaction[] = [
  {
    id: '1',
    folio: 'OP-2024-08471',
    referenciaBancaria: 'BBVA-2024-00932',
    concepto: 'Pago de Predial — 3er Bimestre',
    servicio: 'predial',
    fecha: '2024-09-28',
    montoSistema: 4_820.50,
    montoBanco: 4_820.50,
    estado: 'conciliado',
    ciudadano: 'Carlos Ramírez Vega',
    metodoPago: 'Transferencia SPEI',
    banco: 'BBVA México',
  },
  {
    id: '2',
    folio: 'OP-2024-08472',
    referenciaBancaria: 'SANT-2024-11204',
    concepto: 'Pago de Agua — Agosto 2024',
    servicio: 'agua',
    fecha: '2024-09-28',
    montoSistema: 1_250.00,
    montoBanco: 1_175.00,
    estado: 'discrepancia',
    ciudadano: 'María Elena Ávila Torres',
    metodoPago: 'Tarjeta de Débito',
    banco: 'Santander',
  },
  {
    id: '3',
    folio: 'OP-2024-08473',
    referenciaBancaria: 'HSBC-2024-05517',
    concepto: 'Multa por Infracción Vial — Folio V-3829',
    servicio: 'multas',
    fecha: '2024-09-28',
    montoSistema: 2_080.00,
    montoBanco: 2_080.00,
    estado: 'conciliado',
    ciudadano: 'Roberto Fuentes Leal',
    metodoPago: 'Pago en Ventanilla',
    banco: 'HSBC',
  },
  {
    id: '4',
    folio: 'OP-2024-08474',
    referenciaBancaria: '—',
    concepto: 'Pago de Predial — 4to Bimestre',
    servicio: 'predial',
    fecha: '2024-09-28',
    montoSistema: 6_340.00,
    montoBanco: 0,
    estado: 'pendiente',
    ciudadano: 'Ana Sofía Guerrero',
    metodoPago: 'CoDi / QR',
    banco: 'Banamex',
  },
  {
    id: '5',
    folio: 'OP-2024-08475',
    referenciaBancaria: 'BNM-2024-88341',
    concepto: 'Pago de Agua — Septiembre 2024',
    servicio: 'agua',
    fecha: '2024-09-27',
    montoSistema: 890.00,
    montoBanco: 940.00,
    estado: 'discrepancia',
    ciudadano: 'Ernesto Villanueva Cruz',
    metodoPago: 'Transferencia SPEI',
    banco: 'Banamex',
  },
  {
    id: '6',
    folio: 'OP-2024-08476',
    referenciaBancaria: 'BBVA-2024-00944',
    concepto: 'Multa Administrativa — Uso de Suelo',
    servicio: 'multas',
    fecha: '2024-09-27',
    montoSistema: 15_600.00,
    montoBanco: 15_600.00,
    estado: 'conciliado',
    ciudadano: 'Constructora Altamira S.A.',
    metodoPago: 'Transferencia SPEI',
    banco: 'BBVA México',
  },
  {
    id: '7',
    folio: 'OP-2024-08477',
    referenciaBancaria: 'INTR-2024-22901',
    concepto: 'Pago de Predial — 1er Bimestre (rezago)',
    servicio: 'predial',
    fecha: '2024-09-27',
    montoSistema: 3_190.00,
    montoBanco: 3_190.00,
    estado: 'conciliado',
    ciudadano: 'Guadalupe Moreno Ibáñez',
    metodoPago: 'Tarjeta de Crédito',
    banco: 'Inbursa',
  },
  {
    id: '8',
    folio: 'OP-2024-08478',
    referenciaBancaria: '—',
    concepto: 'Pago de Agua — Julio 2024',
    servicio: 'agua',
    fecha: '2024-09-26',
    montoSistema: 420.00,
    montoBanco: 0,
    estado: 'pendiente',
    ciudadano: 'Javier Escobar Ríos',
    metodoPago: 'CoDi / QR',
    banco: 'Scotiabank',
  },
]
