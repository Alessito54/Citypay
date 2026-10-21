import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { SignUploadDto, UploadImageDto } from './dto/sign-upload.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('uploads')
@UseGuards(FirebaseAuthGuard)
export class UploadsController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('sign')
  generateSignature(@Body() dto: SignUploadDto) {
    return this.cloudinaryService.generateUploadSignature(dto.folder);
  }

  @Post()
  uploadImage(@Body() dto: UploadImageDto) {
    return this.cloudinaryService.uploadImage(dto.file, dto.folder);
  }
}
