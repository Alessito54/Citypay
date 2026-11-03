import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { AssignStaffDto, UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CitizenReport, ReportStatus } from '../reports/entities/report.entity';
import { Payment } from '../payments/entities/payment.entity';

const STAFF_ROLES = [
  UserRole.ADMIN,
  UserRole.MUNICIPAL_SUPERVISOR,
  UserRole.MUNICIPAL_OFFICIAL,
];

@Controller('departments')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * Public directory for any signed-in account: a citizen is allowed to know
   * which office handles what, and how to contact it. Indicators are only
   * attached for municipal staff.
   */
  @Get()
  async findAll(@Query('inactive') inactive: string | undefined, @CurrentUser() user: User) {
    const isStaff = STAFF_ROLES.includes(user.role);
    if (!isStaff) {
      const departments = await this.departmentsService.findAll();
      return { items: departments.map((d) => this.mapDirectory(d)), withMetrics: false };
    }

    const includeInactive = inactive === 'true' && user.role === UserRole.ADMIN;
    const rows = await this.departmentsService.listWithMetrics(includeInactive);
    return {
      items: rows.map(({ department, metrics }) => ({
        ...this.mapDirectory(department),
        metrics,
      })),
      withMetrics: true,
    };
  }

  /** The department the signed-in official is attached to. */
  @Get('mine')
  @Roles(...STAFF_ROLES)
  async findMine(@CurrentUser() user: User) {
    if (!user.departmentId) return null;
    const department = await this.departmentsService.findById(user.departmentId);
    return this.detail(department);
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string, @CurrentUser() user: User) {
    const department = await this.departmentsService.findBySlug(slug);
    if (!STAFF_ROLES.includes(user.role)) {
      return { ...this.mapDirectory(department), metrics: null, staff: [], reports: [], payments: [] };
    }
    return this.detail(department);
  }

  @Get(':slug/reports')
  @Roles(...STAFF_ROLES)
  async findReports(
    @Param('slug') slug: string,
    @Query('status') status?: ReportStatus,
    @Query('q') q?: string,
  ) {
    const department = await this.departmentsService.findBySlug(slug);
    const reports = await this.departmentsService.reportsFor(department, {
      status: status && (status as string) !== 'Todos' ? status : undefined,
      search: q,
    });
    return reports.map((r) => this.mapReport(r));
  }

  @Get(':slug/payments')
  @Roles(...STAFF_ROLES)
  async findPayments(@Param('slug') slug: string, @Query('limit') limit?: string) {
    const department = await this.departmentsService.findBySlug(slug);
    const payments = await this.departmentsService.paymentsFor(
      department,
      limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20,
    );
    return payments.map((p) => this.mapPayment(p));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentsService.update(id, dto);
    return this.mapDirectory(department);
  }

  @Post(':id/staff')
  @Roles(UserRole.ADMIN)
  async assignStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignStaffDto,
  ) {
    const user = await this.departmentsService.assignStaff(id, dto.userId);
    return this.mapStaff(user);
  }

  @Delete('staff/:userId')
  @Roles(UserRole.ADMIN)
  async removeStaff(@Param('userId', ParseUUIDPipe) userId: string) {
    const user = await this.departmentsService.removeStaff(userId);
    return this.mapStaff(user);
  }

  /* ------------------------------- mapping ------------------------------- */

  private async detail(department: Department) {
    const [metrics, staff, reports, payments] = await Promise.all([
      this.departmentsService.metricsFor(department),
      this.departmentsService.listStaff(department.id),
      this.departmentsService.reportsFor(department),
      this.departmentsService.paymentsFor(department, 10),
    ]);

    return {
      ...this.mapDirectory(department),
      metrics,
      staff: staff.map((u) => this.mapStaff(u)),
      reports: reports.map((r) => this.mapReport(r)),
      payments: payments.map((p) => this.mapPayment(p)),
    };
  }

  private mapDirectory(d: Department) {
    return {
      id: d.id,
      slug: d.slug,
      name: d.name,
      shortName: d.shortName,
      description: d.description,
      icon: d.icon,
      area: d.area,
      serviceSlugs: d.serviceSlugs || [],
      reportCategories: d.reportCategories || [],
      headName: d.headName,
      contactEmail: d.contactEmail,
      contactPhone: d.contactPhone,
      office: d.office,
      scheduleLabel: d.scheduleLabel,
      slaDays: d.slaDays,
      isConsolidator: d.isConsolidator,
      isActive: d.isActive,
    };
  }

  private mapStaff(u: User) {
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      phone: u.phone,
      departmentId: u.departmentId,
    };
  }

  private mapReport(r: CitizenReport) {
    return {
      id: r.id,
      title: r.title,
      address: r.address,
      date: r.date,
      estado: r.status,
      categoria: r.category,
      prioridad: r.priority,
      icon: r.icon,
      description: r.description,
      fotos: r.images?.map((i) => i.secureUrl) || [],
      departmentId: r.departmentId,
      latitude: r.latitude ? Number(r.latitude) : null,
      longitude: r.longitude ? Number(r.longitude) : null,
      ciudadano: r.user?.displayName || null,
      asignadoA: r.assignedTo?.displayName || null,
      createdAt: r.createdAt,
      localOnly: false,
    };
  }

  private mapPayment(p: Payment) {
    return {
      id: p.id,
      folio: p.folio,
      referenciaBancaria: p.bankReference,
      concepto: p.concept,
      servicio: p.serviceSlug,
      fecha: p.paymentDate,
      montoSistema: Number(p.systemAmount),
      montoBanco: Number(p.bankAmount),
      estado: p.status,
      ciudadano: p.citizenName,
      metodoPago: p.paymentMethod,
      banco: p.bank,
    };
  }
}
