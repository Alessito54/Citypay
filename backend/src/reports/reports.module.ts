import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizenReport } from './entities/report.entity';
import { ReportImage } from './entities/report-image.entity';
import { ReportStatusHistory } from './entities/report-status-history.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CitizenReport, ReportImage, ReportStatusHistory]),
    AuthModule,
    UsersModule,
  ],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
