import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ReportPriority } from '../entities/report.entity';

export class ReportImageDto {
  @IsString()
  @IsNotEmpty()
  secureUrl: string;

  @IsString()
  @IsNotEmpty()
  publicId: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsNumber()
  bytes?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;
}

export class CreateReportDto {
  @IsString()
  @IsNotEmpty({ message: 'El problema o título del reporte es requerido.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'La categoría es requerida.' })
  category: string;

  @IsEnum(ReportPriority, { message: 'La prioridad debe ser Baja, Media o Alta.' })
  priority: ReportPriority;

  @IsString()
  @IsNotEmpty({ message: 'La dirección o ubicación es requerida.' })
  address: string;

  @IsString()
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres.' })
  description: string;

  @IsOptional()
  @IsArray()
  images?: Array<string | ReportImageDto>;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
