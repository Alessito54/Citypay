import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  AnalyticsService,
  type InformeGroupBy,
  type InformeType,
} from './analytics.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { DepartmentsService } from '../departments/departments.service';

/**
 * Centro de Informes: aggregated reports for municipal staff. Officials only
 * ever see their own department's figures; supervisors and the admin see all.
 */
@Controller('analytics')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MUNICIPAL_SUPERVISOR, UserRole.MUNICIPAL_OFFICIAL)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  @Get('overview')
  overview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.overview(from || null, to || null);
  }

  @Get('informe')
  async informe(
    @CurrentUser() user: User,
    @Query('type') type: InformeType = 'recaudacion',
    @Query('groupBy') groupBy?: InformeGroupBy,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('department') department?: string,
  ) {
    const scope = await this.resolveScope(user, department);
    return this.analyticsService.build(type, groupBy, from || null, to || null, scope);
  }

  /** Which departments the signed-in account may report on. */
  @Get('scope')
  async scope(@CurrentUser() user: User) {
    const departments = await this.departmentsService.findAll();
    if (user.role === UserRole.MUNICIPAL_OFFICIAL && user.departmentId) {
      const own = departments.filter((d) => d.id === user.departmentId);
      return { global: false, items: own.map((d) => ({ slug: d.slug, name: d.name })) };
    }
    return {
      global: user.role !== UserRole.MUNICIPAL_OFFICIAL,
      items: departments.map((d) => ({ slug: d.slug, name: d.name })),
    };
  }

  /**
   * An official is pinned to their own department, whatever they ask for: the
   * query parameter cannot be used to read another office's figures.
   */
  private async resolveScope(user: User, requested?: string): Promise<string | undefined> {
    if (user.role === UserRole.MUNICIPAL_OFFICIAL) {
      if (!user.departmentId) return undefined;
      const own = await this.departmentsService.findById(user.departmentId);
      return own.slug;
    }
    return requested && requested !== 'all' ? requested : undefined;
  }
}
