import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { MunicipalService } from '../services/entities/municipal-service.entity';
import { Debt } from '../debts/entities/debt.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CitizenReport } from '../reports/entities/report.entity';
import { ReportImage } from '../reports/entities/report-image.entity';
import { ReportStatusHistory } from '../reports/entities/report-status-history.entity';
import { InitialSchema1729000000000 } from './migrations/1729000000000-InitialSchema';
import { DatabaseSeederService } from './database-seeder.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        entities: [User, MunicipalService, Debt, Payment, CitizenReport, ReportImage, ReportStatusHistory],
        migrations: [InitialSchema1729000000000],
        migrationsRun: false, // controlled explicitly in seeder
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development' ? ['error', 'warn'] : false,
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      MunicipalService,
      Debt,
      Payment,
      CitizenReport,
      ReportImage,
      ReportStatusHistory,
    ]),
  ],
  providers: [DatabaseSeederService],
  exports: [TypeOrmModule, DatabaseSeederService],
})
export class DatabaseModule {}
