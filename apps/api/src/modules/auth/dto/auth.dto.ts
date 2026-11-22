import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, ProviderType, Gender } from '@repo/shared-types';

export class RegisterStudentDto {
  @ApiProperty({ example: '+201012345678' })
  phone!: string;

  @ApiProperty({ example: 'أحمد محمود علي' })
  fullName!: string;

  @ApiProperty({ example: 'u1111111-1111-1111-1111-111111111111' })
  universityId!: string;

  @ApiPropertyOptional({ enum: Gender, default: Gender.MALE })
  gender?: Gender;

  @ApiPropertyOptional({ example: 'كلية الهندسة' })
  faculty?: string;

  @ApiPropertyOptional({ example: 2 })
  academicYear?: number;

  @ApiPropertyOptional({ example: 'SecurePass123!' })
  password?: string;

  @ApiPropertyOptional({ example: '29801010101234' })
  nationalId?: string;

  @ApiPropertyOptional({ example: 'الجيزة' })
  governorate?: string;
}

export class RegisterOwnerDto {
  @ApiProperty({ example: '+201198765432' })
  phone!: string;

  @ApiProperty({ example: 'محمود إبراهيم حسن' })
  fullName!: string;

  @ApiProperty({ enum: ProviderType, example: ProviderType.INDIVIDUAL_OWNER })
  providerType!: ProviderType;

  @ApiPropertyOptional({ example: 'owner@property-eg.com' })
  email?: string;

  @ApiPropertyOptional({ example: '29801010101234' })
  nationalIdNumber?: string;

  @ApiPropertyOptional({ example: 'شركة سكن لإدارة العقارات' })
  companyName?: string;

  @ApiPropertyOptional({ example: 'CR-123456' })
  commercialRegistrationNumber?: string;

  @ApiPropertyOptional({ example: 'TR-789012' })
  taxNumber?: string;

  @ApiPropertyOptional({ example: 'SecurePass123!' })
  password?: string;
}

export class LoginDto {
  @ApiProperty({ example: '+201012345678' })
  phone!: string;

  @ApiPropertyOptional({ example: 'SecurePass123!' })
  password?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+201012345678' })
  phone!: string;

  @ApiPropertyOptional({ example: '123456' })
  code?: string;

  @ApiPropertyOptional({ example: '123456' })
  otp?: string;

  @ApiPropertyOptional({ example: '123456' })
  otpCode?: string;

  @ApiPropertyOptional({ example: 'REGISTRATION' })
  purpose?: string;
}

export class RequestOtpDto {
  @ApiProperty({ example: '+201012345678' })
  phone!: string;

  @ApiPropertyOptional({ example: 'REGISTRATION' })
  purpose?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  refreshToken!: string;
}
