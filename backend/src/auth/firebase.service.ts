import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth, DecodedIdToken, UserRecord } from 'firebase-admin/auth';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app!: App;
  private auth!: Auth;
  private hasServiceAccount = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID') || 'citypay-3abfb';
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL')?.trim();
    let privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY')?.trim();

    if (privateKey) {
      if (
        (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))
      ) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const apps = getApps();
    if (apps.length > 0) {
      this.app = apps[0]!;
      this.hasServiceAccount = Boolean(clientEmail && privateKey);
    } else if (clientEmail && privateKey) {
      try {
        this.app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.hasServiceAccount = true;
        this.logger.log(`Firebase Admin initialized with Service Account for project: ${projectId}`);
      } catch (err: any) {
        this.logger.warn(
          `Error al inicializar credenciales de Service Account (${err.message}). Se usará modo de verificación pública por Project ID.`,
        );
        this.app = initializeApp({ projectId });
        this.hasServiceAccount = false;
      }
    } else {
      this.app = initializeApp({
        projectId,
      });
      this.hasServiceAccount = false;
      this.logger.log(`Firebase Admin initialized with project ID: ${projectId} (Modo verificación pública de tokens)`);
    }

    this.auth = getAuth(this.app);
  }

  get isServiceAccountConfigured(): boolean {
    return this.hasServiceAccount;
  }

  async verifyToken(idToken: string, checkRevoked = false): Promise<DecodedIdToken> {
    try {
      // Only verify revocation if service account credentials are available to perform the lookup
      const shouldCheckRevocation = checkRevoked && this.hasServiceAccount;
      return await this.auth.verifyIdToken(idToken, shouldCheckRevocation);
    } catch (err: any) {
      const errCode = err?.code || err?.name || 'unknown';
      this.logger.warn(`Firebase token verification failed [${errCode}]: ${err.message}`);
      throw new UnauthorizedException('Token de autenticación inválido o expirado.');
    }
  }

  async getUser(uid: string): Promise<UserRecord> {
    if (!this.hasServiceAccount) {
      throw new UnauthorizedException(
        'La consulta de usuario Firebase Admin requiere credenciales de Service Account configuradas.',
      );
    }
    return this.auth.getUser(uid);
  }
}

