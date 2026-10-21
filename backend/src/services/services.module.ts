import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MunicipalService } from './entities/municipal-service.entity';
import { MunicipalServicesService } from './services.service';
import { MunicipalServicesController } from './services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MunicipalService])],
  providers: [MunicipalServicesService],
  controllers: [MunicipalServicesController],
  exports: [MunicipalServicesService],
})
export class MunicipalServicesModule {}
