import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { CitizenReport, ReportStatus } from '../reports/entities/report.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { DebtStatus } from '../debts/entities/debt.entity';

export interface DepartmentMetrics {
  totalSistema: number;
  recaudado: number;
  descuadre: number;
  pagosTotal: number;
  pagosConciliados: number;
  pagosDiscrepancia: number;
  pagosPendientes: number;
  carteraPendiente: number;
  carteraVencida: number;
  adeudosCount: number;
  reportesTotal: number;
  reportesNuevos: number;
  reportesAsignados: number;
  reportesProceso: number;
  reportesResueltos: number;
  reportesVencidos: number;
  tasaResolucion: number;
  diasPromedioResolucion: number | null;
  equipo: number;
}

/** A citizen report reduced to the fields the aggregation needs. */
interface ReportRow {
  departmentId: string | null;
  category: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const DAY_MS = 86_400_000;

function emptyMetrics(): DepartmentMetrics {
  return {
    totalSistema: 0,
    recaudado: 0,
    descuadre: 0,
    pagosTotal: 0,
    pagosConciliados: 0,
    pagosDiscrepancia: 0,
    pagosPendientes: 0,
    carteraPendiente: 0,
    carteraVencida: 0,
    adeudosCount: 0,
    reportesTotal: 0,
    reportesNuevos: 0,
    reportesAsignados: 0,
    reportesProceso: 0,
    reportesResueltos: 0,
    reportesVencidos: 0,
    tasaResolucion: 0,
    diasPromedioResolucion: null,
    equipo: 0,
  };
}

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(CitizenReport)
    private readonly reportsRepository: Repository<CitizenReport>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(includeInactive = false): Promise<Department[]> {
    return this.departmentRepository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) throw new NotFoundException('Departamento no encontrado.');
    return department;
  }

  async findBySlug(slug: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({ where: { slug } });
    if (!department) {
      throw new NotFoundException(`Departamento '${slug}' no encontrado.`);
    }
    return department;
  }

  /**
   * Department that owns a citizen-report category. Categories are kept
   * mutually exclusive in the seed, so the first match by sort order wins.
   */
  async findByReportCategory(category: string): Promise<Department | null> {
    if (!category) return null;
    const departments = await this.findAll();
    const target = category.trim().toLowerCase();
    return (
      departments.find((d) =>
        (d.reportCategories || []).some((c) => c.trim().toLowerCase() === target),
      ) || null
    );
  }

  async update(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.findById(id);
    Object.assign(department, dto);
    return this.departmentRepository.save(department);
  }

  /** Puts a municipal account in a department. Citizens cannot belong to one. */
  async assignStaff(departmentId: string, userId: string): Promise<User> {
    const department = await this.findById(departmentId);
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    if (user.role === UserRole.CITIZEN) {
      throw new BadRequestException(
        'Una cuenta ciudadana no puede adscribirse a un departamento. Cambia primero su rol a funcionario o supervisor.',
      );
    }
    user.departmentId = department.id;
    return this.usersRepository.save(user);
  }

  async removeStaff(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    user.departmentId = null;
    return this.usersRepository.save(user);
  }

  async listStaff(departmentId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { departmentId },
      order: { role: 'ASC', displayName: 'ASC' },
    });
  }

  /** Every department with its aggregated indicators, in one pass over the data. */
  async listWithMetrics(
    includeInactive = false,
  ): Promise<{ department: Department; metrics: DepartmentMetrics }[]> {
    const departments = await this.findAll(includeInactive);
    if (departments.length === 0) return [];

    const [paymentRows, debtRows, reportRows, staffRows] = await Promise.all([
      this.paymentAggregates(),
      this.debtAggregates(),
      this.reportRows(),
      this.staffCounts(),
    ]);

    return departments.map((department) => ({
      department,
      metrics: this.composeMetrics(department, paymentRows, debtRows, reportRows, staffRows),
    }));
  }

  async metricsFor(department: Department): Promise<DepartmentMetrics> {
    const [paymentRows, debtRows, reportRows, staffRows] = await Promise.all([
      this.paymentAggregates(),
      this.debtAggregates(),
      this.reportRows(),
      this.staffCounts(),
    ]);
    return this.composeMetrics(department, paymentRows, debtRows, reportRows, staffRows);
  }

  /** Reports routed to a department, either explicitly or through its categories. */
  async reportsFor(
    department: Department,
    options?: { status?: ReportStatus; search?: string },
  ): Promise<CitizenReport[]> {
    const query = this.reportsRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.images', 'images')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.assignedTo', 'assignedTo');

    const categories = department.reportCategories || [];
    if (categories.length > 0) {
      query.where(
        '(report.department_id = :departmentId OR (report.department_id IS NULL AND report.category IN (:...categories)))',
        { departmentId: department.id, categories },
      );
    } else {
      query.where('report.department_id = :departmentId', { departmentId: department.id });
    }

    if (options?.status) {
      query.andWhere('report.status = :status', { status: options.status });
    }

    if (options?.search) {
      const term = `%${options.search.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(report.title) LIKE :term OR LOWER(report.address) LIKE :term OR LOWER(report.description) LIKE :term)',
        { term },
      );
    }

    query.orderBy('report.created_at', 'DESC');
    return query.getMany();
  }

  /** Latest collection records for the services this department answers for. */
  async paymentsFor(department: Department, limit = 20): Promise<Payment[]> {
    const slugs = department.serviceSlugs || [];
    if (slugs.length === 0) return [];
    return this.paymentsRepository.find({
      where: { serviceSlug: In(slugs) },
      order: { paymentDate: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }

  /* ----------------------------- aggregation ----------------------------- */

  private async paymentAggregates(): Promise<
    { serviceSlug: string; status: PaymentStatus; count: number; system: number; bank: number }[]
  > {
    const rows = await this.dataSource.query(
      `SELECT "service_slug" AS slug,
              "status"       AS status,
              COUNT(*)::int  AS count,
              COALESCE(SUM("system_amount"), 0) AS system,
              COALESCE(SUM("bank_amount"), 0)   AS bank
         FROM "payments"
        GROUP BY "service_slug", "status"`,
    );
    return rows.map((r: any) => ({
      serviceSlug: r.slug,
      status: r.status as PaymentStatus,
      count: Number(r.count),
      system: Number(r.system),
      bank: Number(r.bank),
    }));
  }

  private async debtAggregates(): Promise<
    { serviceSlug: string | null; status: DebtStatus; count: number; amount: number }[]
  > {
    const rows = await this.dataSource.query(
      `SELECT s."slug"       AS slug,
              d."status"     AS status,
              COUNT(*)::int  AS count,
              COALESCE(SUM(d."amount"), 0) AS amount
         FROM "debts" d
         LEFT JOIN "municipal_services" s ON s."id" = d."service_id"
        GROUP BY s."slug", d."status"`,
    );
    return rows.map((r: any) => ({
      serviceSlug: r.slug,
      status: r.status as DebtStatus,
      count: Number(r.count),
      amount: Number(r.amount),
    }));
  }

  private async reportRows(): Promise<ReportRow[]> {
    const rows = await this.dataSource.query(
      `SELECT "department_id" AS department_id,
              "category"      AS category,
              "status"        AS status,
              "created_at"    AS created_at,
              "updated_at"    AS updated_at
         FROM "citizen_reports"`,
    );
    return rows.map((r: any) => ({
      departmentId: r.department_id,
      category: r.category,
      status: r.status as ReportStatus,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    }));
  }

  private async staffCounts(): Promise<Record<string, number>> {
    const rows = await this.dataSource.query(
      `SELECT "department_id" AS department_id, COUNT(*)::int AS count
         FROM "users"
        WHERE "department_id" IS NOT NULL
        GROUP BY "department_id"`,
    );
    return Object.fromEntries(rows.map((r: any) => [r.department_id, Number(r.count)]));
  }

  private composeMetrics(
    department: Department,
    paymentRows: { serviceSlug: string; status: PaymentStatus; count: number; system: number; bank: number }[],
    debtRows: { serviceSlug: string | null; status: DebtStatus; count: number; amount: number }[],
    reportRows: ReportRow[],
    staffRows: Record<string, number>,
  ): DepartmentMetrics {
    const metrics = emptyMetrics();
    const slugs = new Set(department.serviceSlugs || []);
    const categories = new Set(
      (department.reportCategories || []).map((c) => c.trim().toLowerCase()),
    );

    for (const row of paymentRows) {
      if (!slugs.has(row.serviceSlug)) continue;
      metrics.pagosTotal += row.count;
      metrics.totalSistema += row.system;
      if (row.status === PaymentStatus.CONCILIADO) {
        metrics.pagosConciliados += row.count;
        metrics.recaudado += row.bank;
      } else if (row.status === PaymentStatus.DISCREPANCIA) {
        metrics.pagosDiscrepancia += row.count;
        metrics.descuadre += Math.abs(row.system - row.bank);
      } else {
        metrics.pagosPendientes += row.count;
      }
    }

    for (const row of debtRows) {
      if (!row.serviceSlug || !slugs.has(row.serviceSlug)) continue;
      if (row.status === DebtStatus.PENDING) {
        metrics.carteraPendiente += row.amount;
        metrics.adeudosCount += row.count;
      } else if (row.status === DebtStatus.OVERDUE) {
        metrics.carteraVencida += row.amount;
        metrics.adeudosCount += row.count;
      }
    }

    const mine = reportRows.filter(
      (r) =>
        r.departmentId === department.id ||
        (r.departmentId === null && categories.has((r.category || '').trim().toLowerCase())),
    );

    const resolutionDays: number[] = [];
    const now = Date.now();
    for (const report of mine) {
      metrics.reportesTotal += 1;
      switch (report.status) {
        case ReportStatus.NUEVO:
          metrics.reportesNuevos += 1;
          break;
        case ReportStatus.ASIGNADO:
          metrics.reportesAsignados += 1;
          break;
        case ReportStatus.EN_PROCESO:
          metrics.reportesProceso += 1;
          break;
        case ReportStatus.RESUELTO:
          metrics.reportesResueltos += 1;
          resolutionDays.push(
            Math.max(0, (report.updatedAt.getTime() - report.createdAt.getTime()) / DAY_MS),
          );
          break;
      }
      if (
        report.status !== ReportStatus.RESUELTO &&
        now - report.createdAt.getTime() > department.slaDays * DAY_MS
      ) {
        metrics.reportesVencidos += 1;
      }
    }

    metrics.tasaResolucion =
      metrics.reportesTotal > 0
        ? Math.round((metrics.reportesResueltos / metrics.reportesTotal) * 100)
        : 0;
    metrics.diasPromedioResolucion =
      resolutionDays.length > 0
        ? Math.round((resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length) * 10) / 10
        : null;
    metrics.equipo = staffRows[department.id] || 0;

    return metrics;
  }
}
