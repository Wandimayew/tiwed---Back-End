import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  onModuleInit() {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;
    this.client = new Redis({
      host,
      port,
      password,
      lazyConnect: true, // ensures connection on demand
    });

    this.client
      .connect()
      .then(() => this.logger.log(`✅ Connected to Redis at ${host}:${port}`))
      .catch((err) => this.logger.error('❌ Redis connection failed:', err));
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) return this.client.set(key, value, 'EX', ttl);
    return this.client.set(key, value);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.logger.log('🛑 Redis disconnected');
  }
}
