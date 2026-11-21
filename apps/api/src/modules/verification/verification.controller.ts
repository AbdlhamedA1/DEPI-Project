import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VerificationService } from './verification.service';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('user/:userId/status')
  @ApiOperation({ summary: 'Get KYC verification status for user' })
  getStatus(@Param('userId') userId: string) {
    return this.verificationService.getKycStatus(userId);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit KYC identity/deed documents' })
  submitKyc(
    @Body('userId') userId: string,
    @Body('documentType') documentType: string,
    @Body('fileUrl') fileUrl: string,
  ) {
    return this.verificationService.submitKyc(userId, documentType, fileUrl);
  }
}
