import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentsService {
  async getProfile(userId: string) {
    return {
      userId,
      university: 'Cairo University',
      faculty: 'Engineering',
      academicYear: 3,
      isVerified: true,
    };
  }

  async updateProfile(userId: string, data: any) {
    return { userId, ...data, updatedAt: new Date().toISOString() };
  }
}
