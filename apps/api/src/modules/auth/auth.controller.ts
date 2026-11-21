import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @ApiOperation({ summary: 'Request OTP verification code' })
  requestOtp(@Body('phone') phone: string) {
    return this.authService.sendOtp(phone);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP code and authenticate' })
  verifyOtp(@Body('phone') phone: string, @Body('code') code?: string, @Body('otp') otp?: string) {
    const verificationCode = code || otp || '';
    return this.authService.verifyOtp(phone, verificationCode);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with phone and password' })
  login(@Body('phone') phone: string, @Body('password') password?: string) {
    return this.authService.login(phone, password);
  }
}
