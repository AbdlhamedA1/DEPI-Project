import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async sendOtp(phone: string) {
    return { success: true, phone, message: 'OTP sent successfully (dev mock: 123456)' };
  }

  async verifyOtp(phone: string, otp: string) {
    return {
      success: true,
      token: 'jwt-access-token-mock',
      user: { id: 'mock-user-1', phone, role: 'STUDENT' },
    };
  }

  async login(phone: string, password?: string) {
    return {
      success: true,
      token: 'jwt-access-token-mock',
      user: { id: 'mock-user-1', phone, role: 'STUDENT' },
    };
  }
}
