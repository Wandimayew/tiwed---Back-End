import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/postgres/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from '../dtos/profile.dto';
import { RelationshipIntent } from '@prisma/client';

@Injectable()
export class ProfileRepository {
  async findUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
  constructor(private prisma: PrismaService) {}

  async findAllUser() {
    return this.prisma.user.findMany();
  }
  // ------------ PROFILE ------------
  async findByUserId(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId },
      include: { gallery: true },
    });
  }
  async findProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId },
      include: { gallery: true },
    });
  }

  async create(userId: string, dto: CreateProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.userProfile.create({
        data: {
          userId,
          displayName: dto.displayName,
          birthdate: new Date(dto.birthdate),
          gender: dto.gender,
          genderPreferences: dto.genderPreferences,
          about: dto.about,
          interests: dto.interests,
          work: dto.work,
          education: dto.education,
          relationshipIntent: dto.relationshipIntent,
          distanceMaxKm: dto.distanceMaxKm,
          locationLat: dto.locationLat,
          locationLng: dto.locationLng,
          visibility: dto.visibility,
          ageMin: dto.ageMin,
          ageMax: dto.ageMax,
          lastLocationUpdate: new Date(),
          createdAt: new Date(),
        },
        include: {
          user: true, // so we can return updated user info too
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { hasCompletedProfile: true },
      });

      // return the created profile, with user data already included
      return profile;
    });
  }

async update(userId: string, dto: UpdateProfileDto) {
  const { birthdate, ...rest } = dto;

  // Convert birthDate string → Date object (only if provided)
  const formattedBirthDate = birthdate ? new Date(birthdate) : undefined;

  return this.prisma.userProfile.update({
    where: { userId },
    data: {
      ...rest,
      ...(formattedBirthDate && { birthdate: formattedBirthDate }),
    },
  });
}


  // ------------ PHOTOS ------------
  async createPhoto(
    profileId: string,
    data: {
      url: string;
      publicId?: string;
      format?: string;
      width?: number;
      height?: number;
      resourceType?: string;
    },
  ) {
    return this.prisma.userPhoto.create({
      data: {
        profileId,
        ...data,
      },
    });
  }

  async resetPrimaryPhoto(profileId: string) {
    return this.prisma.userPhoto.updateMany({
      where: { profileId },
      data: { isPrimary: false },
    });
  }

  async setPrimaryPhoto(photoId: string) {
    return this.prisma.userPhoto.update({
      where: { id: photoId },
      data: { isPrimary: true },
    });
  }

  async setPrimaryPhotos(profile: any, photoId: string) {
    return await this.prisma.$transaction([
      this.prisma.userPhoto.updateMany({
        where: { profileId: profile.id },
        data: { isPrimary: false },
      }),
      this.prisma.userPhoto.update({
        where: { id: photoId },
        data: { isPrimary: true },
      }),
      this.prisma.userProfile.update({
        where: { id: profile.id },
        data: {
          primaryPhotoId: photoId, // FIXED
        },
      }),
    ]);
  }

  async updateProfilePrimaryPhoto(profileId: string, id: string) {
    return this.prisma.userProfile.update({
      where: { id: profileId },
      data: { primaryPhotoId: id },
    });
  }

  async runTransaction(actions: any[]) {
    console.log('Transaction :: ', actions);

    return this.prisma.$transaction(actions);
  }
}
