import { Module } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { AuthService } from './service/auth.service';
import { UserRepository } from './repository/user.repository';
import { PrismaService } from '../../infra/postgres/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../../infra/redis/redis.module';
import { RedisService } from 'src/infra/redis/redis.service';
import { EmailService } from './service/email.service';
import { MFAService } from './service/mfa.service';
import { GoogleOauthService } from './providers/google-oauth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    RedisModule, // ICache provider
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    PrismaService,
    {
      provide: 'ICache', // Token to match interface injection
      useClass: RedisService, // Concrete class
    },
    EmailService,
    MFAService,
    GoogleOauthService
  ],
  exports: [AuthService],
})
export class AuthModule {}
