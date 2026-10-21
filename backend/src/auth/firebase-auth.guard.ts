import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  ConflictException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseService } from './firebase.service';
import { UsersService } from '../users/users.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Encabezado de autorización ausente o formato incorrecto (Bearer token requerido).',
      );
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedException('Token de autenticación no proporcionado.');
    }

    const decoded = await this.firebaseService.verifyToken(token);

    const email = decoded.email || `${decoded.uid}@citypay.gob.mx`;

    // Idempotently sync user with PostgreSQL
    try {
      const user = await this.usersService.syncUser({
        firebaseUid: decoded.uid,
        email,
        displayName: decoded.name,
      });

      // Attach validated user (with DB role) to request
      request.user = user;
      request.firebaseToken = decoded;

      return true;
    } catch (err: any) {
      if (err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(
        `Error al sincronizar usuario [UID: ${decoded.uid}] en PostgreSQL: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException(
        'Error al sincronizar el perfil de usuario en la base de datos.',
      );
    }
  }
}

