import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CitizenReport, ReportPriority, ReportStatus } from './entities/report.entity';
import { ReportImage } from './entities/report-image.entity';
import { ReportStatusHistory } from './entities/report-status-history.entity';
import { CreateReportDto, ReportImageDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { User } from '../users/entities/user.entity';

const ICONS: Record<string, string> = {
  'Alumbrado público': '💡',
  Vialidad: '🚧',
  Agua: '💧',
  'Limpieza y residuos': '🗑️',
  'Parques y jardines': '🛝',
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(CitizenReport)
    private readonly reportRepository: Repository<CitizenReport>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(options?: {
    category?: string;
    status?: ReportStatus;
    priority?: ReportPriority;
    search?: string;
    userId?: string;
  }): Promise<CitizenReport[]> {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.images', 'images')
      .leftJoinAndSelect('report.user', 'user');

    if (options?.userId) {
      query.andWhere('report.user_id = :userId', { userId: options.userId });
    }

    if (options?.category && options.category !== 'Todos') {
      query.andWhere('report.category = :category', { category: options.category });
    }

    if (options?.status && (options.status as any) !== 'Todos') {
      query.andWhere('report.status = :status', { status: options.status });
    }

    if (options?.priority && (options.priority as any) !== 'Todas') {
      query.andWhere('report.priority = :priority', { priority: options.priority });
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

  async findById(id: string): Promise<CitizenReport> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: {
        images: true,
        history: {
          changedBy: true,
        },
        user: true,
        assignedTo: true,
      },
      order: {
        history: {
          createdAt: 'DESC',
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Reporte ciudadano no encontrado.');
    }

    return report;
  }

  async create(dto: CreateReportDto, user: User): Promise<CitizenReport> {
    const dateFormatted = new Date()
      .toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(/\./g, '');

    const icon = ICONS[dto.category] || '📋';

    // Use SQL Transaction for saving report, images, and history atomically
    return this.dataSource.transaction(async (manager) => {
      const report = manager.create(CitizenReport, {
        title: dto.title,
        category: dto.category,
        priority: dto.priority,
        address: dto.address,
        description: dto.description,
        icon,
        date: dateFormatted,
        status: ReportStatus.NUEVO,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        userId: user.id,
      });

      const savedReport = await manager.save(CitizenReport, report);

      // Save initial history record
      await manager.save(ReportStatusHistory, {
        reportId: savedReport.id,
        changedById: user.id,
        previousStatus: 'Creado',
        newStatus: ReportStatus.NUEVO,
        notes: 'Reporte registrado por el ciudadano.',
      });

      // Save images if any
      if (dto.images && dto.images.length > 0) {
        const imageEntities = dto.images.map((img) => {
          if (typeof img === 'string') {
            return manager.create(ReportImage, {
              reportId: savedReport.id,
              secureUrl: img,
              publicId: `reports/${savedReport.id}/${Date.now()}`,
            });
          }
          const item = img as ReportImageDto;
          return manager.create(ReportImage, {
            reportId: savedReport.id,
            secureUrl: item.secureUrl,
            publicId: item.publicId,
            format: item.format || null,
            bytes: item.bytes || null,
            width: item.width || null,
            height: item.height || null,
          });
        });

        savedReport.images = await manager.save(ReportImage, imageEntities);
      } else {
        savedReport.images = [];
      }

      return savedReport;
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateReportStatusDto,
    changedBy: User,
  ): Promise<CitizenReport> {
    const report = await this.findById(id);

    return this.dataSource.transaction(async (manager) => {
      const previousStatus = report.status;
      report.status = dto.status;
      if (dto.assignedToId) {
        report.assignedToId = dto.assignedToId;
      }

      const updated = await manager.save(CitizenReport, report);

      await manager.save(ReportStatusHistory, {
        reportId: report.id,
        changedById: changedBy.id,
        previousStatus,
        newStatus: dto.status,
        notes: dto.notes || `Estado actualizado a ${dto.status}.`,
      });

      return updated;
    });
  }
}
