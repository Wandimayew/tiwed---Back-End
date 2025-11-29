import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import type { ICache } from 'src/libs/ports/icache.interface';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { MFAVerifyDto } from '../dtos/mfa-verify.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { SocialLoginDto } from '../dtos/social-login.dto';
import { EmailService } from './email.service';
import { MFAService } from './mfa.service';
import { GoogleOauthService } from '../providers/google-oauth.service';
import { UpdateAccountDto } from '../dtos/update-account.dto';

@Injectable()
export class AuthService {
  async updateAccount(userId: any, dto: UpdateAccountDto) {
    try {
      return this.userRepo.update(userId, dto);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
  private logger = new Logger(AuthService.name);
  constructor(
    private userRepo: UserRepository,
    private jwtService: JwtService,
    @Inject('ICache') private cache: ICache, // Redis caching for tokens
    private readonly emailService: EmailService,
    private readonly mfaService: MFAService,
    private readonly google: GoogleOauthService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, password, fullName } = dto;
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new BadRequestException('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.userRepo.create({
      email,
      passwordHash: hashedPassword,
      fullName,
      role: 'USER',
      isEmailVerified: false,
    });

    this.logger.log(`Registered user: ${user.id}`);
    // Generate a verification token (expires in 1 day)
    const emailToken = await this.generateEmailToken(user.id, email);

    // Send email with the token
    await this.emailService.sendEmailVerification(email, emailToken);
    return { message: 'Registered. Check email for verification' };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.passwordHash) throw new UnauthorizedException('Use social login');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified)
      throw new UnauthorizedException('Email not verified');

    if (user.mfaEnabled) return { mfaRequired: true, userId: user.id };

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return { accessToken, refreshToken, user };
  }

  /**
   * Handles both Social Login & first-time Social Register in one call.
   * Accepts Google authorization code OR id_token. Also accepts a misnamed 'accessToken' which may actually be a code.
   */
  async socialLogin(dto: SocialLoginDto) {
    if (!dto || dto.provider !== 'google') {
      this.logger.error(`Invalid social login request: ${JSON.stringify(dto)}`);
      throw new BadRequestException(
        'Only Google provider is implemented in this module.',
      );
    }

    const raw = dto.idToken || dto.code || dto.accessToken;
    if (!raw) {
      throw new BadRequestException(
        'Provide either idToken, code, or accessToken.',
      );
    }

    // Heuristic: if it looks like a JWT (eyJ... with dots) → treat as id_token; otherwise treat as authorization code
    const looksLikeJwt =
      raw.includes('.') &&
      (raw.startsWith('eyJ') || raw.split('.').length === 3);

    let profile: {
      sub: string; // Google user id
      email: string;
      email_verified: boolean;
      name?: string;
      picture?: string;
    };

    try {
      if (looksLikeJwt) {
        profile = await this.google.verifyIdToken(raw);
      } else {
        // Treat value as authorization code – THIS FITS the string you shared (non-JWT). Many SDKs label it as accessToken by mistake.
        if (!dto.redirectUri) {
          throw new BadRequestException(
            'redirectUri is required when sending a Google authorization code.',
          );
        }
        const tokens = await this.google.exchangeCodeForTokens({
          code: raw,
          redirectUri: dto.redirectUri,
        });
        profile = await this.google.verifyIdToken(tokens.id_token);
      }
    } catch (e) {
      this.logger.error(`Google login failed: ${(e as Error).message}`);
      throw new UnauthorizedException(
        'Invalid Google credentials: ' + (e as Error).message,
      );
    }

    // Auto-register or login
    let user = await this.userRepo.findByProvider(dto.provider, profile.sub);

    // If no user found by provider, try finding by email
    if (!user && profile.email) {
      user = await this.userRepo.findByEmail(profile.email);

      // If user exists by email but has no provider info, link it
      if (user) {
        user.provider = dto.provider;
        user.providerId = profile.sub;
        await this.userRepo.save(user);
      }
    }

    // If still no user, create a new one
    if (!user) {
      user = await this.userRepo.create({
        fullName: profile.name || profile.email.split('@')[0],
        email: profile.email,
        // avatarUrl: profile.picture,
        provider: dto.provider,
        providerId: profile.sub,
        isEmailVerified: !!profile.email_verified,
        role: 'USER',
        isActive: true,
      });
      this.logger.log(`Created new social user: ${JSON.stringify(user)}`);
    }

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    this.logger.log(
      `Social login request for tokens: ${JSON.stringify({ accessToken, refreshToken })}`,
    );
    return { user, accessToken, refreshToken };
  }

  async verifyEmail(token: string) {
    const payload: any = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });
    const user = await this.userRepo.findById(payload.userId);
    if (!user) throw new BadRequestException('Invalid token');
    await this.userRepo.update(user.id, { isEmailVerified: true });
    return { message: 'Email verified' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return;
    const token = this.jwtService.sign(
      { userId: user.id },
      { expiresIn: '15m' },
    );
    await this.cache.set(`reset_${user.id}`, token, 900);
    await this.emailService.sendPasswordReset(email, token);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const payload: any = this.jwtService.verify(dto.token, {
      secret: process.env.JWT_SECRET,
    });
    const cached = await this.cache.get(`reset_${payload.userId}`);
    if (!cached || cached !== dto.token)
      throw new BadRequestException('Invalid token');
    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.update(payload.userId, { passwordHash: hashed });
    await this.cache.del(`reset_${payload.userId}`);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findById(userId);
    if (!user || !user.passwordHash) throw new UnauthorizedException();
    const valid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Old password incorrect');
    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.update(userId, { passwordHash: hashed });
  }

  async verifyMFA(dto: MFAVerifyDto) {
    const user = await this.userRepo.findById(dto.userId);
    if (!user || !user.mfaEnabled || !user.mfaSecret)
      throw new UnauthorizedException();
    const valid = this.mfaService.verify(user.mfaSecret, dto.code);
    if (!valid) throw new UnauthorizedException();
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  private async generateAccessToken(user: any) {
    const token = this.jwtService.sign(
      { userId: user.id, role: user.role },
      { expiresIn: '15m' },
    );
    await this.cache.set(user.id, token, 900);
    return token;
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    let payload: any;
    console.log('Refresh token :: ', refreshToken);

    // 1. Verify the refresh token signature
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    console.log('Payload : ', payload);

    const userId = payload.userId;
    if (!userId)
      throw new UnauthorizedException('Invalid refresh token payload');

    // 2. Check if token matches Redis copy
    const key = `refresh_${userId}`;
    const stored = await this.cache.get(key);
    console.log('Stored token :: ', stored);

    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    // 3. Load user
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    // 4. Rotate tokens → NEW access + NEW refresh
    const newAccessToken = await this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user);

    // 5. Return the new tokens
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async account(userId: string) {
    return this.userRepo.findById(userId);
  }

  private async generateRefreshToken(user: any) {
    const key = `refresh_${user.id}`;

    // ❌ Remove old refresh token (invalidate previous session)
    await this.cache.del(key);

    // ✔ Create new refresh token
    const token = this.jwtService.sign(
      { userId: user.id },
      { expiresIn: '7d' },
    );

    // ✔ Store new token
    await this.cache.set(key, token, 7 * 24 * 60 * 60); // 7 days

    return token;
  }

  /**
   * Generates a JWT token for email verification, caches it, and returns the token.
   * @param userId - ID of the user
   * @param userEmail - Email of the user (optional, can include in payload)
   * @returns JWT token string
   */
  private async generateEmailToken(
    userId: string,
    userEmail?: string,
  ): Promise<string> {
    // Sign JWT token
    const token = this.jwtService.sign(
      { userId, email: userEmail },
      { expiresIn: '1d' }, // token valid for 1 day
    );

    // Cache the token (TTL 7 days in seconds)
    await this.cache.set(userId, token, 86400);

    return token;
  }
}
