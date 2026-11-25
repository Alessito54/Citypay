import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { UpdateProfileDto, UpdateUserRoleDto } from './dto/update-user.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { canManageStaff } from '../auth/roles';
import { ORIZABA_DEPARTMENTS } from '../auth/orizaba';

@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('departments')
  getDepartments() {
    return ORIZABA_DEPARTMENTS;
  }

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      department: user.department ?? null,
      phone: user.phone,
      municipalData: user.municipalData ?? null,
      createdAt: user.createdAt,
    };
  }

  @Patch('me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  /**
   * En entornos de evaluación / desarrollo (NODE_ENV !== 'production'), permite probar
   * distintos roles y coordinaciones del H. Ayuntamiento de Orizaba desde el propio perfil.
   */
  @Patch('me/role-preview')
  updateMyRolePreview(@CurrentUser('id') userId: string, @Body() dto: UpdateUserRoleDto) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('El cambio rápido de rol de evaluación está deshabilitado en producción.');
    }
    return this.usersService.updateSelfPreviewRole(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() actor: User,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (
      actor.role !== UserRole.ADMIN &&
      actor.role !== UserRole.MUNICIPAL_SUPERVISOR &&
      !canManageStaff(actor)
    ) {
      throw new ForbiddenException(
        'Solo Administración General, Supervisión o Recursos Humanos pueden consultar la plantilla municipal.',
      );
    }
    return this.usersService.findAll(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Patch(':id/role')
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: User,
    @Body() dto: UpdateUserRoleDto,
  ) {
    if (!canManageStaff(actor)) {
      throw new ForbiddenException(
        'Solo Administración General o la Coordinación de Recursos Humanos pueden modificar roles y adscripciones.',
      );
    }
    return this.usersService.updateRoleAndDepartment(id, dto, actor);
  }
}
