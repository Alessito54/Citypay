import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus, { message: 'El estado debe ser Nuevo, En proceso, Asignado o Resuelto.' })
  @IsNotEmpty()
  status: ReportStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El assignedToId debe ser un UUID válido.' })
  assignedToId?: string;
}
