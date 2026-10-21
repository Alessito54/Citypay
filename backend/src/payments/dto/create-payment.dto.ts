import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class SimulatePaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'El concepto de pago es requerido.' })
  concept: string;

  @IsString()
  @IsNotEmpty({ message: 'El servicio es requerido (predial, agua, multas).' })
  serviceSlug: string;

  @IsNumber()
  @IsPositive({ message: 'El monto debe ser mayor a cero.' })
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  bank?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El debtId debe ser un UUID válido.' })
  debtId?: string;
}
