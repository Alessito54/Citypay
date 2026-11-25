import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MunicipalService } from '../services/entities/municipal-service.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { CitizenReport, ReportPriority, ReportStatus } from '../reports/entities/report.entity';
import { resolveDepartmentForReport } from '../auth/orizaba';

@Injectable()
export class DatabaseSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    try {
      await this.runMigrationsAndSeed();
    } catch (err: any) {
      this.logger.error(`Error during DB initialization/seeding: ${err.message}`, err.stack);
    }
  }

  async runMigrationsAndSeed() {
    this.logger.log('Checking pending migrations...');
    const pending = await this.dataSource.showMigrations();
    if (pending) {
      this.logger.log('Executing pending migrations...');
      await this.dataSource.runMigrations();
      this.logger.log('Migrations executed successfully.');
    }

    // Evolución aditiva del esquema en bases PostgreSQL existentes
    await this.dataSource.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" VARCHAR(64);`,
    );
    await this.dataSource.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "municipal_data" JSONB;`,
    );
    await this.dataSource.query(
      `ALTER TABLE "citizen_reports" ADD COLUMN IF NOT EXISTS "department" VARCHAR(64);`,
    );

    const serviceRepo = this.dataSource.getRepository(MunicipalService);
    const count = await serviceRepo.count();
    if (count === 0) {
      this.logger.log('Seeding initial Orizaba municipal services, users and sample records...');

      await this.dataSource.transaction(async (manager) => {
        await manager.save(MunicipalService, [
          {
            slug: 'predial',
            name: 'Impuesto Predial (Catastro Orizaba)',
            description: 'Pago y regularización de predial urbano y rústico en Orizaba',
            icon: 'home',
            isActive: true,
          },
          {
            slug: 'agua',
            name: 'Agua Potable y Alcantarillado',
            description: 'Suministro mensual de agua potable y drenaje municipal',
            icon: 'droplet',
            isActive: true,
          },
          {
            slug: 'multas',
            name: 'Infracciones de Policía Vial y Tránsito',
            description: 'Consulta y pago de multas de tránsito y movilidad en Orizaba',
            icon: 'alert-circle',
            isActive: true,
          },
        ]);

        await manager.save(User, {
          firebaseUid: 'system_admin_seed_uid',
          email: 'admin@citypay.gob.mx',
          displayName: 'Administrador General Orizaba',
          role: UserRole.ADMIN,
          department: null,
        });

        const citizenUser = await manager.save(User, {
          firebaseUid: 'citizen_demo_seed_uid',
          email: 'ciudadano@citypay.gob.mx',
          displayName: 'Carlos Ramírez Vega',
          role: UserRole.CITIZEN,
          department: null,
        });

        await manager.save(Payment, [
          {
            folio: 'ORZ-2026-08471',
            bankReference: 'BBVA-2026-00932',
            concept: 'Pago de Predial — Col. Centro, Orizaba',
            serviceSlug: 'predial',
            paymentDate: '2026-11-20',
            systemAmount: 4820.5,
            bankAmount: 4820.5,
            status: PaymentStatus.CONCILIADO,
            citizenName: 'Carlos Ramírez Vega',
            paymentMethod: 'Transferencia SPEI',
            bank: 'BBVA México',
            isSimulated: true,
            userId: citizenUser.id,
          },
          {
            folio: 'ORZ-2026-08472',
            bankReference: 'SANT-2026-11204',
            concept: 'Agua Potable — Oriente 6, Orizaba',
            serviceSlug: 'agua',
            paymentDate: '2026-11-21',
            systemAmount: 1250.0,
            bankAmount: 1175.0,
            status: PaymentStatus.DISCREPANCIA,
            citizenName: 'María Elena Ávila Torres',
            paymentMethod: 'Tarjeta de Débito',
            bank: 'Santander',
            isSimulated: true,
          },
          {
            folio: 'ORZ-2026-08473',
            bankReference: 'HSBC-2026-05517',
            concept: 'Multa Policía Vial — Folio PV-3829',
            serviceSlug: 'multas',
            paymentDate: '2026-11-22',
            systemAmount: 2080.0,
            bankAmount: 2080.0,
            status: PaymentStatus.CONCILIADO,
            citizenName: 'Roberto Fuentes Leal',
            paymentMethod: 'Pago en Ventanilla',
            bank: 'HSBC',
            isSimulated: true,
          },
          {
            folio: 'ORZ-2026-08474',
            bankReference: '—',
            concept: 'Pago de Predial — Sur 10, Orizaba',
            serviceSlug: 'predial',
            paymentDate: '2026-11-23',
            systemAmount: 6340.0,
            bankAmount: 0.0,
            status: PaymentStatus.PENDIENTE,
            citizenName: 'Ana Sofía Guerrero',
            paymentMethod: 'CoDi / QR',
            bank: 'Banamex',
            isSimulated: true,
          },
        ]);

        await manager.save(CitizenReport, [
          {
            title: 'Lámpara apagada',
            address: 'Oriente 6 #412, Col. Centro, Orizaba',
            date: '22 nov 2026',
            status: ReportStatus.NUEVO,
            category: 'Alumbrado público',
            department: 'alumbrado',
            priority: ReportPriority.MEDIA,
            icon: '💡',
            latitude: 18.8498,
            longitude: -97.1012,
            description: 'Luminaria frente a la parada de autobús no enciende por las noches.',
            userId: citizenUser.id,
          },
          {
            title: 'Bache en la calle',
            address: 'Sur 10 esquina Poniente 7, Orizaba',
            date: '23 nov 2026',
            status: ReportStatus.EN_PROCESO,
            category: 'Vialidad',
            department: 'obras_publicas',
            priority: ReportPriority.ALTA,
            icon: '🚧',
            latitude: 18.8482,
            longitude: -97.1058,
            description: 'Bache profundo sobre el carril derecho que afecta la circulación.',
            userId: citizenUser.id,
          },
        ]);
      });
    }

    // Ensure Orizaba departmental staff profiles exist idempotently
    await this.seedOrizabaDepartmentAccounts();

    // Backfill department on historical citizen_reports if null
    const reportRepo = this.dataSource.getRepository(CitizenReport);
    const unassigned = await reportRepo
      .createQueryBuilder('r')
      .where('r.department IS NULL')
      .getMany();
    for (const r of unassigned) {
      r.department = resolveDepartmentForReport(r.category, r.title);
      await reportRepo.save(r);
    }
  }

  private async seedOrizabaDepartmentAccounts() {
    const userRepo = this.dataSource.getRepository(User);
    const staffProfiles: Array<{
      uid: string;
      email: string;
      displayName: string;
      role: UserRole;
      department: string | null;
    }> = [
      {
        uid: 'seed_orz_ingresos',
        email: 'ingresos@orizaba.gob.mx',
        displayName: 'Coord. de Ingresos — Tesorería Orizaba',
        role: UserRole.MUNICIPAL_OFFICIAL,
        department: 'ingresos',
      },
      {
        uid: 'seed_orz_egresos',
        email: 'egresos@orizaba.gob.mx',
        displayName: 'Coord. de Egresos — Tesorería Orizaba',
        role: UserRole.MUNICIPAL_OFFICIAL,
        department: 'egresos',
      },
      {
        uid: 'seed_orz_catastro',
        email: 'catastro@orizaba.gob.mx',
        displayName: 'Dirección de Catastro Orizaba',
        role: UserRole.MUNICIPAL_OFFICIAL,
        department: 'catastro',
      },
      {
        uid: 'seed_orz_transito',
        email: 'transito@orizaba.gob.mx',
        displayName: 'Policía Vial y Tránsito Orizaba',
        role: UserRole.MUNICIPAL_OFFICIAL,
        department: 'transito',
      },
      {
        uid: 'seed_orz_agua',
        email: 'agua@orizaba.gob.mx',
        displayName: 'Coord. de Agua Potable Orizaba',
        role: UserRole.MUNICIPAL_OFFICIAL,
        department: 'agua_potable',
      },
      {
        uid: 'seed_orz_obras',
        email: 'obras@orizaba.gob.mx',
        displayName: 'Obras Públicas y Bacheo Orizaba',
        role: UserRole.MUNICIPAL_OFFICIAL,
        department: 'obras_publicas',
      },
      {
        uid: 'seed_orz_rh',
        email: 'rh@orizaba.gob.mx',
        displayName: 'Coord. de Recursos Humanos Orizaba',
        role: UserRole.MUNICIPAL_OFFICIAL,
        department: 'recursos_humanos',
      },
      {
        uid: 'seed_orz_contraloria',
        email: 'contraloria@orizaba.gob.mx',
        displayName: 'Contraloría Municipal Orizaba',
        role: UserRole.MUNICIPAL_SUPERVISOR,
        department: 'contraloria',
      },
    ];

    for (const p of staffProfiles) {
      const exists = await userRepo.findOne({ where: { email: p.email } });
      if (!exists) {
        await userRepo.save(
          userRepo.create({
            firebaseUid: p.uid,
            email: p.email,
            displayName: p.displayName,
            role: p.role,
            department: p.department,
          }),
        );
      }
    }
  }
}
