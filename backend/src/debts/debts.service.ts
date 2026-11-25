import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debt, DebtStatus } from './entities/debt.entity';
import { MunicipalService } from '../services/entities/municipal-service.entity';

export interface CreateCitizenDebtInput {
  serviceSlug: 'predial' | 'agua' | 'multas';
  referenceCode: string;
  concept?: string;
  amount?: number;
}

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Debt)
    private readonly debtRepository: Repository<Debt>,
    @InjectRepository(MunicipalService)
    private readonly serviceRepository: Repository<MunicipalService>,
  ) {}

  async findMyDebts(userId: string): Promise<any[]> {
    let list = await this.debtRepository.find({
      where: { userId },
      relations: { service: true },
      order: { dueDate: 'ASC' },
    });

    // Si es una cuenta ciudadana sin obligaciones vinculadas aún, genera su estado de cuenta base
    if (list.length === 0) {
      await this.seedInitialCitizenDebts(userId);
      list = await this.debtRepository.find({
        where: { userId },
        relations: { service: true },
        order: { dueDate: 'ASC' },
      });
    }

    return list.map((d) => ({
      id: d.id,
      folio: d.folio,
      concept: d.concept,
      amount: Number(d.amount),
      dueDate: d.dueDate,
      status: d.status,
      serviceSlug: (d.service?.slug as 'predial' | 'agua' | 'multas' | undefined) ?? this.inferSlug(d.concept),
      serviceName: d.service?.name ?? 'Servicio Municipal',
    }));
  }

  async linkOrCreateDebt(userId: string, input: CreateCitizenDebtInput) {
    const service = await this.serviceRepository.findOne({ where: { slug: input.serviceSlug } });
    const ref = input.referenceCode.trim().toUpperCase();
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = input.serviceSlug === 'predial' ? 'CAT' : input.serviceSlug === 'agua' ? 'AGU' : 'INF';
    const folio = `${prefix}-2026-${suffix}`;

    const defaultConcept =
      input.serviceSlug === 'predial'
        ? `Impuesto Predial 6to Bimestre — Clave ${ref}`
        : input.serviceSlug === 'agua'
          ? `Servicio de Agua Potable y Drenaje — Contrato ${ref}`
          : `Boleta de Infracción de Tránsito — Folio / Placa ${ref}`;

    const defaultAmount =
      input.serviceSlug === 'predial' ? 1840.0 : input.serviceSlug === 'agua' ? 465.0 : 980.0;

    const due = new Date();
    due.setDate(due.getDate() + 15);

    const created = await this.debtRepository.save(
      this.debtRepository.create({
        folio,
        concept: input.concept?.trim() || defaultConcept,
        amount: input.amount && input.amount > 0 ? input.amount : defaultAmount,
        dueDate: due.toISOString().split('T')[0]!,
        status: DebtStatus.PENDING,
        userId,
        serviceId: service?.id ?? null,
      }),
    );

    return {
      id: created.id,
      folio: created.folio,
      concept: created.concept,
      amount: Number(created.amount),
      dueDate: created.dueDate,
      status: created.status,
      serviceSlug: input.serviceSlug,
      serviceName: service?.name ?? 'Servicio Municipal',
    };
  }

  async findById(id: string): Promise<Debt> {
    const debt = await this.debtRepository.findOne({
      where: { id },
      relations: { service: true },
    });
    if (!debt) throw new NotFoundException('Adeudo no encontrado.');
    return debt;
  }

  private inferSlug(concept: string): 'predial' | 'agua' | 'multas' {
    const lower = concept.toLowerCase();
    if (lower.includes('agua') || lower.includes('drenaje')) return 'agua';
    if (lower.includes('multa') || lower.includes('tránsito') || lower.includes('infracción') || lower.includes('vial')) {
      return 'multas';
    }
    return 'predial';
  }

  private async seedInitialCitizenDebts(userId: string) {
    const services = await this.serviceRepository.find();
    const bySlug = Object.fromEntries(services.map((s) => [s.slug, s.id]));
    const uidTag = userId.replace(/-/g, '').slice(0, 5).toUpperCase();

    const defaults = [
      {
        folio: `PRE-${uidTag}-01`,
        concept: 'Impuesto Predial — Bimestre Actual (Predio Urbano)',
        amount: 1685.5,
        dueDate: '2026-12-15',
        status: DebtStatus.PENDING,
        userId,
        serviceId: bySlug.predial ?? null,
      },
      {
        folio: `AGU-${uidTag}-02`,
        concept: 'Agua Potable y Alcantarillado — Consumo Mensual',
        amount: 390.0,
        dueDate: '2026-11-30',
        status: DebtStatus.PENDING,
        userId,
        serviceId: bySlug.agua ?? null,
      },
      {
        folio: `TRA-${uidTag}-03`,
        concept: 'Infracción de Tránsito — Estacionamiento en zona restringida',
        amount: 868.0,
        dueDate: '2026-11-28',
        status: DebtStatus.OVERDUE,
        userId,
        serviceId: bySlug.multas ?? null,
      },
    ];

    for (const item of defaults) {
      const exists = await this.debtRepository.findOne({ where: { folio: item.folio } });
      if (!exists) {
        await this.debtRepository.save(this.debtRepository.create(item));
      }
    }
  }
}
