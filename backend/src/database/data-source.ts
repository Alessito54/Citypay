import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { MunicipalService } from '../services/entities/municipal-service.entity';
import { Debt } from '../debts/entities/debt.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CitizenReport } from '../reports/entities/report.entity';
import { ReportImage } from '../reports/entities/report-image.entity';
import { ReportStatusHistory } from '../reports/entities/report-status-history.entity';
import { InitialSchema1729000000000 } from './migrations/1729000000000-InitialSchema';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [User, MunicipalService, Debt, Payment, CitizenReport, ReportImage, ReportStatusHistory],
  migrations: [InitialSchema1729000000000],
  synchronize: false,
  logging: false,
});
