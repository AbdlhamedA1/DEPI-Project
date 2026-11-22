import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterStudentDto,
  RegisterOwnerDto,
  LoginDto,
  VerifyOtpDto,
  RequestOtpDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(['student/register', 'register/student'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new student tenant with phone OTP' })
  @ApiResponse({ status: 201, description: 'Student registered and OTP dispatched' })
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.authService.registerStudent(dto);
  }

  @Post(['owner/register', 'register/owner'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a property provider/owner account' })
  @ApiResponse({ status: 201, description: 'Owner registered' })
  registerOwner(@Body() dto: RegisterOwnerDto) {
    return this.authService.registerOwner(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with phone and optional password' })
  @ApiResponse({ status: 200, description: 'JWT tokens generated' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post(['otp/request', 'resend-otp'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request or resend 6-digit OTP verification code' })
  @ApiResponse({ status: 200, description: 'OTP dispatched' })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.sendOtp(dto.phone, dto.purpose);
  }

  @Post(['otp/verify', 'verify-otp'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code and issue JWT tokens' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh expired access token using refresh token' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke active refresh tokens and logout' })
  logout(@Req() req: any) {
    return this.authService.logout(req.user?.id);
  }
}
