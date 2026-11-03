import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Functional area a department belongs to. It drives which screens and metrics
 * matter for its staff: a collecting office cares about reconciliation, an
 * operating one about the citizen reports queue, control about oversight.
 */
export enum DepartmentArea {
  RECAUDACION = 'recaudacion',
  OPERACION = 'operacion',
  CONTROL = 'control',
}

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 60, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  /** Short label for chips and tab bars, where the full name does not fit. */
  @Column({ name: 'short_name', type: 'varchar', length: 60 })
  shortName: string;

  @Column({ type: 'text', default: '' })
  description: string;

  /** Emoji, consistent with how municipal services and reports are drawn. */
  @Column({ type: 'varchar', length: 16, default: '🏛️' })
  icon: string;

  @Index()
  @Column({
    name: 'area',
    type: 'enum',
    enum: DepartmentArea,
    default: DepartmentArea.OPERACION,
  })
  area: DepartmentArea;

  /**
   * Slugs of `municipal_services` whose collection this department answers for.
   * Stored as a comma-separated list: the set is tiny and read as a whole.
   */
  @Column({ name: 'service_slugs', type: 'simple-array', default: '' })
  serviceSlugs: string[];

  /** Citizen-report categories routed to this department. */
  @Column({ name: 'report_categories', type: 'simple-array', default: '' })
  reportCategories: string[];

  @Column({ name: 'head_name', type: 'varchar', length: 150, default: '' })
  headName: string;

  @Column({ name: 'contact_email', type: 'varchar', length: 180, default: '' })
  contactEmail: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 50, default: '' })
  contactPhone: string;

  @Column({ type: 'varchar', length: 180, default: '' })
  office: string;

  @Column({ name: 'schedule_label', type: 'varchar', length: 120, default: '' })
  scheduleLabel: string;

  /**
   * True for the consolidating office (Tesorería), which oversees the whole
   * collection rather than a single service. Reports that group figures by
   * department skip it, so revenue is never counted twice.
   */
  @Column({ name: 'is_consolidator', type: 'boolean', default: false })
  isConsolidator: boolean;

  /** Days the department commits to for closing a citizen report. */
  @Column({ name: 'sla_days', type: 'integer', default: 5 })
  slaDays: number;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
