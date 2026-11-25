import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { DebtsService } from './debts.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class LinkDebtDto {
  @IsIn(['predial', 'agua', 'multas'])
  serviceSlug: 'predial' | 'agua' | 'multas';

  @IsString()
  @IsNotEmpty({ message: 'Ingresa tu clave catastral, número de contrato o folio de infracción.' })
  referenceCode: string;

  @IsOptional()
  @IsString()
  concept?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}

@Controller('debts')
@UseGuards(FirebaseAuthGuard)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get('me')
  getMyDebts(@CurrentUser('id') userId: string) {
    return this.debtsService.findMyDebts(userId);
  }

  @Post('link')
  linkMyDebt(@CurrentUser('id') userId: string, @Body() dto: LinkDebtDto) {
    return this.debtsService.linkOrCreateDebt(userId, dto);
  }
}
