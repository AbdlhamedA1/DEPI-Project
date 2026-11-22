import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class VerifiedOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('يجب تسجيل الدخول كمالك موثق للقيام بهذا الإجراء');
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    if (user.role === 'OWNER') {
      const isVerified = user.isVerified === true || user.verificationStatus === 'VERIFIED';
      if (isVerified) {
        return true;
      }
      throw new ForbiddenException(
        'يجب توثيق حساب المالك ورفع مستندات الهوية والملكية لتتمكن من نشر العقارات',
      );
    }

    throw new ForbiddenException('هذا الإجراء متاح فقط لمالكي العقارات الموثقين');
  }
}
