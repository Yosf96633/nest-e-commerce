/// <reference types="multer" />
// cloudinary/cloudinary.service.ts
import { Inject, Injectable } from '@nestjs/common';
import {
  v2 as Cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';
import {CLOUDINARY} from './cloudinary.provider'
@Injectable()
export class CloudinaryService {

  constructor(@Inject(CLOUDINARY) private readonly cloudinary: typeof Cloudinary) {}

  async uploadImage(
    file: Express.Multer.File,
    folder = 'e-com',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { folder },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) return reject(error);
          if (!result)
            return reject(
              new Error('Cloudinary upload failed: no result returned'),
            );
          resolve(result); // now narrowed to just UploadApiResponse, no undefined
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
