export interface AuthCredentials {
  phone: string;
  password?: string;
  otp?: string;
}

export class AuthService {
  static async requestOtp(phone: string) {
    return { success: true, phone, message: 'OTP sent successfully' };
  }

  static async verifyOtp(phone: string, _code: string) {
    return { success: true, token: 'mock-jwt-token', user: { phone } };
  }
}
