import {
  Body,
  Get,
  Controller,
  Logger,
  Post,
  Req,
  Patch,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ProfileService } from '../service/profile.service';
import { Public } from 'src/libs/common/decorators/public.decorator';
import { CreateProfileDto, UpdateProfileDto } from '../dtos/profile.dto';
import { ResponseHelper } from 'src/libs/common/utils/response.helper';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('profile')
export class ProfileController {
  private logger = new Logger(ProfileController.name);
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async createProfile(@Body() dto: CreateProfileDto, @Req() req) {
    const userId = req.user?.id;
    const result = await this.profileService.createProfile(userId, dto);
    return ResponseHelper.success(result);
  }

  @Get()
  async getProfile(@Req() req) {
    const userId = req.user?.id;
    const result = await this.profileService.getProfile(userId);
    return ResponseHelper.success(result);
  }

  @Patch()
  async updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    const userId = req.user?.id;
    const result = await this.profileService.updateProfile(userId, dto);
    return ResponseHelper.success(result);
  }

  // ---------------- UPLOAD MULTIPLE PHOTOS ----------------
  @Post('upload-photos')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadPhotos(
    @Req() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = req.user?.id;

    const result = await this.profileService.uploadUserPhotos(
      userId,
      files,
    );

    return ResponseHelper.success(result);
  }
  // ---------------- SET PRIMARY ----------------
  @Post('set-primary')
  async setPrimaryPhoto(@Req() req, @Body() payload: any) {
    const userId = req.user?.id;
    const result = await this.profileService.setPrimaryPhoto(userId, payload.photoId);
    return ResponseHelper.success(result, `Photo with id ${payload.photoId} set primary.`);
  }
}
