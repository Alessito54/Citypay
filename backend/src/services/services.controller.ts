import { Controller, Get, Param } from '@nestjs/common';
import { MunicipalServicesService } from './services.service';
import { Public } from '../auth/public.decorator';

@Controller('services')
export class MunicipalServicesController {
  constructor(private readonly servicesService: MunicipalServicesService) {}

  @Public()
  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.servicesService.findBySlug(slug);
  }
}
