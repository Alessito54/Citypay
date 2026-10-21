import { IsOptional, IsString } from 'class-validator';

export class SignUploadDto {
  @IsOptional()
  @IsString()
  folder?: string;
}

export class UploadImageDto {
  @IsString()
  file: string; // Base64 or Data URI string

  @IsOptional()
  @IsString()
  folder?: string;
}
