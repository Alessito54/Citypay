import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReconcilePaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'Selecciona o indica un motivo de conciliación.' })
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
