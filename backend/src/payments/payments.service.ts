import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { SimulatePaymentDto } from './dto/create-payment.dto';
import { ReconcilePaymentDto } from './dto/reconcile-payment.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async findMyPayments(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { paymentDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findAll(options?: {
    status?: PaymentStatus;
    search?: string;
  }): Promise<Payment[]> {
    const query = this.paymentRepository.createQueryBuilder('payment');

    if (options?.status) {
      query.andWhere('payment.status = :status', { status: options.status });
    }

    if (options?.search) {
      const term = `%${options.search.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(payment.folio) LIKE :term OR LOWER(payment.concept) LIKE :term OR LOWER(payment.citizen_name) LIKE :term OR LOWER(payment.bank) LIKE :term OR LOWER(payment.bank_reference) LIKE :term)',
        { term },
      );
    }

    query.orderBy('payment.payment_date', 'DESC');
    return query.getMany();
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: { reconciledBy: true },
    });
    if (!payment) throw new NotFoundException('Pago o transacción no encontrada.');
    return payment;
  }

  async simulatePayment(dto: SimulatePaymentDto, user: User): Promise<Payment> {
    const now = new Date();
    const year = now.getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const folio = `OP-${year}-${randomSuffix}`;
    const bankRef = `${dto.bank?.substring(0, 4).toUpperCase() || 'SIM'}-${year}-${randomSuffix}`;
    const paymentDate = now.toISOString().split('T')[0]!;

    const payment = this.paymentRepository.create({
      folio,
      bankReference: bankRef,
      concept: dto.concept,
      serviceSlug: dto.serviceSlug,
      paymentDate,
      systemAmount: dto.amount,
      bankAmount: dto.amount, // simulated match
      status: PaymentStatus.CONCILIADO,
      citizenName: user.displayName || user.email,
      paymentMethod: dto.paymentMethod || 'Transferencia SPEI',
      bank: dto.bank || 'BBVA México',
      userId: user.id,
      debtId: dto.debtId || null,
      isSimulated: true,
    });

    return this.paymentRepository.save(payment);
  }

  async reconcilePayment(
    id: string,
    dto: ReconcilePaymentDto,
    reconciledBy: User,
  ): Promise<Payment> {
    const payment = await this.findById(id);

    payment.status = PaymentStatus.CONCILIADO;
    payment.bankAmount = payment.systemAmount; // Reconcile amount difference
    payment.reconciledAt = new Date();
    payment.reconciledById = reconciledBy.id;
    payment.reconciliationReason = dto.reason;
    payment.reconciliationNotes = dto.notes || null;

    return this.paymentRepository.save(payment);
  }
  async findByUser(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { paymentDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async getAnalytics(): Promise<{
    totalSistema: number;
    totalBanco: number;
    cuadrados: number;
    discrepancias: number;
    pendientes: number;
    totalCount: number;
  }> {
    const payments = await this.paymentRepository.find();
    const totalSistema = payments.reduce((sum, p) => sum + Number(p.systemAmount), 0);
    const totalBanco = payments.reduce((sum, p) => sum + Number(p.bankAmount), 0);
    const cuadrados = payments.filter((p) => p.status === PaymentStatus.CONCILIADO).length;
    const discrepancias = payments.filter((p) => p.status === PaymentStatus.DISCREPANCIA).length;
    const pendientes = payments.filter((p) => p.status === PaymentStatus.PENDIENTE).length;

    return {
      totalSistema,
      totalBanco,
      cuadrados,
      discrepancias,
      pendientes,
      totalCount: payments.length,
    };
  }
}
