import { Controller, Get, UseGuards } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('debts')
@UseGuards(FirebaseAuthGuard)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get('me')
  getMyDebts(@CurrentUser('id') userId: string) {
    return this.debtsService.findMyDebts(userId);
  }
}
