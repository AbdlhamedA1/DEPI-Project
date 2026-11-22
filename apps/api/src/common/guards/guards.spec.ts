import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { VerifiedOwnerGuard } from './verified-owner.guard';
import { UserRole } from '@repo/shared-types';

describe('Security & Route Guards (Phase 12 QA)', () => {
  describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;

    beforeEach(() => {
      guard = new JwtAuthGuard();
    });

    it('should return user payload when authenticated', () => {
      const mockUser = { id: 'usr-123', role: 'STUDENT' };
      const user = guard.handleRequest(null, mockUser, null);
      expect(user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is null or error present', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(new Error('Token expired'), null, null)).toThrow();
    });
  });

  describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new RolesGuard(reflector);
    });

    const createMockContext = (user?: any): ExecutionContext =>
      ({
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      }) as unknown as ExecutionContext;

    it('should allow access if no roles are required on route', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      const ctx = createMockContext({ role: UserRole.STUDENT });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow access if user has required role (ADMIN)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const ctx = createMockContext({ role: UserRole.ADMIN });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny access if user does not have required role (STUDENT trying to access ADMIN)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const ctx = createMockContext({ role: UserRole.STUDENT });
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should deny access if user is missing', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OWNER]);
      const ctx = createMockContext(undefined);
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });

  describe('VerifiedOwnerGuard', () => {
    let guard: VerifiedOwnerGuard;

    beforeEach(() => {
      guard = new VerifiedOwnerGuard();
    });

    const createMockContext = (user?: any): ExecutionContext =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      }) as unknown as ExecutionContext;

    it('should allow verified owner to proceed', () => {
      const ctx = createMockContext({
        id: 'owner-1',
        role: 'OWNER',
        verificationStatus: 'VERIFIED',
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should always allow platform super admin to proceed', () => {
      const ctx = createMockContext({
        id: 'admin-1',
        role: 'ADMIN',
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should throw ForbiddenException if owner is unverified or pending', () => {
      const pendingCtx = createMockContext({
        id: 'owner-pending',
        role: 'OWNER',
        verificationStatus: 'PENDING',
      });
      expect(() => guard.canActivate(pendingCtx)).toThrow(ForbiddenException);

      const unverifiedCtx = createMockContext({
        id: 'owner-unverified',
        role: 'OWNER',
        verificationStatus: 'UNVERIFIED',
      });
      expect(() => guard.canActivate(unverifiedCtx)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for students or unauthenticated users', () => {
      const studentCtx = createMockContext({
        id: 'student-1',
        role: 'STUDENT',
      });
      expect(() => guard.canActivate(studentCtx)).toThrow(ForbiddenException);

      const noUserCtx = createMockContext(undefined);
      expect(() => guard.canActivate(noUserCtx)).toThrow(ForbiddenException);
    });
  });
});
