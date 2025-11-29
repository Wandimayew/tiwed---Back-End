import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/postgres/prisma.service';
import { RegisterDto } from '../dtos/register.dto';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository {

  constructor(private prisma: PrismaService) {}

  async createUser(dto: RegisterDto, hashedPassword: string) {
    return this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash: hashedPassword,
        role: 'USER', // default role
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByProvider(provider: string, providerId: string) {
    return this.prisma.user.findUnique({
      where: { provider_providerId: { provider, providerId } },
    });
  }

  /**
   * Create a new user in the database.
   * @param data The user data to be created.
   * @returns The newly created user.
   */
  async create(data: {
    fullName: string;
    email?: string;
    provider?: string;
    providerId?: string;
    passwordHash?: string;
    isEmailVerified?: boolean;
    role?: string;
    isActive?: boolean;
  }) {
    return this.prisma.user.create({ data });
  }
  async update(id: string, data: Partial<User>) {
    return this.prisma.user.update({ where: { id }, data });
  }

   async save(user: { id: string; email: string | null; phone: string | null; fullName: string; passwordHash: string | null; provider: string; isEmailVerified: boolean; isPhoneVerified: boolean; isActive: boolean; role: string; deletedAt: Date | null; locale: string | null; timezone: string | null; createdAt: Date; lastLoginAt: Date | null; providerId: string | null; mfaEnabled: boolean; mfaSecret: string | null; updatedAt: Date | null; }) {

    // repo.save will insert if id is missing, update if id exists
    return this.prisma.user.update({
      where: { id: user.id },
      data: user
    });
  }
  
}
