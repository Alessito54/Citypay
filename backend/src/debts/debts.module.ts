import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Debt } from './entities/debt.entity';
import { DebtsService } from './debts.service';
import { DebtsController } from './debts.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Debt]), AuthModule, UsersModule],
  providers: [DebtsService],
  controllers: [DebtsController],
  exports: [DebtsService],
})
export class DebtsModule {}
