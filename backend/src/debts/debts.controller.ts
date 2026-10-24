import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('debts')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get('me')
  getMyDebts(@CurrentUser('id') userId: string) {
    return this.debtsService.findMyDebts(userId);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.MUNICIPAL_OFFICIAL, UserRole.MUNICIPAL_SUPERVISOR)
  getDebtsByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.debtsService.findMyDebts(userId);
  }
}
