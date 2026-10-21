import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debt, DebtStatus } from './entities/debt.entity';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Debt)
    private readonly debtRepository: Repository<Debt>,
  ) {}

  async findMyDebts(userId: string): Promise<Debt[]> {
    return this.debtRepository.find({
      where: { userId },
      relations: { service: true },
      order: { dueDate: 'ASC' },
    });
  }

  async findById(id: string): Promise<Debt> {
    const debt = await this.debtRepository.findOne({
      where: { id },
      relations: { service: true },
    });
    if (!debt) throw new NotFoundException('Adeudo no encontrado.');
    return debt;
  }
}
