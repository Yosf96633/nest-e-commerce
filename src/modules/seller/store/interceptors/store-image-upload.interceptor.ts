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

@Injectable()
export class StoreImageUploadInterceptor implements NestInterceptor {
  private readonly multerInterceptor: NestInterceptor;

  constructor(private readonly cloudinaryService: CloudinaryService) {
    const MulterClass = FileFieldsInterceptor(
      [
        { name: 'profileImage', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB limit
        },
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
    // 1. Let multer parse the incoming multipart request
    await this.multerInterceptor.intercept(context, {
      handle: () => of(null),
    });

    const req = context.switchToHttp().getRequest();
    const files = req.files as {
      profileImage?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    };

    // Ensure req.body is initialized
    if (!req.body) {
      req.body = {};
    }

    const uploadPromises: Promise<void>[] = [];

    // 2. Upload profileImage if provided
    if (files?.profileImage?.[0]) {
      uploadPromises.push(
        this.cloudinaryService
          .uploadImage(files.profileImage[0], 'e-com/stores/profiles')
          .then((result) => {
            req.body.profileImageUrl = result.secure_url;
            req.body.profileImagePublicId = result.public_id;
          }),
      );
    }

    // 3. Upload coverImage if provided
    if (files?.coverImage?.[0]) {
      uploadPromises.push(
        this.cloudinaryService
          .uploadImage(files.coverImage[0], 'e-com/stores/covers')
          .then((result) => {
            req.body.coverImageUrl = result.secure_url;
            req.body.coverImagePublicId = result.public_id;
          }),
      );
    }

    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }

    return next.handle();
  }
}
