import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';
import { VALID_DEPARTMENT_SLUGS } from '../../auth/orizaba';

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

  @IsOptional()
  @IsIn(VALID_DEPARTMENT_SLUGS, {
    message: 'El departamento destino seleccionado no es válido.',
  })
  department?: string;
}
