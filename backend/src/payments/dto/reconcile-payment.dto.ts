import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class ReconcilePaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'Selecciona el motivo normativo del dictamen de conciliación.' })
  reason: string;

  @IsString()
  @MinLength(6, {
    message: 'Ingresa la clave de rastreo o referencia bancaria verificada (mínimo 6 caracteres).',
  })
  bankReference: string;

  @IsNumber()
  @IsPositive({ message: 'Ingresa el monto real verificado en el estado de cuenta bancario.' })
  verifiedBankAmount: number;

  @IsString()
  @MinLength(5, {
    message: 'Ingresa el folio de póliza, estado de cuenta u oficio de respaldo (mínimo 5 caracteres).',
  })
  evidenceFolio: string;

  @IsString()
  @MinLength(25, {
    message: 'Las observaciones de auditoría deben describir la verificación con al menos 25 caracteres.',
  })
  notes: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
