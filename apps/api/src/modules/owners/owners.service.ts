import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class OwnersService {
  private readonly ownerDetails = new Map<string, any>();

  constructor(private readonly authService: AuthService) {}

  async getProfile(userId: string) {
    const user = await this.authService.findUserById(userId);
    const profile = this.authService.getOwnerProfile(userId) || this.ownerDetails.get(userId);

    const isVerified = user?.verificationStatus === 'VERIFIED' || profile?.isVerified === true;

    return {
      userId,
      fullName: user?.fullName || 'مالك العقار',
      phone: user?.phone || '',
      email: user?.email || '',
      providerType: profile?.providerType || 'INDIVIDUAL_OWNER',
      companyName: profile?.companyName || null,
      taxNumber: profile?.taxNumber || null,
      isVerified,
      verificationStatus: isVerified ? 'VERIFIED' : 'UNVERIFIED',
      propertiesCount: profile?.propertiesCount || 0,
      bio: profile?.bio || '',
      avatarUrl: profile?.avatarUrl || '',
    };
  }

  async updateProfile(userId: string, data: any) {
    const existing = await this.getProfile(userId);
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.ownerDetails.set(userId, updated);
    return updated;
  }

  async getDashboard(userId: string) {
    const profile = await this.getProfile(userId);
    return {
      success: true,
      data: {
        verificationStatus: profile.verificationStatus,
        isVerified: profile.isVerified,
        totalProperties: profile.propertiesCount || 1,
        publishedProperties: profile.isVerified ? 1 : 0,
        pendingReviewProperties: 0,
        pendingBookingRequests: 0,
        totalActiveTenants: 0,
        freeListingsRemaining: 3,
      },
    };
  }
}
