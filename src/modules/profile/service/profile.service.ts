import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateProfileDto, UpdateProfileDto } from '../dtos/profile.dto';
import { ProfileRepository } from '../repository/profile.repository';
import { CloudinaryHelper } from 'src/libs/common/helper/cloudinary.helper';

@Injectable()
export class ProfileService {
  constructor(private repo: ProfileRepository) {
    CloudinaryHelper.configure();
  }

  // ---------------- CREATE ----------------
  async createProfile(userId: string, dto: CreateProfileDto) {
    console.log('user Id :: ', userId);

    const userExists = await this.repo.findUserById(userId);
    if (!userExists) {
      throw new BadRequestException('user does not exists');
    }
    const existing = await this.repo.findByUserId(userId);
    if (existing) {
      throw new BadRequestException('Profile already exists');
    }

    return this.repo.create(userId, dto);
  }

  async findAllUser() {
    return this.repo.findAllUser();
  }
  // ---------------- GET ----------------
  async getProfile(userId: string) {
    return this.repo.findProfile(userId);
  }

  // ---------------- UPDATE ----------------
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.repo.update(userId, dto);
  }

  // ---------------- UPLOAD MULTIPLE PHOTOS ----------------
  async uploadUserPhotos(userId: string, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const profile = await this.repo.findByUserId(userId);
    if (!profile) throw new BadRequestException('Create profile first');

    // Auto-generate folder per user
    const folder = `tiwed/profiles/${userId}`;

    // Upload to Cloudinary with metadata disabled
    const uploaded = await CloudinaryHelper.uploadMultiple(files, folder, {
      exif: false,
    });

    // Save uploaded photos metadata
    const createdPhotos = await Promise.all(
      uploaded.map((photo) =>
        this.repo.createPhoto(profile.id, {
          url: photo.url,
          publicId: photo.public_id,
          format: photo.format,
          width: photo.width,
          height: photo.height,
          resourceType: photo.resource_type,
        }),
      ),
    );

    return createdPhotos;
  }

  // ---------------- SET PRIMARY ----------------
  async setPrimaryPhoto(userId: string, photoId: any) {
    const profile = await this.repo.findByUserId(userId);
    console.log('Profile :: ', profile);
    console.log('Photo Id : ', photoId.photoId);

    if (!profile) throw new BadRequestException('Profile not found');

    const photo = profile.gallery.find((p) => p.id === photoId.photoId);
    console.log('photo ::: ', photo);

    if (!photo) {
      throw new BadRequestException('Photo does not belong to user');
    }

    const result = await this.repo.setPrimaryPhotos(profile, photoId.photoId);
    return result[1];
  }
}
