import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { Department } from './entities/department.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { CitizenReport } from '../reports/entities/report.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Debt } from '../debts/entities/debt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department, User, CitizenReport, Payment, Debt]),
    AuthModule,
    UsersModule,
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
