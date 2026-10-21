import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { UploadsController } from './uploads.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, AuthModule, UsersModule],
  providers: [CloudinaryService],
  controllers: [UploadsController],
  exports: [CloudinaryService],
})
export class UploadsModule {}
