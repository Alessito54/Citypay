import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MunicipalService } from '../services/entities/municipal-service.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { CitizenReport, ReportPriority, ReportStatus } from '../reports/entities/report.entity';
import { Debt, DebtStatus } from '../debts/entities/debt.entity';

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

    const userRepo = this.dataSource.getRepository(User);
    const serviceRepo = this.dataSource.getRepository(MunicipalService);
    const paymentRepo = this.dataSource.getRepository(Payment);
    const debtRepo = this.dataSource.getRepository(Debt);
    const reportRepo = this.dataSource.getRepository(CitizenReport);

    await this.dataSource.transaction(async (manager) => {
      // 1. Municipal services
      let services = await serviceRepo.find();
      if (services.length === 0) {
        services = await manager.save(MunicipalService, [
          {
            slug: 'predial',
            name: 'Impuesto Predial',
            description: 'Pago y regularización de predial urbano y rústico',
            icon: 'home',
            isActive: true,
          },
          {
            slug: 'agua',
            name: 'Agua Potable y Alcantarillado',
            description: 'Pago mensual de suministro de agua potable y saneamiento',
            icon: 'droplet',
            isActive: true,
          },
          {
            slug: 'multas',
            name: 'Infracciones y Multas Viales',
            description: 'Consulta y pago de multas de tránsito y vialidad municipal',
            icon: 'alert-circle',
            isActive: true,
          },
        ]);
      }

      // 2. Admin User
      let adminUser = await userRepo.findOne({ where: { email: 'admin@citypay.gob.mx' } });
      if (!adminUser) {
        adminUser = await manager.save(User, {
          firebaseUid: 'system_admin_seed_uid',
          email: 'admin@citypay.gob.mx',
          displayName: 'Administrador Municipal',
          role: UserRole.ADMIN,
          phone: '555-010-0001',
        });
      }

      // 3. Demo Citizen User (Carlos Ramírez Vega)
      let demoUser = await userRepo.findOne({
        where: [{ email: 'demo@citypay.gob.mx' }, { email: 'ciudadano@citypay.gob.mx' }],
      });

      if (!demoUser) {
        demoUser = await manager.save(User, {
          firebaseUid: 'citizen_demo_seed_uid',
          email: 'demo@citypay.gob.mx',
          displayName: 'Carlos Ramírez Vega',
          role: UserRole.CITIZEN,
          phone: '555-019-8471',
        });
      }

      // Also ensure ciudadano@citypay.gob.mx exists as an alias for compatibility
      let aliasUser = await userRepo.findOne({ where: { email: 'ciudadano@citypay.gob.mx' } });
      if (!aliasUser) {
        aliasUser = await manager.save(User, {
          firebaseUid: 'citizen_alias_seed_uid',
          email: 'ciudadano@citypay.gob.mx',
          displayName: 'Carlos Ramírez Vega',
          role: UserRole.CITIZEN,
          phone: '555-019-8471',
        });
      }

      // 4. Seed Debts for Demo Citizen User
      const demoDebtsCount = await debtRepo.count({ where: { userId: demoUser.id } });
      if (demoDebtsCount === 0) {
        const predialService = services.find((s) => s.slug === 'predial');
        const aguaService = services.find((s) => s.slug === 'agua');
        if (predialService && aguaService) {
          await manager.save(Debt, [
            {
              folio: 'DB-2026-00412',
              concept: 'Impuesto Predial — 4to Bimestre 2026',
              amount: 6340.0,
              dueDate: '2026-11-30',
              status: DebtStatus.PENDING,
              serviceId: predialService.id,
              userId: demoUser.id,
            },
            {
              folio: 'DB-2026-00891',
              concept: 'Agua Potable — Consumo Octubre 2026',
              amount: 420.0,
              dueDate: '2026-11-15',
              status: DebtStatus.PENDING,
              serviceId: aguaService.id,
              userId: demoUser.id,
            },
          ]);
        }
      }

      // 5. Seed Payments if empty
      const paymentCount = await paymentRepo.count();
      if (paymentCount === 0) {
        await manager.save(Payment, [
          // Payments belonging to Demo User Carlos
          {
            folio: 'OP-2024-08471',
            bankReference: 'BBVA-2024-00932',
            concept: 'Pago de Predial — 3er Bimestre',
            serviceSlug: 'predial',
            paymentDate: '2024-09-28',
            systemAmount: 4820.5,
            bankAmount: 4820.5,
            status: PaymentStatus.CONCILIADO,
            citizenName: 'Carlos Ramírez Vega',
            paymentMethod: 'Transferencia SPEI',
            bank: 'BBVA México',
            isSimulated: true,
            userId: demoUser.id,
          },
          {
            folio: 'OP-2024-08473',
            bankReference: 'HSBC-2024-05517',
            concept: 'Multa por Infracción Vial — Folio V-3829',
            serviceSlug: 'multas',
            paymentDate: '2024-09-28',
            systemAmount: 2080.0,
            bankAmount: 2080.0,
            status: PaymentStatus.CONCILIADO,
            citizenName: 'Carlos Ramírez Vega',
            paymentMethod: 'Pago en Ventanilla',
            bank: 'HSBC',
            isSimulated: true,
            userId: demoUser.id,
          },
          {
            folio: 'OP-2024-08475',
            bankReference: 'BNM-2024-88341',
            concept: 'Pago de Agua — Septiembre 2024',
            serviceSlug: 'agua',
            paymentDate: '2024-09-27',
            systemAmount: 890.0,
            bankAmount: 940.0,
            status: PaymentStatus.DISCREPANCIA,
            citizenName: 'Carlos Ramírez Vega',
            paymentMethod: 'Transferencia SPEI',
            bank: 'Banamex',
            isSimulated: true,
            userId: demoUser.id,
          },
          // General Municipal Payments from other citizens (for Admin reconciliation overview)
          {
            folio: 'OP-2024-08472',
            bankReference: 'SANT-2024-11204',
            concept: 'Pago de Agua — Agosto 2024',
            serviceSlug: 'agua',
            paymentDate: '2024-09-28',
            systemAmount: 1250.0,
            bankAmount: 1175.0,
            status: PaymentStatus.DISCREPANCIA,
            citizenName: 'María Elena Ávila Torres',
            paymentMethod: 'Tarjeta de Débito',
            bank: 'Santander',
            isSimulated: true,
          },
          {
            folio: 'OP-2024-08474',
            bankReference: '—',
            concept: 'Pago de Predial — 4to Bimestre',
            serviceSlug: 'predial',
            paymentDate: '2024-09-28',
            systemAmount: 6340.0,
            bankAmount: 0.0,
            status: PaymentStatus.PENDIENTE,
            citizenName: 'Ana Sofía Guerrero',
            paymentMethod: 'CoDi / QR',
            bank: 'Banamex',
            isSimulated: true,
          },
          {
            folio: 'OP-2024-08476',
            bankReference: 'BBVA-2024-00944',
            concept: 'Multa Administrativa — Uso de Suelo',
            serviceSlug: 'multas',
            paymentDate: '2024-09-27',
            systemAmount: 15600.0,
            bankAmount: 15600.0,
            status: PaymentStatus.CONCILIADO,
            citizenName: 'Constructora Altamira S.A.',
            paymentMethod: 'Transferencia SPEI',
            bank: 'BBVA México',
            isSimulated: true,
          },
          {
            folio: 'OP-2024-08477',
            bankReference: 'INTR-2024-22901',
            concept: 'Pago de Predial — 1er Bimestre (rezago)',
            serviceSlug: 'predial',
            paymentDate: '2024-09-27',
            systemAmount: 3190.0,
            bankAmount: 3190.0,
            status: PaymentStatus.CONCILIADO,
            citizenName: 'Guadalupe Moreno Ibáñez',
            paymentMethod: 'Tarjeta de Crédito',
            bank: 'Inbursa',
            isSimulated: true,
          },
          {
            folio: 'OP-2024-08478',
            bankReference: '—',
            concept: 'Pago de Agua — Julio 2024',
            serviceSlug: 'agua',
            paymentDate: '2024-09-26',
            systemAmount: 420.0,
            bankAmount: 0.0,
            status: PaymentStatus.PENDIENTE,
            citizenName: 'Javier Escobar Ríos',
            paymentMethod: 'CoDi / QR',
            bank: 'Scotiabank',
            isSimulated: true,
          },
        ]);
      }

      // 6. Seed Citizen Reports if empty
      const reportCount = await reportRepo.count();
      if (reportCount === 0) {
        await manager.save(CitizenReport, [
          {
            title: 'Lámpara apagada',
            address: 'Av. Independencia #4392',
            date: '12 may 2026',
            status: ReportStatus.NUEVO,
            category: 'Alumbrado público',
            priority: ReportPriority.MEDIA,
            icon: '💡',
            description: 'Luminaria intermitente que no enciende por las noches, generando zona oscura.',
            userId: demoUser.id,
          },
          {
            title: 'Bache en la calle',
            address: 'Calle Morelos',
            date: '11 may 2026',
            status: ReportStatus.EN_PROCESO,
            category: 'Vialidad',
            priority: ReportPriority.ALTA,
            icon: '🚧',
            description: 'Bache de profundidad considerable en el carril derecho.',
            userId: demoUser.id,
          },
          {
            title: 'Fuga de agua',
            address: 'Calle Hidalgo #56',
            date: '09 may 2026',
            status: ReportStatus.EN_PROCESO,
            category: 'Agua',
            priority: ReportPriority.ALTA,
            icon: '💧',
            description: 'Fuga potable en la banqueta con pérdida continua de presión.',
            userId: demoUser.id,
          },
          {
            title: 'Juego dañado',
            address: 'Parque Central',
            date: '08 may 2026',
            status: ReportStatus.RESUELTO,
            category: 'Parques y jardines',
            priority: ReportPriority.BAJA,
            icon: '🛝',
            description: 'Columpio con cadena rota reparado exitosamente.',
            userId: demoUser.id,
          },
          // Report from another citizen
          {
            title: 'Contenedor lleno',
            address: 'Av. Juárez #128',
            date: '10 may 2026',
            status: ReportStatus.ASIGNADO,
            category: 'Limpieza y residuos',
            priority: ReportPriority.MEDIA,
            icon: '🗑️',
            description: 'El contenedor comunitario se desborda desde hace 3 días.',
          },
        ]);
      }
    });

    this.logger.log('Database seeded and verified successfully.');
  }
}
