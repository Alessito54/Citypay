import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CitizenReport } from './report.entity';

@Entity('report_images')
export class ReportImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => CitizenReport, (report) => report.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: CitizenReport;

  @Column({ name: 'secure_url', type: 'text' })
  secureUrl: string;

  @Column({ name: 'public_id', type: 'varchar', length: 255 })
  publicId: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  format: string | null;

  @Column({ type: 'integer', nullable: true })
  bytes: number | null;

  @Column({ type: 'integer', nullable: true })
  width: number | null;

  @Column({ type: 'integer', nullable: true })
  height: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
