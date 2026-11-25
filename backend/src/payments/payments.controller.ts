import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
  ForbiddenException,
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
import {
  allowedPaymentServices,
  canReconcilePayment,
  canViewPayments,
  isStaff,
} from '../auth/roles';
import { RealtimeService } from '../realtime/realtime.service';

@Controller('payments')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  @Get('me')
  async getMyPayments(@CurrentUser('id') userId: string) {
    const list = await this.paymentsService.findMyPayments(userId);
    return list.map(this.mapToDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MUNICIPAL_OFFICIAL, UserRole.MUNICIPAL_SUPERVISOR)
  async findAll(
    @CurrentUser() user: User,
    @Query('status') status?: PaymentStatus,
    @Query('q') q?: string,
  ) {
    if (!canViewPayments(user)) {
      throw new ForbiddenException(
        'Tu coordinación municipal no tiene acceso al módulo de pagos y recaudación.',
      );
    }
    const serviceSlugs = allowedPaymentServices(user);
    const list = await this.paymentsService.findAll({ status, search: q, serviceSlugs });
    return list.map(this.mapToDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    const payment = await this.paymentsService.findById(id);
    if (!isStaff(user) && payment.userId !== user.id) {
      throw new NotFoundException('Pago o transacción no encontrada.');
    }
    if (isStaff(user) && !canViewPayments(user)) {
      throw new ForbiddenException('Tu coordinación no consulta pagos bancarios.');
    }
    return this.mapToDto(payment);
  }

  @Post('simulate')
  async simulatePayment(
    @CurrentUser() user: User,
    @Body() dto: SimulatePaymentDto,
  ) {
    const created = await this.paymentsService.simulatePayment(dto, user);
    const mapped = this.mapToDto(created);
    this.realtimeService.emit('payment.created', mapped);
    return mapped;
  }

  @Post(':id/reconcile')
  @Roles(UserRole.ADMIN, UserRole.MUNICIPAL_OFFICIAL, UserRole.MUNICIPAL_SUPERVISOR)
  async reconcilePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: ReconcilePaymentDto,
  ) {
    const payment = await this.paymentsService.findById(id);
    if (!canReconcilePayment(user, payment.serviceSlug)) {
      throw new ForbiddenException(
        'Tu coordinación actual no está facultada para conciliar pagos de este servicio.',
      );
    }
    const reconciled = await this.paymentsService.reconcilePayment(id, dto, user);
    const mapped = this.mapToDto(reconciled);
    this.realtimeService.emit('payment.reconciled', mapped);
    return mapped;
  }

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
