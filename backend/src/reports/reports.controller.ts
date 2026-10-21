import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
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

@Controller('reports')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('status') status?: ReportStatus,
    @Query('priority') priority?: ReportPriority,
    @Query('q') q?: string,
    @Query('mine') mine?: string,
    @CurrentUser() user?: User,
  ) {
    const userId = mine === 'true' && user ? user.id : undefined;
    const reports = await this.reportsService.findAll({
      category,
      status,
      priority,
      search: q,
      userId,
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
    const updated = await this.reportsService.updateStatus(id, dto, user);
    return this.mapToDto(updated);
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
