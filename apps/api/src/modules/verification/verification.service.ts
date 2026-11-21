import { Injectable } from '@nestjs/common';

@Injectable()
export class VerificationService {
  async submitKyc(userId: string, documentType: string, fileUrl: string) {
    return {
      id: `kyc-${Date.now()}`,
      userId,
      documentType,
      fileUrl,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };
  }

  async getKycStatus(userId: string) {
    return {
      userId,
      isVerified: true,
      status: 'VERIFIED',
      verifiedAt: '2026-08-10T10:00:00Z',
    };
  }
}
