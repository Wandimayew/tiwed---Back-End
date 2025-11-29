import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  ArrayMinSize,
  IsUUID,
} from 'class-validator';
import { Gender, RelationshipIntent } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';

export class CreateProfileDto {
  @IsString()
  displayName: string;

  @IsDateString()
  birthdate: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsArray()
  genderPreferences?: Gender[];

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsArray()
  interests?: string[];

  @IsOptional()
  @IsString()
  work?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsEnum(RelationshipIntent)
  relationshipIntent?: RelationshipIntent;

  @IsOptional()
  @IsNumber()
  distanceMaxKm?: number;

  @IsOptional()
  @IsNumber()
  ageMin: number;

  @IsOptional()
  @IsNumber()
  ageMax: number;

  @IsOptional()
  locationLng: number | null;

  @IsOptional()
  locationLat: number | null;

  @IsOptional()
  @IsString()
  visibility: string = 'public';
}

export class UpdateProfileDto extends PartialType(CreateProfileDto) {}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @IsEnum(Gender, { each: true })
  preferredGenders?: Gender[];

  @IsOptional()
  @IsNumber()
  ageMin?: number;

  @IsOptional()
  @IsNumber()
  ageMax?: number;

  @IsOptional()
  @IsNumber()
  distanceMaxKm?: number;

  @IsOptional()
  additional?: Record<string, any>;
}

export class UploadPhotoDto {
  @IsString()
  fileKey: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  thumbUrl?: string;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class ReorderPhotosDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  photoIds: string[];
}
