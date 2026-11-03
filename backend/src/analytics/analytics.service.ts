import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DepartmentsService } from '../departments/departments.service';
import type { Department } from '../departments/entities/department.entity';
import { PaymentStatus } from '../payments/entities/payment.entity';
import { DebtStatus } from '../debts/entities/debt.entity';
import { ReportStatus } from '../reports/entities/report.entity';

export type InformeType =
  | 'recaudacion'
  | 'conciliacion'
  | 'cartera'
  | 'desempeno'
  | 'reportes';

export type InformeGroupBy =
  | 'department'
  | 'service'
  | 'method'
  | 'bank'
  | 'status'
  | 'category'
  | 'priority'
  | 'month';

export interface InformeColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'money' | 'percent' | 'days';
}

export interface Informe {
  type: InformeType;
  title: string;
  subtitle: string;
  groupBy: InformeGroupBy;
  periodLabel: string;
  from: string | null;
  to: string | null;
  columns: InformeColumn[];
  rows: Record<string, string | number | null>[];
  totals: Record<string, string | number | null> | null;
  /** Short sentences the screen can show above the table. */
  highlights: { label: string; value: string }[];
  generatedAt: string;
}

const DAY_MS = 86_400_000;

interface PaymentRow {
  serviceSlug: string;
  status: PaymentStatus;
  systemAmount: number;
  bankAmount: number;
  paymentMethod: string;
  bank: string;
  paymentDate: string;
}

const MONEY = (v: number) => Math.round(v * 100) / 100;

const SERVICE_LABELS: Record<string, string> = {
  predial: 'Impuesto Predial',
  agua: 'Agua Potable',
  multas: 'Multas y Infracciones',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  conciliado: 'Conciliado',
  discrepancia: 'Con discrepancia',
  pendiente: 'Pendiente de banco',
};

const DEBT_STATUS_LABELS: Record<string, string> = {
  pending: 'Vigente',
  overdue: 'Vencido',
  paid: 'Pagado',
};

function fmtDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function periodLabel(from: string | null, to: string | null): string {
  if (from && to) return `Del ${fmtDate(from)} al ${fmtDate(to)}`;
  if (from) return `Desde ${fmtDate(from)}`;
  if (to) return `Hasta ${fmtDate(to)}`;
  return 'Histórico completo';
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly departmentsService: DepartmentsService,
  ) {}

  /** Headline numbers for the top of the reports centre. */
  async overview(from: string | null, to: string | null) {
    this.assertRange(from, to);
    const { clause, params } = this.dateClause('payment_date', from, to);

    const [payments] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS count,
              COALESCE(SUM("system_amount"), 0) AS system,
              COALESCE(SUM("bank_amount"), 0)   AS bank,
              COUNT(*) FILTER (WHERE "status" = 'conciliado')::int   AS conciliados,
              COUNT(*) FILTER (WHERE "status" = 'discrepancia')::int AS discrepancias,
              COUNT(*) FILTER (WHERE "status" = 'pendiente')::int    AS pendientes,
              COALESCE(SUM("system_amount") FILTER (WHERE "status" = 'conciliado'), 0) AS recaudado
         FROM "payments" ${clause}`,
      params,
    );

    const [debts] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS count,
              COALESCE(SUM("amount") FILTER (WHERE "status" = 'pending'), 0) AS vigente,
              COALESCE(SUM("amount") FILTER (WHERE "status" = 'overdue'), 0) AS vencido
         FROM "debts"`,
    );

    const reportsClause = this.dateClause('created_at', from, to);
    const [reports] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS count,
              COUNT(*) FILTER (WHERE "status" = 'Resuelto')::int AS resueltos,
              COUNT(*) FILTER (WHERE "status" <> 'Resuelto')::int AS abiertos
         FROM "citizen_reports" ${reportsClause.clause}`,
      reportsClause.params,
    );

    const departments = await this.departmentsService.findAll();
    const totalSistema = Number(payments.system);
    const totalBanco = Number(payments.bank);

    return {
      periodLabel: periodLabel(from, to),
      from,
      to,
      recaudado: MONEY(Number(payments.recaudado)),
      totalSistema: MONEY(totalSistema),
      totalBanco: MONEY(totalBanco),
      descuadre: MONEY(Math.abs(totalSistema - totalBanco)),
      pagosTotal: Number(payments.count),
      pagosConciliados: Number(payments.conciliados),
      pagosDiscrepancia: Number(payments.discrepancias),
      pagosPendientes: Number(payments.pendientes),
      tasaConciliacion:
        Number(payments.count) > 0
          ? Math.round((Number(payments.conciliados) / Number(payments.count)) * 100)
          : 0,
      carteraVigente: MONEY(Number(debts.vigente)),
      carteraVencida: MONEY(Number(debts.vencido)),
      adeudosCount: Number(debts.count),
      reportesTotal: Number(reports.count),
      reportesResueltos: Number(reports.resueltos),
      reportesAbiertos: Number(reports.abiertos),
      departamentosActivos: departments.length,
      generatedAt: new Date().toISOString(),
    };
  }

  async build(
    type: InformeType,
    groupBy: InformeGroupBy | undefined,
    from: string | null,
    to: string | null,
    departmentSlug?: string,
  ): Promise<Informe> {
    this.assertRange(from, to);
    const departments = await this.departmentsService.findAll();
    const scoped = departmentSlug
      ? departments.filter((d) => d.slug === departmentSlug)
      : departments;
    const narrowed = !!departmentSlug;

    switch (type) {
      case 'recaudacion':
        return this.collection(groupBy || 'service', from, to, departments, scoped, narrowed);
      case 'conciliacion':
        return this.reconciliation(groupBy || 'status', from, to, departments, scoped, narrowed);
      case 'cartera':
        return this.delinquency(groupBy || 'service', departments, scoped, narrowed);
      case 'desempeno':
        return this.performance(from, to, scoped);
      case 'reportes':
        return this.reportsVolume(groupBy || 'category', from, to, scoped);
      default:
        throw new BadRequestException(
          'Tipo de informe no reconocido. Usa recaudacion, conciliacion, cartera, desempeno o reportes.',
        );
    }
  }

  /* ------------------------------- informes ------------------------------ */

  private async collection(
    groupBy: InformeGroupBy,
    from: string | null,
    to: string | null,
    departments: Department[],
    scoped: Department[],
    narrowed: boolean,
  ): Promise<Informe> {
    const payments = await this.fetchPayments(from, to);
    const allowedSlugs = this.slugsOf(scoped, narrowed);
    const rows = new Map<
      string,
      { label: string; count: number; system: number; bank: number; conciliados: number }
    >();

    for (const p of payments) {
      if (allowedSlugs && !allowedSlugs.has(p.serviceSlug)) continue;
      const { key, label } = this.bucket(groupBy, p, departments);
      const row =
        rows.get(key) || { label, count: 0, system: 0, bank: 0, conciliados: 0 };
      row.count += 1;
      row.system += p.systemAmount;
      row.bank += p.bankAmount;
      if (p.status === PaymentStatus.CONCILIADO) row.conciliados += 1;
      rows.set(key, row);
    }

    const list = [...rows.values()]
      .map((r) => ({
        concepto: r.label,
        operaciones: r.count,
        montoSistema: MONEY(r.system),
        montoBanco: MONEY(r.bank),
        diferencia: MONEY(r.bank - r.system),
        avance: r.count > 0 ? Math.round((r.conciliados / r.count) * 100) : 0,
      }))
      .sort((a, b) => b.montoSistema - a.montoSistema);

    const totalSystem = list.reduce((a, r) => a + r.montoSistema, 0);
    const totalBank = list.reduce((a, r) => a + r.montoBanco, 0);
    const totalOps = list.reduce((a, r) => a + r.operaciones, 0);

    return {
      type: 'recaudacion',
      title: 'Informe de Recaudación',
      subtitle: `Ingresos registrados por ${this.groupLabel(groupBy)}`,
      groupBy,
      periodLabel: periodLabel(from, to),
      from,
      to,
      columns: [
        { key: 'concepto', label: this.groupLabel(groupBy), type: 'text' },
        { key: 'operaciones', label: 'Operaciones', type: 'number' },
        { key: 'montoSistema', label: 'Monto sistema', type: 'money' },
        { key: 'montoBanco', label: 'Monto banco', type: 'money' },
        { key: 'diferencia', label: 'Diferencia', type: 'money' },
        { key: 'avance', label: 'Conciliado', type: 'percent' },
      ],
      rows: list,
      totals: {
        concepto: 'Total',
        operaciones: totalOps,
        montoSistema: MONEY(totalSystem),
        montoBanco: MONEY(totalBank),
        diferencia: MONEY(totalBank - totalSystem),
        avance:
          totalOps > 0
            ? Math.round(
                (list.reduce((a, r) => a + (r.avance / 100) * r.operaciones, 0) / totalOps) * 100,
              )
            : 0,
      },
      highlights: [
        { label: 'Recaudación registrada', value: this.money(totalSystem) },
        { label: 'Acreditado por el banco', value: this.money(totalBank) },
        { label: 'Operaciones', value: String(totalOps) },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  private async reconciliation(
    groupBy: InformeGroupBy,
    from: string | null,
    to: string | null,
    departments: Department[],
    scoped: Department[],
    narrowed: boolean,
  ): Promise<Informe> {
    const payments = await this.fetchPayments(from, to);
    const allowedSlugs = this.slugsOf(scoped, narrowed);
    const rows = new Map<
      string,
      { label: string; count: number; system: number; bank: number; abs: number }
    >();

    for (const p of payments) {
      if (allowedSlugs && !allowedSlugs.has(p.serviceSlug)) continue;
      const { key, label } = this.bucket(groupBy, p, departments);
      const row = rows.get(key) || { label, count: 0, system: 0, bank: 0, abs: 0 };
      row.count += 1;
      row.system += p.systemAmount;
      row.bank += p.bankAmount;
      row.abs += Math.abs(p.systemAmount - p.bankAmount);
      rows.set(key, row);
    }

    const list = [...rows.values()]
      .map((r) => ({
        concepto: r.label,
        operaciones: r.count,
        montoSistema: MONEY(r.system),
        montoBanco: MONEY(r.bank),
        descuadre: MONEY(r.abs),
      }))
      .sort((a, b) => b.descuadre - a.descuadre);

    const abiertas = payments.filter(
      (p) =>
        (!allowedSlugs || allowedSlugs.has(p.serviceSlug)) &&
        p.status === PaymentStatus.DISCREPANCIA,
    ).length;

    return {
      type: 'conciliacion',
      title: 'Informe de Conciliación Bancaria',
      subtitle: `Diferencias entre sistema y banco por ${this.groupLabel(groupBy)}`,
      groupBy,
      periodLabel: periodLabel(from, to),
      from,
      to,
      columns: [
        { key: 'concepto', label: this.groupLabel(groupBy), type: 'text' },
        { key: 'operaciones', label: 'Operaciones', type: 'number' },
        { key: 'montoSistema', label: 'Monto sistema', type: 'money' },
        { key: 'montoBanco', label: 'Monto banco', type: 'money' },
        { key: 'descuadre', label: 'Descuadre', type: 'money' },
      ],
      rows: list,
      totals: {
        concepto: 'Total',
        operaciones: list.reduce((a, r) => a + r.operaciones, 0),
        montoSistema: MONEY(list.reduce((a, r) => a + r.montoSistema, 0)),
        montoBanco: MONEY(list.reduce((a, r) => a + r.montoBanco, 0)),
        descuadre: MONEY(list.reduce((a, r) => a + r.descuadre, 0)),
      },
      highlights: [
        { label: 'Descuadre acumulado', value: this.money(list.reduce((a, r) => a + r.descuadre, 0)) },
        { label: 'Pagos con discrepancia', value: String(abiertas) },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  private async delinquency(
    groupBy: InformeGroupBy,
    departments: Department[],
    scoped: Department[],
    narrowed: boolean,
  ): Promise<Informe> {
    const allowedSlugs = this.slugsOf(scoped, narrowed);
    const debts = await this.dataSource.query(
      `SELECT d."amount"   AS amount,
              d."status"   AS status,
              d."due_date" AS due_date,
              s."slug"     AS slug
         FROM "debts" d
         LEFT JOIN "municipal_services" s ON s."id" = d."service_id"
        WHERE d."status" <> 'paid'`,
    );

    const today = Date.now();
    const rows = new Map<
      string,
      { label: string; count: number; amount: number; vencidos: number; vencidoAmount: number }
    >();

    for (const d of debts) {
      const slug: string = d.slug || 'otros';
      if (allowedSlugs && !allowedSlugs.has(slug)) continue;
      const key =
        groupBy === 'department' ? this.departmentKeyForSlug(slug, departments).key : slug;
      const label =
        groupBy === 'department'
          ? this.departmentKeyForSlug(slug, departments).label
          : SERVICE_LABELS[slug] || slug;

      const amount = Number(d.amount);
      const overdue =
        d.status === DebtStatus.OVERDUE ||
        (d.due_date ? new Date(`${String(d.due_date).slice(0, 10)}T00:00:00`).getTime() < today : false);

      const row =
        rows.get(key) || { label, count: 0, amount: 0, vencidos: 0, vencidoAmount: 0 };
      row.count += 1;
      row.amount += amount;
      if (overdue) {
        row.vencidos += 1;
        row.vencidoAmount += amount;
      }
      rows.set(key, row);
    }

    const list = [...rows.values()]
      .map((r) => ({
        concepto: r.label,
        adeudos: r.count,
        importeTotal: MONEY(r.amount),
        vencidos: r.vencidos,
        importeVencido: MONEY(r.vencidoAmount),
        morosidad: r.amount > 0 ? Math.round((r.vencidoAmount / r.amount) * 100) : 0,
      }))
      .sort((a, b) => b.importeVencido - a.importeVencido);

    const total = list.reduce((a, r) => a + r.importeTotal, 0);
    const overdueTotal = list.reduce((a, r) => a + r.importeVencido, 0);

    return {
      type: 'cartera',
      title: 'Informe de Cartera y Morosidad',
      subtitle: `Adeudos pendientes de cobro por ${this.groupLabel(groupBy)}`,
      groupBy,
      periodLabel: 'Saldo al día de hoy',
      from: null,
      to: null,
      columns: [
        { key: 'concepto', label: this.groupLabel(groupBy), type: 'text' },
        { key: 'adeudos', label: 'Adeudos', type: 'number' },
        { key: 'importeTotal', label: 'Importe total', type: 'money' },
        { key: 'vencidos', label: 'Vencidos', type: 'number' },
        { key: 'importeVencido', label: 'Importe vencido', type: 'money' },
        { key: 'morosidad', label: 'Morosidad', type: 'percent' },
      ],
      rows: list,
      totals: {
        concepto: 'Total',
        adeudos: list.reduce((a, r) => a + r.adeudos, 0),
        importeTotal: MONEY(total),
        vencidos: list.reduce((a, r) => a + r.vencidos, 0),
        importeVencido: MONEY(overdueTotal),
        morosidad: total > 0 ? Math.round((overdueTotal / total) * 100) : 0,
      },
      highlights: [
        { label: 'Cartera por cobrar', value: this.money(total) },
        { label: 'Importe vencido', value: this.money(overdueTotal) },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  private async performance(
    from: string | null,
    to: string | null,
    scoped: Department[],
  ): Promise<Informe> {
    const { clause, params } = this.dateClause('created_at', from, to);
    const reports = await this.dataSource.query(
      `SELECT "department_id" AS department_id,
              "category"      AS category,
              "status"        AS status,
              "created_at"    AS created_at,
              "updated_at"    AS updated_at
         FROM "citizen_reports" ${clause}`,
      params,
    );

    const list = scoped
      .map((department) => {
        const categories = new Set(
          (department.reportCategories || []).map((c) => c.trim().toLowerCase()),
        );
        const mine = reports.filter(
          (r: any) =>
            r.department_id === department.id ||
            (r.department_id === null && categories.has(String(r.category || '').trim().toLowerCase())),
        );

        const resolved = mine.filter((r: any) => r.status === ReportStatus.RESUELTO);
        const days: number[] = resolved.map(
          (r: any) =>
            (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / DAY_MS,
        );
        const open = mine.filter((r: any) => r.status !== ReportStatus.RESUELTO);
        const overdue = open.filter(
          (r: any) => Date.now() - new Date(r.created_at).getTime() > department.slaDays * DAY_MS,
        );

        return {
          concepto: department.name,
          recibidos: mine.length,
          abiertos: open.length,
          resueltos: resolved.length,
          fueraDePlazo: overdue.length,
          diasPromedio:
            days.length > 0
              ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10
              : 0,
          cumplimiento: mine.length > 0 ? Math.round((resolved.length / mine.length) * 100) : 0,
        };
      })
      .filter((r) => r.recibidos > 0 || r.abiertos > 0)
      .sort((a, b) => b.recibidos - a.recibidos);

    const totalRecibidos = list.reduce((a, r) => a + r.recibidos, 0);
    const totalResueltos = list.reduce((a, r) => a + r.resueltos, 0);

    return {
      type: 'desempeno',
      title: 'Informe de Desempeño por Departamento',
      subtitle: 'Atención de reportes ciudadanos y cumplimiento de plazos',
      groupBy: 'department',
      periodLabel: periodLabel(from, to),
      from,
      to,
      columns: [
        { key: 'concepto', label: 'Departamento', type: 'text' },
        { key: 'recibidos', label: 'Recibidos', type: 'number' },
        { key: 'abiertos', label: 'Abiertos', type: 'number' },
        { key: 'resueltos', label: 'Resueltos', type: 'number' },
        { key: 'fueraDePlazo', label: 'Fuera de plazo', type: 'number' },
        { key: 'diasPromedio', label: 'Días promedio', type: 'days' },
        { key: 'cumplimiento', label: 'Cumplimiento', type: 'percent' },
      ],
      rows: list,
      totals: {
        concepto: 'Total',
        recibidos: totalRecibidos,
        abiertos: list.reduce((a, r) => a + r.abiertos, 0),
        resueltos: totalResueltos,
        fueraDePlazo: list.reduce((a, r) => a + r.fueraDePlazo, 0),
        diasPromedio:
          list.length > 0
            ? Math.round((list.reduce((a, r) => a + r.diasPromedio, 0) / list.length) * 10) / 10
            : 0,
        cumplimiento:
          totalRecibidos > 0 ? Math.round((totalResueltos / totalRecibidos) * 100) : 0,
      },
      highlights: [
        { label: 'Reportes recibidos', value: String(totalRecibidos) },
        { label: 'Resueltos', value: String(totalResueltos) },
        {
          label: 'Fuera de plazo',
          value: String(list.reduce((a, r) => a + r.fueraDePlazo, 0)),
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  private async reportsVolume(
    groupBy: InformeGroupBy,
    from: string | null,
    to: string | null,
    scoped: Department[],
  ): Promise<Informe> {
    const { clause, params } = this.dateClause('created_at', from, to);
    const reports = await this.dataSource.query(
      `SELECT "department_id" AS department_id,
              "category"      AS category,
              "priority"      AS priority,
              "status"        AS status
         FROM "citizen_reports" ${clause}`,
      params,
    );

    const allowedCategories =
      scoped.length > 0
        ? new Set(
            scoped.flatMap((d) => (d.reportCategories || []).map((c) => c.trim().toLowerCase())),
          )
        : null;
    const scopedIds = new Set(scoped.map((d) => d.id));

    const rows = new Map<
      string,
      { label: string; total: number; nuevos: number; proceso: number; resueltos: number }
    >();

    for (const r of reports) {
      const category = String(r.category || '').trim();
      if (
        allowedCategories &&
        allowedCategories.size > 0 &&
        !allowedCategories.has(category.toLowerCase()) &&
        !scopedIds.has(r.department_id)
      ) {
        continue;
      }

      let key = category || 'Sin categoría';
      if (groupBy === 'priority') key = String(r.priority || 'Media');
      if (groupBy === 'status') key = String(r.status || 'Nuevo');
      if (groupBy === 'department') {
        const dept = scoped.find(
          (d) =>
            d.id === r.department_id ||
            (d.reportCategories || []).some((c) => c.trim().toLowerCase() === category.toLowerCase()),
        );
        key = dept ? dept.name : 'Sin asignar';
      }

      const row = rows.get(key) || { label: key, total: 0, nuevos: 0, proceso: 0, resueltos: 0 };
      row.total += 1;
      if (r.status === ReportStatus.NUEVO) row.nuevos += 1;
      else if (r.status === ReportStatus.RESUELTO) row.resueltos += 1;
      else row.proceso += 1;
      rows.set(key, row);
    }

    const list = [...rows.values()]
      .map((r) => ({
        concepto: r.label,
        total: r.total,
        nuevos: r.nuevos,
        enAtencion: r.proceso,
        resueltos: r.resueltos,
        cumplimiento: r.total > 0 ? Math.round((r.resueltos / r.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      type: 'reportes',
      title: 'Informe de Reportes Ciudadanos',
      subtitle: `Incidencias registradas por ${this.groupLabel(groupBy)}`,
      groupBy,
      periodLabel: periodLabel(from, to),
      from,
      to,
      columns: [
        { key: 'concepto', label: this.groupLabel(groupBy), type: 'text' },
        { key: 'total', label: 'Total', type: 'number' },
        { key: 'nuevos', label: 'Nuevos', type: 'number' },
        { key: 'enAtencion', label: 'En atención', type: 'number' },
        { key: 'resueltos', label: 'Resueltos', type: 'number' },
        { key: 'cumplimiento', label: 'Resueltos', type: 'percent' },
      ],
      rows: list,
      totals: {
        concepto: 'Total',
        total: list.reduce((a, r) => a + r.total, 0),
        nuevos: list.reduce((a, r) => a + r.nuevos, 0),
        enAtencion: list.reduce((a, r) => a + r.enAtencion, 0),
        resueltos: list.reduce((a, r) => a + r.resueltos, 0),
        cumplimiento:
          list.reduce((a, r) => a + r.total, 0) > 0
            ? Math.round(
                (list.reduce((a, r) => a + r.resueltos, 0) /
                  list.reduce((a, r) => a + r.total, 0)) *
                  100,
              )
            : 0,
      },
      highlights: [
        { label: 'Reportes en el periodo', value: String(list.reduce((a, r) => a + r.total, 0)) },
        { label: 'Pendientes de cierre', value: String(list.reduce((a, r) => a + r.nuevos + r.enAtencion, 0)) },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  /* -------------------------------- helpers ------------------------------ */

  private async fetchPayments(from: string | null, to: string | null): Promise<PaymentRow[]> {
    const { clause, params } = this.dateClause('payment_date', from, to);
    const rows = await this.dataSource.query(
      `SELECT "service_slug"   AS service_slug,
              "status"         AS status,
              "system_amount"  AS system_amount,
              "bank_amount"    AS bank_amount,
              "payment_method" AS payment_method,
              "bank"           AS bank,
              "payment_date"   AS payment_date
         FROM "payments" ${clause}`,
      params,
    );
    return rows.map((r: any) => ({
      serviceSlug: r.service_slug as string,
      status: r.status as PaymentStatus,
      systemAmount: Number(r.system_amount),
      bankAmount: Number(r.bank_amount),
      paymentMethod: (r.payment_method as string) || 'Sin método',
      bank: (r.bank as string) || 'Sin banco',
      paymentDate: String(r.payment_date).slice(0, 10),
    }));
  }

  private bucket(
    groupBy: InformeGroupBy,
    payment: {
      serviceSlug: string;
      status: PaymentStatus;
      paymentMethod: string;
      bank: string;
      paymentDate: string;
    },
    departments: Department[],
  ): { key: string; label: string } {
    switch (groupBy) {
      case 'department':
        return this.departmentKeyForSlug(payment.serviceSlug, departments);
      case 'method':
        return { key: payment.paymentMethod, label: payment.paymentMethod };
      case 'bank':
        return { key: payment.bank, label: payment.bank };
      case 'status':
        return {
          key: payment.status,
          label: PAYMENT_STATUS_LABELS[payment.status] || payment.status,
        };
      case 'month': {
        const month = payment.paymentDate.slice(0, 7);
        const label = new Date(`${month}-01T00:00:00`).toLocaleDateString('es-MX', {
          month: 'long',
          year: 'numeric',
        });
        return { key: month, label };
      }
      case 'service':
      default:
        return {
          key: payment.serviceSlug,
          label: SERVICE_LABELS[payment.serviceSlug] || payment.serviceSlug,
        };
    }
  }

  /**
   * Owning department for a service. The consolidating office is skipped so the
   * same peso is never reported twice.
   */
  private departmentKeyForSlug(
    slug: string,
    departments: Department[],
  ): { key: string; label: string } {
    const owner = departments.find(
      (d) => !d.isConsolidator && (d.serviceSlugs || []).includes(slug),
    );
    if (owner) return { key: owner.slug, label: owner.name };
    return { key: 'sin-departamento', label: 'Sin departamento asignado' };
  }

  /**
   * Services the informe may cover. `null` means "no restriction" and is only
   * used when no department was selected: a department that collects nothing
   * must come back with an empty set, not with the whole municipality.
   */
  private slugsOf(scoped: Department[], narrowed: boolean): Set<string> | null {
    if (!narrowed) return null;
    return new Set(scoped.flatMap((d) => d.serviceSlugs || []));
  }

  private groupLabel(groupBy: InformeGroupBy): string {
    const labels: Record<InformeGroupBy, string> = {
      department: 'Departamento',
      service: 'Servicio',
      method: 'Método de pago',
      bank: 'Banco',
      status: 'Estado',
      category: 'Categoría',
      priority: 'Prioridad',
      month: 'Mes',
    };
    return labels[groupBy] || 'Concepto';
  }

  private dateClause(
    column: string,
    from: string | null,
    to: string | null,
  ): { clause: string; params: any[] } {
    const parts: string[] = [];
    const params: any[] = [];
    if (from) {
      params.push(from);
      parts.push(`"${column}" >= $${params.length}`);
    }
    if (to) {
      params.push(column === 'created_at' ? `${to} 23:59:59` : to);
      parts.push(`"${column}" <= $${params.length}`);
    }
    return { clause: parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '', params };
  }

  private assertRange(from: string | null, to: string | null) {
    if (from && !isIsoDate(from)) {
      throw new BadRequestException('La fecha inicial debe tener el formato AAAA-MM-DD.');
    }
    if (to && !isIsoDate(to)) {
      throw new BadRequestException('La fecha final debe tener el formato AAAA-MM-DD.');
    }
    if (from && to && from > to) {
      throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final.');
    }
  }

  private money(value: number): string {
    return value.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    });
  }
}

export { DEBT_STATUS_LABELS, PAYMENT_STATUS_LABELS, SERVICE_LABELS };
