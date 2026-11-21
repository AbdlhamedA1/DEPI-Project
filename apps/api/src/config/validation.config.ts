import { registerAs } from '@nestjs/config';

export const validationConfig = registerAs('validation', () => ({
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
}));
