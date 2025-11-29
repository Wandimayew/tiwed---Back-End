import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { ResponseHelper } from '../../../libs/common/utils/response.helper';
import { Public } from 'src/libs/common/decorators/public.decorator';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { MFAVerifyDto } from '../dtos/mfa-verify.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { SocialLoginDto } from '../dtos/social-login.dto';
import { UpdateAccountDto } from '../dtos/update-account.dto';

@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  async register(@Body() dto: RegisterDto) {
    const tokens = await this.authService.register(dto);
    return ResponseHelper.success(tokens, 'User registered successfully');
  }

  @Post('login')
  @Public()
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);

    // 🔥 SET CORRECT REFRESH TOKEN COOKIE
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in prod, false in local
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/auth/refresh', // only used for refresh
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // return accessToken in body (frontend stores it in Zustand)
    return ResponseHelper.success({ accessToken, user }, 'Login successful');
  }
  // @Post('refresh')
  // async refresh(@Body() dto: RefreshTokenDto) {
  //   const tokens = await this.authService.refreshToken(dto.refreshToken);
  //   return ResponseHelper.success(tokens, 'Token refreshed');
  // }
  // @Post('register') register(@Body() dto: RegisterDto) {
  //   return this.authService.register(dto);
  // }
  // @Post('login') login(@Body() dto: LoginDto) {
  //   return this.authService.login(dto);
  // }
  @Post('verify-email')
  @Public()
  async verify(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
  @Post('forgot-password')
  @Public()
  async forgot(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }
  @Post('reset-password')
  @Public()
  async reset(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
  /**
   * Changes the password of the user with the given userId.
   * @param {string} userId - The id of the user to change the password of.
   * @param {ChangePasswordDto} dto - The new password and the old password.
   * @returns {Promise<void>} - A promise that resolves when the password is changed.
   */
  @Post('change-password') change(@Req() req, @Body() dto: ChangePasswordDto) {
    const userId = req.user?.id;
    return this.authService.changePassword(userId, dto);
  }
  @Post('mfa/verify') mfaVerify(@Body() dto: MFAVerifyDto) {
    return this.authService.verifyMFA(dto);
  }
  @Post('social-login')
  @Public()
  async social(@Body() dto: SocialLoginDto, @Res({ passthrough: true }) res) {
    const { user, accessToken, refreshToken } =
      await this.authService.socialLogin(dto);

    // Set refresh token in HttpOnly secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in prod, false in local
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/auth/refresh', // only used for refresh
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Return access token in JSON
    return { user, accessToken };
  }

  // REFRESH TOKEN
  @Public()
  @Post('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) res) {
    const token = req.cookies['refreshToken'];
    if (!token) throw new UnauthorizedException();

    const { accessToken, refreshToken } =
      await this.authService.refreshToken(token);

    // Set new refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in prod, false in local
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }

  @Get('account')
  async accountMe(@Req() req) {
    const userId = req.user?.id;
    const result = await this.authService.account(userId);
    return ResponseHelper.success(result);
  }

  @Patch('/account')
  async updateAccount(@Req() req, @Body() dto: UpdateAccountDto) {
    const userId = req.user?.id;
    const result = await this.authService.updateAccount(userId, dto);
    return ResponseHelper.success(result);
  }
}
