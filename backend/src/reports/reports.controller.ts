import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Sse,
  UseGuards,
  ParseUUIDPipe,
  UnauthorizedException,
  MessageEvent,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { CitizenReport, ReportPriority, ReportStatus } from './entities/report.entity';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { FirebaseService } from '../auth/firebase.service';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { isStaff } from '../auth/roles';
import { getDepartmentDef, resolveDepartmentForReport } from '../auth/orizaba';
import { RealtimeService } from '../realtime/realtime.service';

@Controller('reports')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly realtimeService: RealtimeService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('department') department?: string,
    @Query('status') status?: ReportStatus,
    @Query('priority') priority?: ReportPriority,
    @Query('q') q?: string,
    @Query('mine') mine?: string,
    @CurrentUser() user?: User,
  ) {
    // Los ciudadanos por defecto consultan sus propios reportes si pasan mine=true;
    // el personal municipal consulta todos o filtrados por coordinación.
    const userId = (mine === 'true' || (user && !isStaff(user) && mine !== 'false')) ? user?.id : undefined;
    const reports = await this.reportsService.findAll({
      category,
      department,
      status,
      priority,
      search: q,
      userId,
    });
    return reports.map((r) => this.mapToDto(r));
  }

  /**
   * Canal SSE en tiempo real para notificar nuevos reportes ciudadanos, actualizaciones
   * de estado y conciliaciones bancarias a los dashboards abiertos en otros dispositivos.
   */
  @Public()
  @Sse('stream')
  async stream(
    @Query('token') queryToken?: string,
    @Req() req?: Request,
  ): Promise<Observable<MessageEvent>> {
    const authHeader = req?.headers.authorization;
    const bearer =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const token = queryToken || bearer;
    if (!token) {
      throw new UnauthorizedException('Se requiere un token válido para suscribirse al canal en tiempo real.');
    }
    await this.firebaseService.verifyToken(token);
    return this.realtimeService.stream();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    const report = await this.reportsService.findById(id);
    return this.mapToDetailDto(report, isStaff(user) || report.userId === user.id);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateReportDto,
  ) {
    const created = await this.reportsService.create(dto, user);
    const mapped = this.mapToDto(created);
    this.realtimeService.emit('report.created', mapped);
    return mapped;
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MUNICIPAL_OFFICIAL, UserRole.MUNICIPAL_SUPERVISOR)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateReportStatusDto,
  ) {
    const updated = await this.reportsService.updateStatus(id, dto, user);
    const mapped = this.mapToDto(updated);
    this.realtimeService.emit('report.updated', mapped);
    return mapped;
  }

  private mapToDto(r: CitizenReport) {
    const deptSlug = r.department || resolveDepartmentForReport(r.category, r.title);
    const dept = getDepartmentDef(deptSlug);
    return {
      id: r.id,
      title: r.title,
      address: r.address,
      date: r.date,
      estado: r.status,
      categoria: r.category,
      department: deptSlug,
      departamentoNombre: dept?.name || null,
      prioridad: r.priority,
      icon: r.icon,
      description: r.description,
      fotos: r.images?.map((i) => i.secureUrl) || [],
      latitude: r.latitude != null ? Number(r.latitude) : null,
      longitude: r.longitude != null ? Number(r.longitude) : null,
      createdAt: r.createdAt,
    };
  }

  private mapToDetailDto(r: CitizenReport, showReporter: boolean) {
    return {
      ...this.mapToDto(r),
      user: showReporter && r.user
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
