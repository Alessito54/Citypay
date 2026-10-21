import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CitizenReport } from './report.entity';
import { User } from '../../users/entities/user.entity';

@Entity('report_status_history')
export class ReportStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => CitizenReport, (report) => report.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: CitizenReport;

  @Column({ name: 'changed_by_id', type: 'uuid' })
  changedById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy: User;

  @Column({ name: 'previous_status', type: 'varchar', length: 50 })
  previousStatus: string;

  @Column({ name: 'new_status', type: 'varchar', length: 50 })
  newStatus: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
