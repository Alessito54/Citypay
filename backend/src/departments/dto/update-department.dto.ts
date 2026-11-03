import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { DepartmentArea } from '../entities/department.entity';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsEnum(DepartmentArea, { message: 'El área debe ser recaudacion, operacion o control.' })
  area?: DepartmentArea;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceSlugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reportCategories?: string[];

  @IsOptional()
  @IsString()
  headName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo de contacto no es válido.' })
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  office?: string;

  @IsOptional()
  @IsString()
  scheduleLabel?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'El compromiso de atención debe ser de al menos 1 día.' })
  @Max(180, { message: 'El compromiso de atención no puede exceder 180 días.' })
  slaDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignStaffDto {
  @IsUUID('4', { message: 'El identificador del usuario debe ser un UUID válido.' })
  userId: string;
}

export class AssignReportDto {
  @IsUUID('4', { message: 'El identificador del reporte debe ser un UUID válido.' })
  reportId: string;
}
