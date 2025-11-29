// src/infra/postgres/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { log } from 'console';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: [
        // 'query',
        'info',
        'error',
        'warn',
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🛑 Prisma disconnected');
  }
}
