import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryHelper {
  static configure() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  static async uploadImage(
    file: Express.Multer.File,
    folder: string,
    options: Record<string, any> = {},
  ): Promise<{
    url: string;
    public_id: string;
    resource_type: string;
    format: string;
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          exif: false,                 // 🔥 REMOVE PHONE INFO
          resource_type: 'image',      // Force image handling
          ...options,                  // Allow overrides
        },
        (err, result) => {
          if (err) return reject(err);
          if (!result)
            return reject(new Error('Cloudinary returned no result'));

          const {
            secure_url,
            public_id,
            resource_type,
            format,
            width,
            height,
          } = result;

          resolve({
            url: secure_url,
            public_id,
            resource_type,
            format,
            width,
            height,
          });
        },
      ).end(file.buffer);
    });
  }

  static async uploadMultiple(
    files: Express.Multer.File[],
    folder: string,
    options: Record<string, any> = {},
  ): Promise<
    {
      url: string;
      public_id: string;
      resource_type: string;
      format: string;
      width: number;
      height: number;
    }[]
  > {
    return Promise.all(
      files.map((file) =>
        CloudinaryHelper.uploadImage(file, folder, options),
      ),
    );
  }
}
