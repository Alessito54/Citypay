import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MunicipalService } from '../services/entities/municipal-service.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { CitizenReport, ReportPriority, ReportStatus } from '../reports/entities/report.entity';
import { Debt, DebtStatus } from '../debts/entities/debt.entity';
import { Department, DepartmentArea } from '../departments/entities/department.entity';

/**
 * The municipal structure that administers taxes and services. `serviceSlugs`
 * says which collection each office answers for, `reportCategories` which
 * citizen incidents land in its queue. Categories are kept mutually exclusive
 * so routing a new report is unambiguous.
 */
const DEPARTMENT_SEED: Partial<Department>[] = [
  {
    slug: 'tesoreria',
    name: 'Tesorería Municipal',
    shortName: 'Tesorería',
    description:
      'Concentra los ingresos del municipio, autoriza la conciliación bancaria y consolida los informes de recaudación de todas las áreas.',
    icon: '🏛️',
    area: DepartmentArea.RECAUDACION,
    serviceSlugs: ['predial', 'agua', 'multas'],
    reportCategories: [],
    headName: 'C.P. Alejandra Montes Vidal',
    contactEmail: 'tesoreria@citypay.gob.mx',
    contactPhone: '555-010-2000',
    office: 'Palacio Municipal, planta baja, ventanillas 1 a 6',
    scheduleLabel: 'Lunes a viernes de 8:30 a 15:30 h',
    isConsolidator: true,
    slaDays: 10,
    sortOrder: 1,
  },
  {
    slug: 'catastro',
    name: 'Catastro e Impuesto Predial',
    shortName: 'Catastro',
    description:
      'Mantiene el padrón catastral, determina el valor de los predios y administra la recaudación del impuesto predial.',
    icon: '🏠',
    area: DepartmentArea.RECAUDACION,
    serviceSlugs: ['predial'],
    reportCategories: [],
    headName: 'Arq. Fernando Lizárraga Peña',
    contactEmail: 'catastro@citypay.gob.mx',
    contactPhone: '555-010-2100',
    office: 'Palacio Municipal, primer piso, ala norte',
    scheduleLabel: 'Lunes a viernes de 9:00 a 15:00 h',
    slaDays: 7,
    sortOrder: 2,
  },
  {
    slug: 'agua-potable',
    name: 'Organismo Operador de Agua Potable y Alcantarillado',
    shortName: 'Agua Potable',
    description:
      'Factura y cobra el suministro de agua potable y el saneamiento, y atiende fugas y faltas de servicio en la red.',
    icon: '💧',
    area: DepartmentArea.OPERACION,
    serviceSlugs: ['agua'],
    reportCategories: ['Agua'],
    headName: 'Ing. Mariana Quiroz Esparza',
    contactEmail: 'agua@citypay.gob.mx',
    contactPhone: '555-010-2200',
    office: 'Av. Hidalgo 420, colonia Centro',
    scheduleLabel: 'Atención de fugas 24 h · Ventanilla de 8:00 a 16:00 h',
    slaDays: 2,
    sortOrder: 3,
  },
  {
    slug: 'transito',
    name: 'Tránsito y Vialidad',
    shortName: 'Tránsito',
    description:
      'Emite y cobra las infracciones de tránsito, administra el padrón de multas y resuelve las aclaraciones de los ciudadanos.',
    icon: '🚦',
    area: DepartmentArea.RECAUDACION,
    serviceSlugs: ['multas'],
    reportCategories: [],
    headName: 'Cmdte. Hugo Jaramillo Osuna',
    contactEmail: 'transito@citypay.gob.mx',
    contactPhone: '555-010-2300',
    office: 'Centro de Control Vial, Blvd. Reforma 1800',
    scheduleLabel: 'Lunes a sábado de 8:00 a 18:00 h',
    slaDays: 5,
    sortOrder: 4,
  },
  {
    slug: 'obras-publicas',
    name: 'Obras Públicas e Infraestructura',
    shortName: 'Obras Públicas',
    description:
      'Ejecuta la obra pública financiada con la recaudación municipal y repara el pavimento, banquetas y vialidades reportadas.',
    icon: '🚧',
    area: DepartmentArea.OPERACION,
    serviceSlugs: [],
    reportCategories: ['Vialidad'],
    headName: 'Ing. Rodrigo Villalpando Cruz',
    contactEmail: 'obras@citypay.gob.mx',
    contactPhone: '555-010-2400',
    office: 'Taller municipal, Carretera a Santa Rosa km 3',
    scheduleLabel: 'Lunes a viernes de 7:00 a 15:00 h',
    slaDays: 7,
    sortOrder: 5,
  },
  {
    slug: 'servicios-publicos',
    name: 'Servicios Públicos Municipales',
    shortName: 'Servicios Públicos',
    description:
      'Atiende alumbrado público, recolección de residuos, parques y jardines, financiados con los impuestos y derechos municipales.',
    icon: '💡',
    area: DepartmentArea.OPERACION,
    serviceSlugs: [],
    reportCategories: ['Alumbrado público', 'Limpieza y residuos', 'Parques y jardines'],
    headName: 'Lic. Norma Beltrán Aguirre',
    contactEmail: 'servicios@citypay.gob.mx',
    contactPhone: '555-010-2500',
    office: 'Centro de Servicios, Calle Allende 77',
    scheduleLabel: 'Lunes a domingo de 6:00 a 20:00 h',
    slaDays: 3,
    sortOrder: 6,
  },
  {
    slug: 'contraloria',
    name: 'Contraloría y Fiscalización',
    shortName: 'Contraloría',
    description:
      'Audita la recaudación y la conciliación bancaria, da seguimiento a las aclaraciones forzadas y vigila el desempeño de cada área.',
    icon: '🔍',
    area: DepartmentArea.CONTROL,
    serviceSlugs: [],
    reportCategories: [],
    headName: 'Mtra. Silvia Robledo Cantú',
    contactEmail: 'contraloria@citypay.gob.mx',
    contactPhone: '555-010-2600',
    office: 'Palacio Municipal, segundo piso',
    scheduleLabel: 'Lunes a viernes de 9:00 a 17:00 h',
    slaDays: 15,
    sortOrder: 7,
  },
];

/** Staff accounts so every operating queue has a visible owner. */
const STAFF_SEED: {
  email: string;
  firebaseUid: string;
  displayName: string;
  role: UserRole;
  phone: string;
  departmentSlug: string;
}[] = [
  {
    email: 'funcionario@citypay.gob.mx',
    firebaseUid: 'municipal_official_seed_uid',
    displayName: 'Luis Ángel Cordero Fuentes',
    role: UserRole.MUNICIPAL_OFFICIAL,
    phone: '555-031-7742',
    departmentSlug: 'servicios-publicos',
  },
  {
    email: 'supervisor@citypay.gob.mx',
    firebaseUid: 'municipal_supervisor_seed_uid',
    displayName: 'Patricia Núñez Rangel',
    role: UserRole.MUNICIPAL_SUPERVISOR,
    phone: '555-031-7743',
    departmentSlug: 'obras-publicas',
  },
  {
    email: 'tesoreria@citypay.gob.mx',
    firebaseUid: 'treasury_official_seed_uid',
    displayName: 'Ricardo Salinas Mejía',
    role: UserRole.MUNICIPAL_OFFICIAL,
    phone: '555-031-7744',
    departmentSlug: 'tesoreria',
  },
];

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
    const departmentRepo = this.dataSource.getRepository(Department);

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

      // 1b. Municipal departments that administer the taxes and services
      let departments = await departmentRepo.find();
      if (departments.length === 0) {
        departments = await manager.save(Department, DEPARTMENT_SEED);
      }
      const deptBySlug = new Map(departments.map((d) => [d.slug, d]));

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

      // 3b. Municipal staff, one per operating office, so the department
      // screens have a real team and a real owner for each queue.
      for (const staff of STAFF_SEED) {
        const existing = await userRepo.findOne({ where: { email: staff.email } });
        const department = deptBySlug.get(staff.departmentSlug);
        if (!existing) {
          await manager.save(User, {
            firebaseUid: staff.firebaseUid,
            email: staff.email,
            displayName: staff.displayName,
            role: staff.role,
            phone: staff.phone,
            departmentId: department?.id || null,
          });
        } else if (!existing.departmentId && department) {
          existing.departmentId = department.id;
          await manager.save(User, existing);
        }
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
      // 7. Route every report with no department to the office that owns its
      // category. Runs on each boot so historical records never stay orphaned.
      for (const department of departments) {
        const categories = department.reportCategories || [];
        if (categories.length === 0) continue;
        await manager.query(
          `UPDATE "citizen_reports"
              SET "department_id" = $1
            WHERE "department_id" IS NULL
              AND "category" = ANY($2)`,
          [department.id, categories],
        );
      }
    });

    this.logger.log('Database seeded and verified successfully.');
  }
}
