import { IsNotEmpty, IsEmail, IsOptional, IsString } from 'class-validator';

export class SocialLoginDto {
  /**
   * Provider name. For now we implement 'google'.
   */

  @IsString()
  @IsNotEmpty()
  provider: string;

  /**
   * One of the following must be provided (exactly one is ideal):
   * - code: OAuth 2.0 authorization code from Google Identity Services (One Tap / Popup with type=code)
   * - idToken: Google ID token (JWT starting with 'eyJ...') if you used type=token/id_token
   * - accessToken: Provider access token (NOT recommended). If provided and it doesn't contain dots, we will treat it as an authorization code as a convenience, since many frontends label it poorly.
   */
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  /** Required if you used the authorization code flow */
  @IsOptional()
  @IsString()
  redirectUri?: string;
}
