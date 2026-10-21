import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Debt } from '../../debts/entities/debt.entity';

export enum PaymentStatus {
  CONCILIADO = 'conciliado',
  DISCREPANCIA = 'discrepancia',
  PENDIENTE = 'pendiente',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 60, unique: true })
  folio: string;

  @Column({ name: 'bank_reference', type: 'varchar', length: 100, default: '—' })
  bankReference: string;

  @Column({ type: 'varchar', length: 255 })
  concept: string;

  @Column({ name: 'service_slug', type: 'varchar', length: 50 })
  serviceSlug: string;

  @Column({ name: 'payment_date', type: 'date' })
  paymentDate: string;

  @Column({ name: 'system_amount', type: 'numeric', precision: 12, scale: 2 })
  systemAmount: number;

  @Column({ name: 'bank_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  bankAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDIENTE,
  })
  status: PaymentStatus;

  @Column({ name: 'citizen_name', type: 'varchar', length: 255 })
  citizenName: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 100, default: 'Transferencia SPEI' })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 100, default: 'BBVA México' })
  bank: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'debt_id', type: 'uuid', nullable: true })
  debtId: string | null;

  @ManyToOne(() => Debt, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'debt_id' })
  debt: Debt | null;

  @Column({ name: 'is_simulated', type: 'boolean', default: true })
  isSimulated: boolean;

  @Column({ name: 'reconciled_at', type: 'timestamptz', nullable: true })
  reconciledAt: Date | null;

  @Column({ name: 'reconciled_by_id', type: 'uuid', nullable: true })
  reconciledById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reconciled_by_id' })
  reconciledBy: User | null;

  @Column({ name: 'reconciliation_reason', type: 'varchar', length: 255, nullable: true })
  reconciliationReason: string | null;

  @Column({ name: 'reconciliation_notes', type: 'text', nullable: true })
  reconciliationNotes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
