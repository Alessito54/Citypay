import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME') || 'zqu7gzrq',
      api_key: this.config.get<string>('CLOUDINARY_API_KEY') || '273723344882332',
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET') || 'tF4rAIqAIUE87E6kL_N2_lckhT4',
      secure: true,
    });
    this.logger.log('Cloudinary service initialized successfully.');
  }

  /**
   * Generates a signed upload signature for direct secure client uploads
   */
  generateUploadSignature(customFolder?: string) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = customFolder || this.config.get<string>('CLOUDINARY_FOLDER') || 'citypay/reports';
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET') || 'tF4rAIqAIUE87E6kL_N2_lckhT4';
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY') || '273723344882332';
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME') || 'zqu7gzrq';

    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      signature,
      timestamp,
      folder,
      apiKey,
      cloudName,
    };
  }

  /**
   * Uploads an image from base64/data URI string with validation
   */
  async uploadImage(
    fileDataUri: string,
    customFolder?: string,
  ): Promise<{
    secureUrl: string;
    publicId: string;
    format: string;
    bytes: number;
    width: number;
    height: number;
  }> {
    if (!fileDataUri || typeof fileDataUri !== 'string') {
      throw new BadRequestException('Formato de imagen inválido.');
    }

    // Size limit check (approx 10 MB base64 is ~13.3 MB string length)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    const approximateBytes = Math.round((fileDataUri.length * 3) / 4);
    if (approximateBytes > MAX_SIZE_BYTES) {
      throw new BadRequestException('La imagen excede el tamaño máximo permitido de 10 MB.');
    }

    const folder = customFolder || this.config.get<string>('CLOUDINARY_FOLDER') || 'citypay/reports';

    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(fileDataUri, {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });

      return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      };
    } catch (err: any) {
      this.logger.error(`Cloudinary upload failed: ${err.message}`, err.stack);
      throw new InternalServerErrorException(
        `Error al subir imagen a Cloudinary: ${err.message || 'Fallo desconocido'}`,
      );
    }
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const res = await cloudinary.uploader.destroy(publicId);
      return res.result === 'ok';
    } catch (err: any) {
      this.logger.warn(`Could not delete image ${publicId}: ${err.message}`);
      return false;
    }
  }
}
