import { IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserRoleDto {
  @IsEnum(UserRole, { message: 'El rol proporcionado no es válido.' })
  role: UserRole;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol proporcionado no es válido.' })
  role?: UserRole;

  /**
   * Department the staff account is attached to. `null` (or an empty string)
   * detaches it, which is the only valid value for a citizen account.
   */
  @IsOptional()
  @ValidateIf((_o, value) => value !== null && value !== '')
  @IsUUID('4', { message: 'El departamento seleccionado no es válido.' })
  departmentId?: string | null;
}
