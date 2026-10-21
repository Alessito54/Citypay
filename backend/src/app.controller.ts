import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getInfo() {
    return {
      name: 'CityPay API',
      version: '1.0.0',
      description: 'API del backend municipal e integración cloud',
      endpoints: {
        health: '/health',
        documentation: '/api/docs',
        services: '/services',
        reports: '/reports',
        payments: '/payments',
        debts: '/debts',
        users: '/users',
        uploads: '/uploads',
      },
    };
  }
}
