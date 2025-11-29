import { PrismaService } from "src/infra/postgres/prisma.service";
import { ProfileController } from "./api/profile.controller";
import { ProfileRepository } from "./repository/profile.repository";
import { ProfileService } from "./service/profile.service";
import { RedisModule } from "src/infra/redis/redis.module";
import { JwtModule } from "@nestjs/jwt";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    RedisModule, // ICache provider
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    ProfileRepository,
    PrismaService,
    // {
    //   provide: 'ICache', // Token to match interface injection
    //   useClass: RedisService, // Concrete class
    // },
    // EmailService,
    // MFAService,
    // GoogleOauthService
  ],
  exports: [ProfileService],
})
export class ProfileModule {}
