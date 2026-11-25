import { IsEnum, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { VALID_DEPARTMENT_SLUGS } from '../../auth/orizaba';

export class UpdateUserRoleDto {
  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol proporcionado no es válido.' })
  role?: UserRole;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsIn(VALID_DEPARTMENT_SLUGS, {
    message: 'El departamento seleccionado no es válido.',
  })
  department?: string | null;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cadastralKey?: string;

  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @IsOptional()
  @IsIn(['Urbano', 'Rústico'])
  propertyType?: 'Urbano' | 'Rústico';

  @IsOptional()
  @IsString()
  waterAccount?: string;

  @IsOptional()
  @IsString()
  vehiclePlates?: string;

  @IsOptional()
  @IsString()
  driverLicense?: string;
}
