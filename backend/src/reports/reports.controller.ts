import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { CitizenReport, ReportPriority, ReportStatus } from './entities/report.entity';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { DepartmentsService } from '../departments/departments.service';

@Controller('reports')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('status') status?: ReportStatus,
    @Query('priority') priority?: ReportPriority,
    @Query('q') q?: string,
    @Query('mine') mine?: string,
    @Query('userId') queryUserId?: string,
    @Query('departmentId') queryDepartmentId?: string,
    @CurrentUser() user?: User,
  ) {
    const isStaff =
      user &&
      (user.role === UserRole.ADMIN ||
        user.role === UserRole.MUNICIPAL_OFFICIAL ||
        user.role === UserRole.MUNICIPAL_SUPERVISOR);

    // Regular citizens can strictly and exclusively see their own reports from DB
    const targetUserId = isStaff
      ? mine === 'true'
        ? user?.id
        : queryUserId || undefined
      : user?.id;

    // A municipal official only works the queue of their own office; the admin
    // and supervisors may narrow it down with the query parameter.
    const departmentId =
      user?.role === UserRole.MUNICIPAL_OFFICIAL
        ? user.departmentId || undefined
        : queryDepartmentId || undefined;

    const reports = await this.reportsService.findAll({
      category,
      status,
      priority,
      search: q,
      userId: targetUserId,
      departmentId: isStaff ? departmentId : undefined,
    });
    return reports.map(this.mapToDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const report = await this.reportsService.findById(id);
    return this.mapToDetailDto(report);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateReportDto,
  ) {
    const created = await this.reportsService.create(dto, user);
    return this.mapToDto(created);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MUNICIPAL_OFFICIAL, UserRole.MUNICIPAL_SUPERVISOR)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateReportStatusDto,
  ) {
    if (user.role === UserRole.MUNICIPAL_OFFICIAL) {
      await this.assertOwnDepartment(id, user);
      if (dto.departmentId && dto.departmentId !== user.departmentId) {
        throw new ForbiddenException(
          'Turnar un reporte a otro departamento corresponde a un supervisor o al administrador.',
        );
      }
    }

    const updated = await this.reportsService.updateStatus(id, dto, user);
    return this.mapToDto(updated);
  }

  /**
   * An official may only work the queue of their own office. A report with no
   * department yet counts as theirs when its category is one they attend.
   */
  private async assertOwnDepartment(reportId: string, user: User) {
    if (!user.departmentId) {
      throw new ForbiddenException(
        'Tu cuenta no está adscrita a un departamento, así que no puede atender reportes.',
      );
    }

    const report = await this.reportsService.findById(reportId);
    if (report.departmentId === user.departmentId) return;

    if (report.departmentId === null) {
      const own = await this.departmentsService.findById(user.departmentId);
      const categories = (own.reportCategories || []).map((c) => c.trim().toLowerCase());
      if (categories.includes(String(report.category || '').trim().toLowerCase())) return;
    }

    throw new ForbiddenException('Este reporte está turnado a otro departamento.');
  }

  private mapToDto(r: CitizenReport) {
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
      departamento: r.department?.name || null,
      departamentoSlug: r.department?.slug || null,
      localOnly: false,
      createdAt: r.createdAt,
    };
  }

  private mapToDetailDto(r: CitizenReport) {
    return {
      ...this.mapToDto(r),
      latitude: r.latitude ? Number(r.latitude) : null,
      longitude: r.longitude ? Number(r.longitude) : null,
      user: r.user
        ? {
            id: r.user.id,
            displayName: r.user.displayName,
            email: r.user.email,
          }
        : null,
      assignedTo: r.assignedTo
        ? {
            id: r.assignedTo.id,
            displayName: r.assignedTo.displayName,
          }
        : null,
      history: r.history?.map((h) => ({
        id: h.id,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        notes: h.notes,
        date: h.createdAt,
        changedBy: h.changedBy?.displayName || 'Sistema',
      })),
    };
  }
}
