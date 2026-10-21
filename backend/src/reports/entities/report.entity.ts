import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ReportImage } from './report-image.entity';
import { ReportStatusHistory } from './report-status-history.entity';

export enum ReportStatus {
  NUEVO = 'Nuevo',
  EN_PROCESO = 'En proceso',
  ASIGNADO = 'Asignado',
  RESUELTO = 'Resuelto',
}

export enum ReportPriority {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
}

@Entity('citizen_reports')
export class CitizenReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 50 })
  date: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.NUEVO,
  })
  status: ReportStatus;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({
    type: 'enum',
    enum: ReportPriority,
    default: ReportPriority.MEDIA,
  })
  priority: ReportPriority;

  @Column({ type: 'varchar', length: 30, default: '📋' })
  icon: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'assigned_to_id', type: 'uuid', nullable: true })
  assignedToId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User | null;

  @OneToMany(() => ReportImage, (image) => image.report, { cascade: true })
  images: ReportImage[];

  @OneToMany(() => ReportStatusHistory, (history) => history.report, { cascade: true })
  history: ReportStatusHistory[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
