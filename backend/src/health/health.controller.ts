import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  async check() {
    let dbStatus = 'ok';
    let latencyMs = 0;

    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      latencyMs = Date.now() - start;
    } catch (err: any) {
      dbStatus = `error: ${err.message}`;
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: dbStatus,
          latencyMs,
          engine: 'PostgreSQL (Neon)',
        },
        auth: {
          provider: 'Firebase Authentication & Admin SDK',
          status: 'ok',
        },
        storage: {
          provider: 'Cloudinary',
          status: 'ok',
        },
      },
    };
  }
}
