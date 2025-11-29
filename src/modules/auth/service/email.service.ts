import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';

@Injectable()
export class EmailService {
  private oAuth2Client = new google.auth.OAuth2(
    process.env.EMAIL_CLIENT_ID,
    process.env.EMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground', // redirect URI
  );

  constructor() {
    // Set refresh token once
    this.oAuth2Client.setCredentials({
      refresh_token: process.env.EMAIL_REFRESH_TOKEN,
    });
  }

  /**
   * Create transporter with fresh access token
   */
  private async createTransporter(): Promise<nodemailer.Transporter> {
    try {
      const accessTokenResponse = await this.oAuth2Client.getAccessToken();
      const accessToken = accessTokenResponse?.token;

      if (!accessToken) {
        throw new Error('Failed to get access token from Google OAuth2');
      }

      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.EMAIL_CLIENT_ID,
          clientSecret: process.env.EMAIL_CLIENT_SECRET,
          refreshToken: process.env.EMAIL_REFRESH_TOKEN,
          accessToken,
        },
        connectionTimeout: 20000, // 20s
        greetingTimeout: 20000,
        socketTimeout: 20000,
      });
    } catch (err) {
      console.error('Error creating transporter:', err);
      throw new InternalServerErrorException('Failed to create email transporter');
    }
  }

  /**
   * Retry sending email up to 3 times
   */
  private async sendWithRetry(mailOptions: any, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const transporter = await this.createTransporter();
        return await transporter.sendMail(mailOptions);
      } catch (err) {
        console.warn(`Send attempt ${i + 1} failed:`, err.message);
        if (i === retries - 1) throw err;
        await new Promise(res => setTimeout(res, 1000)); // wait 1s
      }
    }
  }

  async sendEmailVerification(to: string, token: string) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      console.log(`Sending email verification to: ${to}`);

      await this.sendWithRetry({
        from: process.env.EMAIL_USER,
        to,
        subject: 'Verify your email',
        html: `<p>Click the link below to verify your email:</p>
               <p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
      });

      console.log('Email verification sent successfully');
    } catch (err) {
      console.error('Failed to send email verification:', err);
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async sendPasswordReset(to: string, token: string) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      console.log(`Sending password reset email to: ${to}`);

      await this.sendWithRetry({
        from: process.env.EMAIL_USER,
        to,
        subject: 'Reset your password',
        html: `<p>Click the link below to reset your password:</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });

      console.log('Password reset email sent successfully');
    } catch (err) {
      console.error('Failed to send password reset email:', err);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
