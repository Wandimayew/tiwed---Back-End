import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class MFAService {
  constructor() {
    authenticator.options = { step: 30, digits: 6 }; // 30s interval, 6 digits
  }
  generateSecret(): string {
    return authenticator.generateSecret(); // base32 secret
  }

  generateQRCode(user: string, secret: string): Promise<string> {
    const otpauth = authenticator.keyuri(user, 'Tiwed', secret);
    return qrcode.toDataURL(otpauth);
  }

  verify(secret: string, token: string): boolean {
    return authenticator.check(token, secret);
  }
}
