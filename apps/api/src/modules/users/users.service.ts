import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { AuthService } from '../auth/auth.service';
import { normalizeEgyptianPhone } from '../../common/utils/phone.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly authService: AuthService,
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {}

  async findById(id: string) {
    const user = await this.authService.findUserById(id);
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }

  async findAll() {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, phone, full_name as "fullName", email, role, status,
                  is_phone_verified as "isPhoneVerified", verification_status as "verificationStatus",
                  created_at as "createdAt"
           FROM users ORDER BY created_at DESC`,
        );
        if (res.rows.length > 0) {
          return res.rows;
        }
      } catch (err: any) {
        // Fall back
      }
    }
    return [
      {
        id: 'mock-user-1',
        phone: '+201012345678',
        fullName: 'أحمد محمد علي',
        role: 'STUDENT',
        status: 'ACTIVE',
        isPhoneVerified: true,
        verificationStatus: 'UNVERIFIED',
      },
    ];
  }

  async getCurrentUser(userId: string) {
    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    let studentProfile: any = null;
    let ownerProfile: any = null;

    if (user.role === 'STUDENT') {
      studentProfile = this.authService.getStudentProfile(userId);
    } else if (user.role === 'OWNER') {
      ownerProfile = this.authService.getOwnerProfile(userId);
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      nationalId: user.nationalId,
      role: user.role,
      status: user.status,
      isPhoneVerified: user.isPhoneVerified,
      isVerified: user.verificationStatus === 'VERIFIED',
      verificationStatus: user.verificationStatus,
      studentProfile,
      ownerProfile,
      createdAt: user.createdAt,
    };
  }

  async updateCurrentUser(userId: string, data: { fullName?: string; email?: string }) {
    const user = await this.authService.findUserById(userId);
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    this.authService.updateUser(userId, {
      fullName: data.fullName ?? user.fullName,
      email: data.email ?? user.email,
    });

    if (this.pool) {
      try {
        await this.pool.query(
          `UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email), updated_at = NOW() WHERE id = $3`,
          [data.fullName || null, data.email || null, userId],
        );
      } catch (err: any) {
        // Ignored
      }
    }

    return this.getCurrentUser(userId);
  }

  async requestPhoneChange(userId: string, newPhone: string) {
    const canonical = normalizeEgyptianPhone(newPhone);
    const existing = await this.authService.findUserByPhone(canonical);
    if (existing && existing.id !== userId) {
      throw new ConflictException('رقم الهاتف الجديد مسجل بالفعل لمستخدم آخر');
    }

    await this.authService.sendOtp(canonical, 'CHANGE_PHONE');

    return {
      success: true,
      message: 'تم إرسال رمز التحقق إلى رقم الهاتف الجديد',
      newPhone: canonical,
    };
  }

  async verifyPhoneChange(userId: string, newPhone: string, code: string) {
    const canonical = normalizeEgyptianPhone(newPhone);
    await this.authService.verifyOtp({ phone: canonical, code, purpose: 'CHANGE_PHONE' });

    this.authService.updateUser(userId, {
      phone: canonical,
      isPhoneVerified: true,
      phoneVerifiedAt: new Date(),
    });

    if (this.pool) {
      try {
        await this.pool.query(
          `UPDATE users SET phone = $1, is_phone_verified = true, phone_verified_at = NOW(), updated_at = NOW() WHERE id = $2`,
          [canonical, userId],
        );
      } catch (err: any) {
        // Ignored
      }
    }

    // Revoke old tokens
    await this.authService.logout(userId);

    return {
      success: true,
      message: 'تم تحديث رقم الهاتف بنجاح',
      phone: canonical,
    };
  }
}
