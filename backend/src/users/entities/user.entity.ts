import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  CITIZEN = 'citizen',
  MUNICIPAL_OFFICIAL = 'municipal_official',
  ADMIN = 'admin',
  MUNICIPAL_SUPERVISOR = 'municipal_supervisor',
}

export interface MunicipalCitizenData {
  cadastralKey?: string;
  propertyAddress?: string;
  propertyType?: 'Urbano' | 'Rústico';
  waterAccount?: string;
  vehiclePlates?: string;
  driverLicense?: string;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'firebase_uid', type: 'varchar', length: 128, unique: true })
  firebaseUid: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255, default: '' })
  displayName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CITIZEN,
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 64, nullable: true })
  department: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ name: 'municipal_data', type: 'jsonb', nullable: true })
  municipalData: MunicipalCitizenData | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
