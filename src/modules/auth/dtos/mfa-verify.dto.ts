import { IsNotEmpty } from 'class-validator';

export class MFAVerifyDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  code: string;
}
