import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  async getMetrics() {
    return {
      totalUsers: 1420,
      totalProperties: 580,
      pendingVerifications: 18,
      activeAgreements: 412,
    };
  }

  async approveKyc(userId: string) {
    return { success: true, userId, status: 'VERIFIED', verifiedAt: new Date().toISOString() };
  }

  async approveProperty(propertyId: string) {
    return { success: true, propertyId, status: 'APPROVED' };
  }
}
