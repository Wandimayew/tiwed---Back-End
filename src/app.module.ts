// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { EventBusModule } from './infra/message-broker/event-bus.module';
import { RedisModule } from './infra/redis/redis.module';
import { CloudinaryModule } from './infra/storage/cloudinary.module';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { PrismaService } from './infra/postgres/prisma.service';
import { HttpExceptionFilter } from './libs/common/filters/http-exception.filter';
import { RolesGuard } from './libs/common/guards/roles.guard';
import { ResponseInterceptor } from './libs/common/interceptors/response.interceptor';
import { JwtAuthGuard } from './libs/common/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './infra/redis/redis.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
    }),
    // Infra modules
    RedisModule,
    CloudinaryModule,
    EventBusModule,

    // modules go here

    AuthModule,
    ProfileModule,
  ],
  providers: [
    JwtService,
    PrismaService, // global singleton DB service
    {
      provide: 'ICache', // Token to match interface injection
      useClass: RedisService, // Concrete class
    },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard, // ← second guard
  },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor, // global response formatting
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, // global exception handling
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}
