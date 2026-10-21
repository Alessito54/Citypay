import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { RolesGuard } from './roles.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, forwardRef(() => UsersModule)],
  providers: [FirebaseService, FirebaseAuthGuard, RolesGuard],
  exports: [FirebaseService, FirebaseAuthGuard, RolesGuard],
})
export class AuthModule {}
