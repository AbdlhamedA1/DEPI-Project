import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class StudentsService {
  private readonly studentDetails = new Map<string, any>();

  constructor(private readonly authService: AuthService) {}

  async getProfile(userId: string) {
    const user = await this.authService.findUserById(userId);
    const profile = this.authService.getStudentProfile(userId) || this.studentDetails.get(userId);

    return {
      userId,
      fullName: user?.fullName || 'طالب سكن',
      phone: user?.phone || '',
      email: user?.email || '',
      university: profile?.universityName || 'جامعة القاهرة',
      universityId: profile?.universityId || 'u1111111-1111-1111-1111-111111111111',
      faculty: profile?.faculty || 'كلية الهندسة',
      academicYear: profile?.academicYear || 2,
      gender: profile?.gender || 'MALE',
      bio: profile?.bio || '',
      avatarUrl: profile?.avatarUrl || '',
      isVerified: user?.isPhoneVerified ?? true,
    };
  }

  async updateProfile(userId: string, data: any) {
    const existing = await this.getProfile(userId);
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.studentDetails.set(userId, updated);
    return updated;
  }

  async getDashboard(userId: string) {
    const profile = await this.getProfile(userId);
    return {
      success: true,
      data: {
        student: profile,
        openRequestsCount: 1,
        maxOpenRequestsAllowed: 3,
        confirmedBooking: null,
        unreadMessagesCount: 0,
        unreadNotificationsCount: 1,
      },
    };
  }
}
