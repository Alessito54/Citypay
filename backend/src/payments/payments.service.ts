import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Debt, DebtStatus } from '../debts/entities/debt.entity';
import { SimulatePaymentDto } from './dto/create-payment.dto';
import { ReconcilePaymentDto } from './dto/reconcile-payment.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly dataSource: DataSource,
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
    serviceSlugs?: string[] | null;
  }): Promise<Payment[]> {
    if (options?.serviceSlugs && options.serviceSlugs.length === 0) {
      return [];
    }

    const query = this.paymentRepository.createQueryBuilder('payment');

    if (options?.serviceSlugs && options.serviceSlugs.length > 0) {
      query.andWhere('payment.service_slug IN (:...serviceSlugs)', {
        serviceSlugs: options.serviceSlugs,
      });
    }

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

    query.orderBy('payment.payment_date', 'DESC').addOrderBy('payment.created_at', 'DESC');
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
    const bankCode = (dto.bank || 'BBVA').replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase() || 'SPEI';
    const bankRef = dto.bankReference?.trim() || `${bankCode}-${year}-${randomSuffix}`;
    const paymentDate = now.toISOString().split('T')[0]!;

    return this.dataSource.transaction(async (manager) => {
      if (dto.debtId) {
        const debt = await manager.findOne(Debt, { where: { id: dto.debtId, userId: user.id } });
        if (debt) {
          debt.status = DebtStatus.PAID;
          await manager.save(Debt, debt);
        }
      }

      const payment = manager.create(Payment, {
        folio,
        bankReference: bankRef,
        concept: dto.concept,
        serviceSlug: dto.serviceSlug,
        paymentDate,
        systemAmount: dto.amount,
        bankAmount: dto.amount,
        status: PaymentStatus.CONCILIADO,
        citizenName: user.displayName || user.email,
        paymentMethod: dto.paymentMethod || 'Tarjeta / Pago en línea',
        bank: dto.bank || 'BBVA México',
        userId: user.id,
        debtId: dto.debtId || null,
        isSimulated: false,
      });

      return manager.save(Payment, payment);
    });
  }

  async reconcilePayment(
    id: string,
    dto: ReconcilePaymentDto,
    reconciledBy: User,
  ): Promise<Payment> {
    const payment = await this.findById(id);

    payment.status = PaymentStatus.CONCILIADO;
    payment.bankReference = dto.bankReference.trim().toUpperCase();
    payment.bankAmount = dto.verifiedBankAmount;
    payment.reconciledAt = new Date();
    payment.reconciledById = reconciledBy.id;
    payment.reconciliationReason = `${dto.reason} [Póliza: ${dto.evidenceFolio.trim().toUpperCase()}]`;
    const receiptLine = dto.receiptUrl ? `\nComprobante: ${dto.receiptUrl}` : '';
    payment.reconciliationNotes = `${dto.notes.trim()}${receiptLine}`;

    return this.paymentRepository.save(payment);
  }
}
