import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Observable, of } from 'rxjs';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';
import type { ProductImage } from '../entities/product.entity';

@Injectable()
export class ProductImageUploadInterceptor implements NestInterceptor {
  private readonly multerInterceptor: NestInterceptor;

  constructor(private readonly cloudinaryService: CloudinaryService) {
    const MulterClass = FileFieldsInterceptor(
      [{ name: 'images', maxCount: 10 }],
      {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, callback) => {
          if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/i)) {
            return callback(
              new BadRequestException(
                `Only image files (jpg, jpeg, png, webp) are allowed for ${file.fieldname}`,
              ),
              false,
            );
          }
          callback(null, true);
        },
      },
    );
    this.multerInterceptor = new MulterClass();
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    await this.multerInterceptor.intercept(context, { handle: () => of(null) });

    const request = context.switchToHttp().getRequest();
    const files = request.files as { images?: Express.Multer.File[] };
    request.body ??= {};

    const imageFiles = files?.images ?? [];
    const images: ProductImage[] = await Promise.all(
      imageFiles.map(async (file, index) => {
        const result = await this.cloudinaryService.uploadImage(
          file,
          'e-com/products',
        );
        return {
          url: result.secure_url,
          publicId: result.public_id,
          displayOrder: index,
        };
      }),
    );

    if (imageFiles.length > 0) {
      request.body.images = images;
    }

    return next.handle();
  }
}
