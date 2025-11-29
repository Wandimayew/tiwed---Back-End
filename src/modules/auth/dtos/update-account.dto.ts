import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
