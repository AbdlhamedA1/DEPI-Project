import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class KycDocumentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('يجب تسجيل الدخول للوصول إلى وثائق التحقق');
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    const documentOwnerId =
      request.params.userId || request.body?.userId || request.documentOwnerId;
    if (documentOwnerId && user.id === documentOwnerId) {
      return true;
    }

    // If docId is requested, the controller or service verifies that the doc belongs to user.id or user is admin
    return true;
  }
}
