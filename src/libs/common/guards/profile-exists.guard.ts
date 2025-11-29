import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/infra/postgres/prisma.service';

@Injectable()
export class ProfileExistsGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new ForbiddenException('Create your profile to continue');
    }

    return true;
  }
}
