import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MunicipalService } from '../services/entities/municipal-service.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { CitizenReport, ReportPriority, ReportStatus } from '../reports/entities/report.entity';

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

    const serviceRepo = this.dataSource.getRepository(MunicipalService);
    const count = await serviceRepo.count();
    if (count > 0) {
      this.logger.log('Database already seeded. Skipping initial seed.');
      return;
    }

    this.logger.log('Seeding initial municipal services, default users and demo records...');

    await this.dataSource.transaction(async (manager) => {
      // 1. Municipal services
      const services = await manager.save(MunicipalService, [
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

      // 2. Default Seed Users
      const adminUser = await manager.save(User, {
        firebaseUid: 'system_admin_seed_uid',
        email: 'admin@citypay.gob.mx',
        displayName: 'Administrador Municipal',
        role: UserRole.ADMIN,
      });

      const citizenUser = await manager.save(User, {
        firebaseUid: 'citizen_demo_seed_uid',
        email: 'ciudadano@citypay.gob.mx',
        displayName: 'Carlos Ramírez Vega',
        role: UserRole.CITIZEN,
      });

      // 3. Demo Payments (from mockups)
      await manager.save(Payment, [
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
          userId: citizenUser.id,
        },
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
          folio: 'OP-2024-08473',
          bankReference: 'HSBC-2024-05517',
          concept: 'Multa por Infracción Vial — Folio V-3829',
          serviceSlug: 'multas',
          paymentDate: '2024-09-28',
          systemAmount: 2080.0,
          bankAmount: 2080.0,
          status: PaymentStatus.CONCILIADO,
          citizenName: 'Roberto Fuentes Leal',
          paymentMethod: 'Pago en Ventanilla',
          bank: 'HSBC',
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
          folio: 'OP-2024-08475',
          bankReference: 'BNM-2024-88341',
          concept: 'Pago de Agua — Septiembre 2024',
          serviceSlug: 'agua',
          paymentDate: '2024-09-27',
          systemAmount: 890.0,
          bankAmount: 940.0,
          status: PaymentStatus.DISCREPANCIA,
          citizenName: 'Ernesto Villanueva Cruz',
          paymentMethod: 'Transferencia SPEI',
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

      // 4. Demo Citizen Reports (from mockups)
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
          userId: citizenUser.id,
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
          userId: citizenUser.id,
        },
        {
          title: 'Contenedor lleno',
          address: 'Av. Juárez #128',
          date: '10 may 2026',
          status: ReportStatus.ASIGNADO,
          category: 'Limpieza y residuos',
          priority: ReportPriority.MEDIA,
          icon: '🗑️',
          description: 'El contenedor comunitario se desborda desde hace 3 días.',
          userId: citizenUser.id,
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
          userId: citizenUser.id,
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
          userId: citizenUser.id,
        },
      ]);
    });

    this.logger.log('Database seeded successfully with initial catalog, users, reports, and payments.');
  }
}
