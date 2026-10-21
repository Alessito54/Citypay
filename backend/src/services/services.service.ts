import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MunicipalService } from './entities/municipal-service.entity';

@Injectable()
export class MunicipalServicesService {
  constructor(
    @InjectRepository(MunicipalService)
    private readonly serviceRepository: Repository<MunicipalService>,
  ) {}

  async findAll(): Promise<MunicipalService[]> {
    return this.serviceRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<MunicipalService> {
    const service = await this.serviceRepository.findOne({ where: { slug } });
    if (!service) throw new NotFoundException(`Servicio municipal '${slug}' no encontrado.`);
    return service;
  }
}
