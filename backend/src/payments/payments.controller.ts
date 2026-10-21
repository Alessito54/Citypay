import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { SimulatePaymentDto } from './dto/create-payment.dto';
import { ReconcilePaymentDto } from './dto/reconcile-payment.dto';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@Controller('payments')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('me')
  async getMyPayments(@CurrentUser('id') userId: string) {
    const list = await this.paymentsService.findMyPayments(userId);
    return list.map(this.mapToDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MUNICIPAL_OFFICIAL, UserRole.MUNICIPAL_SUPERVISOR)
  async findAll(
    @Query('status') status?: PaymentStatus,
    @Query('q') q?: string,
  ) {
    const list = await this.paymentsService.findAll({ status, search: q });
    return list.map(this.mapToDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const payment = await this.paymentsService.findById(id);
    return this.mapToDto(payment);
  }

  @Post('simulate')
  async simulatePayment(
    @CurrentUser() user: User,
    @Body() dto: SimulatePaymentDto,
  ) {
    const created = await this.paymentsService.simulatePayment(dto, user);
    return this.mapToDto(created);
  }

  @Post(':id/reconcile')
  @Roles(UserRole.ADMIN, UserRole.MUNICIPAL_OFFICIAL, UserRole.MUNICIPAL_SUPERVISOR)
  async reconcilePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: ReconcilePaymentDto,
  ) {
    const reconciled = await this.paymentsService.reconcilePayment(id, dto, user);
    return this.mapToDto(reconciled);
  }

  /**
   * Transforms Payment entity to the exact shape expected by the frontend mobile interface
   */
  private mapToDto(p: Payment) {
    return {
      id: p.id,
      folio: p.folio,
      referenciaBancaria: p.bankReference,
      concepto: p.concept,
      servicio: p.serviceSlug,
      fecha: p.paymentDate,
      montoSistema: Number(p.systemAmount),
      montoBanco: Number(p.bankAmount),
      estado: p.status,
      ciudadano: p.citizenName,
      metodoPago: p.paymentMethod,
      banco: p.bank,
      isSimulated: p.isSimulated,
      reconciledAt: p.reconciledAt,
      reconciliationReason: p.reconciliationReason,
      reconciliationNotes: p.reconciliationNotes,
    };
  }
}
