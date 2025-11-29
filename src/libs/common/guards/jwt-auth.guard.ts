import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { ICache } from 'src/libs/ports/icache.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @Inject('ICache') private cache: ICache,
    private reflector: Reflector, // for combining with RolesGuard if needed
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // skip authentication
    }
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('AUth header :: ', authHeader);

      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];

    console.log('TOKEN is :: ', token);

    try {
      const payload: any = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      console.log('Payload is ::: ', payload);

      // Optional: check Redis blacklist / token invalidation
      const cachedToken = await this.cache.get(payload.userId);
      console.log('Cached token ::: ', cachedToken);

      if (!cachedToken || cachedToken !== token) {
        throw new UnauthorizedException('Token expired or invalidated');
      }
      console.log('Sending to response :: ');

      request['user'] = {
        id: payload.userId,
        role: payload.role,
      };
      console.log('Sending to final :: ');

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
