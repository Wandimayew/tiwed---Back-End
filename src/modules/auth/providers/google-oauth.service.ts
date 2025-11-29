import { Injectable } from '@nestjs/common';
import * as jose from 'jose';
import axios from 'axios';
import { datalabeling } from 'googleapis/build/src/apis/datalabeling';

export interface ExchangeCodeParams {
  code: string;
  redirectUri: string;
}

@Injectable()
export class GoogleOauthService {
  private clientId = process.env.GOOGLE_CLIENT_ID!;
  private clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  private tokenEndpoint = 'https://oauth2.googleapis.com/token';
  private jwksUrl = 'https://www.googleapis.com/oauth2/v3/certs';

  /** Exchange authorization code → tokens */
  async exchangeCodeForTokens({
    code,
    redirectUri,
  }: ExchangeCodeParams): Promise<{
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope?: string;
  }> {
    try {
      const params = new URLSearchParams();
      params.set('grant_type', 'authorization_code');
      params.set('code', code);
      params.set('client_id', this.clientId);
      params.set('client_secret', this.clientSecret);
      params.set('redirect_uri', redirectUri);
      const { data } = await axios.post(this.tokenEndpoint, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });


      return data;
    } catch (error: any) {
      console.error('🔴 Error exchanging Google authorization code:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Throw a clean NestJS error
      throw new Error(
        `Failed to exchange authorization code: ${
          error.response?.data?.error_description ||
          error.response?.data?.error ||
          error.message
        }`,
      );
    }
  }

  /** Verify a Google ID token (JWT) and return profile claims */
  async verifyIdToken(idToken: string): Promise<{
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
    picture?: string;
  }> {
    const { createRemoteJWKSet, jwtVerify } = await import('jose');

    const JWKS = createRemoteJWKSet(new URL(this.jwksUrl));

    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: this.clientId,
    });

    return {
      sub: String(payload.sub),
      email: String(payload.email || ''),
      email_verified: Boolean(payload.email_verified),
      name: payload.name ? String(payload.name) : undefined,
      picture: payload.picture ? String(payload.picture) : undefined,
    };
  }
}
