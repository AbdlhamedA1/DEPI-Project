/**
 * Opaque API Contract Client
 * Simulates REST API endpoints matching the NestJS API contracts
 * with standard response envelopes and HTTP status codes
 * (200, 201, 400, 401, 403, 404, 409, 422, 429).
 */

import { DomainStateSimulator } from './domain-state-simulator';
import { UserRole } from '../fixtures/users.fixture';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Array<{ field?: string; message: string; code?: string }>;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface HttpResponse<T = any> {
  status: number;
  body: ApiResponse<T> & ApiErrorResponse;
}

export interface RequestHeaders {
  Authorization?: string;
  [key: string]: string | undefined;
}

export class ApiContractClient {
  private simulator: DomainStateSimulator;

  constructor(simulator?: DomainStateSimulator) {
    this.simulator = simulator || new DomainStateSimulator();
  }

  public getSimulator(): DomainStateSimulator {
    return this.simulator;
  }

  public reset(): void {
    this.simulator.resetToSeed();
  }

  /**
   * Helper to parse Bearer token:
   * Format: "Bearer <userId>:<role>" or "Bearer <userId>"
   */
  private parseAuth(headers?: RequestHeaders): { userId?: string; role?: UserRole } {
    if (!headers?.Authorization) return {};
    const auth = headers.Authorization.trim();
    if (!auth.startsWith('Bearer ')) return {};
    const token = auth.substring(7).trim();
    const parts = token.split(':');
    const userId = parts[0];
    let role = parts[1] as UserRole | undefined;

    if (!role && userId) {
      const user = this.simulator.getUserById(userId);
      if (user) role = user.role;
    }

    return { userId, role };
  }

  // ==========================================
  // HTTP METHODS ROUTER
  // ==========================================

  public async get<T = any>(endpoint: string, headers?: RequestHeaders): Promise<HttpResponse<T>> {
    return this.dispatch<T>('GET', endpoint, undefined, headers);
  }

  public async post<T = any>(
    endpoint: string,
    body?: any,
    headers?: RequestHeaders,
  ): Promise<HttpResponse<T>> {
    return this.dispatch<T>('POST', endpoint, body, headers);
  }

  public async patch<T = any>(
    endpoint: string,
    body?: any,
    headers?: RequestHeaders,
  ): Promise<HttpResponse<T>> {
    return this.dispatch<T>('PATCH', endpoint, body, headers);
  }

  public async put<T = any>(
    endpoint: string,
    body?: any,
    headers?: RequestHeaders,
  ): Promise<HttpResponse<T>> {
    return this.dispatch<T>('PUT', endpoint, body, headers);
  }

  public async delete<T = any>(
    endpoint: string,
    headers?: RequestHeaders,
  ): Promise<HttpResponse<T>> {
    return this.dispatch<T>('DELETE', endpoint, undefined, headers);
  }

  private async dispatch<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any,
    headers?: RequestHeaders,
  ): Promise<HttpResponse<T>> {
    const url = new URL(`http://localhost${endpoint}`);
    const pathname = url.pathname;
    const query = Object.fromEntries(url.searchParams.entries());
    const auth = this.parseAuth(headers);

    try {
      // 1. AUTH & USERS ROUTES
      if (pathname === '/api/v1/auth/otp/request' && method === 'POST') {
        const res = this.simulator.requestOtp(body?.phone);
        return this.formatSuccess(200, res as any, res.message);
      }

      if (pathname === '/api/v1/auth/otp/verify' && method === 'POST') {
        const res = this.simulator.verifyOtp(body?.phone, body?.code);
        return this.formatSuccess(200, res as any, 'OTP verified successfully');
      }

      if (pathname === '/api/v1/students/register' && method === 'POST') {
        const res = this.simulator.registerStudent(body);
        return this.formatSuccess(201, res as any, 'Student registered successfully');
      }

      if (pathname.match(/^\/api\/v1\/students\/([^/]+)\/phone$/) && method === 'PATCH') {
        const studentId = pathname.split('/')[4];
        this.requireRole(auth, ['STUDENT', 'ADMIN'], studentId);
        const res = this.simulator.updateStudentPhone(studentId, body?.newPhone, body?.otpToken);
        return this.formatSuccess(200, res as any, 'Phone updated successfully');
      }

      if (pathname === '/api/v1/owners/register' && method === 'POST') {
        const res = this.simulator.registerProvider(body);
        return this.formatSuccess(201, res as any, 'Provider registered successfully');
      }

      if (pathname.match(/^\/api\/v1\/owners\/([^/]+)\/kyc$/)) {
        const providerId = pathname.split('/')[4];
        if (method === 'POST') {
          this.requireRole(auth, ['OWNER', 'ADMIN'], providerId);
          const res = this.simulator.uploadKycDocument(providerId, body);
          return this.formatSuccess(201, res as any, 'KYC document uploaded successfully');
        }
        if (method === 'GET') {
          if (!auth.userId || !auth.role) {
            throw { statusCode: 401, message: 'Unauthorized' };
          }
          const res = this.simulator.getProviderKycDocuments(providerId, auth.userId, auth.role);
          return this.formatSuccess(200, res as any);
        }
      }

      if (pathname.match(/^\/api\/v1\/users\/([^/]+)$/) && method === 'GET') {
        const userId = pathname.split('/')[4];
        const res = this.simulator.getUserById(userId);
        if (!res) throw { statusCode: 404, message: 'User not found' };
        return this.formatSuccess(200, res as any);
      }

      // 2. LOCATIONS & UNIVERSITIES ROUTES
      if (pathname === '/api/v1/locations/governorates' && method === 'GET') {
        const res = this.simulator.getGovernorates();
        return this.formatSuccess(200, res as any);
      }

      if (pathname === '/api/v1/locations/cities' && method === 'GET') {
        const res = this.simulator.getCities(query.governorateId);
        return this.formatSuccess(200, res as any);
      }

      if (pathname === '/api/v1/locations/areas' && method === 'GET') {
        const res = this.simulator.getAreas(query.cityId);
        return this.formatSuccess(200, res as any);
      }

      if (pathname === '/api/v1/universities' && method === 'GET') {
        const res = this.simulator.getUniversities(query.cityId);
        return this.formatSuccess(200, res as any);
      }

      if (pathname.match(/^\/api\/v1\/universities\/([^/]+)$/) && method === 'GET') {
        const univId = pathname.split('/')[4];
        const res = this.simulator.getUniversityById(univId);
        if (!res) throw { statusCode: 404, message: 'University not found' };
        return this.formatSuccess(200, res as any);
      }

      // 3. PROPERTIES & SEARCH ROUTES
      if (pathname === '/api/v1/properties' && method === 'POST') {
        this.requireRole(auth, ['OWNER']);
        const res = this.simulator.createPropertyListing(auth.userId!, body);
        return this.formatSuccess(
          201,
          res as any,
          'Property listing created and submitted for review',
        );
      }

      if (pathname.match(/^\/api\/v1\/properties\/([^/]+)$/) && method === 'GET') {
        const propId = pathname.split('/')[4];
        const res = this.simulator.getPropertyById(propId);
        if (!res) throw { statusCode: 404, message: 'Property listing not found' };
        return this.formatSuccess(200, res as any);
      }

      if (
        pathname.match(
          /^\/api\/v1\/properties\/([^/]+)\/portions\/([^/]+)\/([^/]+)\/availability$/,
        ) &&
        method === 'GET'
      ) {
        const parts = pathname.split('/');
        const propId = parts[4];
        const portionType = parts[6] as any;
        const portionId = parts[7];
        const res = this.simulator.getPortionAvailability(propId, portionType, portionId);
        return this.formatSuccess(200, res as any);
      }

      if (pathname === '/api/v1/search' && method === 'GET') {
        const filters = {
          cityId: query.cityId,
          areaId: query.areaId,
          universityId: query.universityId,
          maxDistanceKm: query.maxDistanceKm ? parseFloat(query.maxDistanceKm) : undefined,
          minPriceEgp: query.minPriceEgp ? parseFloat(query.minPriceEgp) : undefined,
          maxPriceEgp: query.maxPriceEgp ? parseFloat(query.maxPriceEgp) : undefined,
          accommodationType: query.accommodationType as any,
          genderPolicy: query.genderPolicy as any,
          durationUnit: query.durationUnit as any,
        };
        const res = this.simulator.searchProperties(filters);
        return this.formatSuccess(200, res as any);
      }

      // 4. BOOKING REQUESTS ROUTES
      if (pathname === '/api/v1/booking-requests' && method === 'POST') {
        this.requireRole(auth, ['STUDENT']);
        const res = this.simulator.createBookingRequest({
          ...body,
          studentId: auth.userId!,
        });
        return this.formatSuccess(201, res as any, 'Booking request created successfully');
      }

      if (pathname.match(/^\/api\/v1\/booking-requests\/([^/]+)$/) && method === 'GET') {
        const reqId = pathname.split('/')[4];
        const res = this.simulator.getBookingRequestById(reqId);
        if (!res) throw { statusCode: 404, message: 'Booking request not found' };
        return this.formatSuccess(200, res as any);
      }

      if (pathname.match(/^\/api\/v1\/students\/([^/]+)\/booking-requests$/) && method === 'GET') {
        const studentId = pathname.split('/')[4];
        this.requireRole(auth, ['STUDENT', 'ADMIN'], studentId);
        const res = this.simulator.getStudentBookingRequests(studentId);
        return this.formatSuccess(200, res as any);
      }

      if (pathname.match(/^\/api\/v1\/booking-requests\/([^/]+)\/accept$/) && method === 'POST') {
        const reqId = pathname.split('/')[4];
        this.requireRole(auth, ['OWNER']);
        const res = this.simulator.providerAcceptRequest(reqId, auth.userId!);
        return this.formatSuccess(200, res as any, 'Booking request accepted');
      }

      if (pathname.match(/^\/api\/v1\/booking-requests\/([^/]+)\/reject$/) && method === 'POST') {
        const reqId = pathname.split('/')[4];
        this.requireRole(auth, ['OWNER']);
        const res = this.simulator.providerRejectRequest(reqId, auth.userId!, body?.reason);
        return this.formatSuccess(200, res as any, 'Booking request rejected');
      }

      if (pathname.match(/^\/api\/v1\/booking-requests\/([^/]+)\/cancel$/) && method === 'POST') {
        const reqId = pathname.split('/')[4];
        this.requireRole(auth, ['STUDENT']);
        const res = this.simulator.studentCancelRequest(reqId, auth.userId!, body?.reason);
        return this.formatSuccess(200, res as any, 'Booking request cancelled');
      }

      if (
        pathname.match(/^\/api\/v1\/booking-requests\/([^/]+)\/confirm-agreement$/) &&
        method === 'POST'
      ) {
        const reqId = pathname.split('/')[4];
        if (!auth.userId) throw { statusCode: 401, message: 'Unauthorized' };
        const res = this.simulator.confirmMutualAgreement(
          reqId,
          auth.userId,
          body?.agreementDocUrl,
        );
        return this.formatSuccess(200, res as any, 'Agreement confirmed');
      }

      // 5. MESSAGING & NOTIFICATIONS ROUTES
      if (
        pathname.match(/^\/api\/v1\/booking-requests\/([^/]+)\/conversation$/) &&
        method === 'GET'
      ) {
        const reqId = pathname.split('/')[4];
        if (!auth.userId) throw { statusCode: 401, message: 'Unauthorized' };
        const res = this.simulator.getConversationByRequestId(reqId, auth.userId);
        return this.formatSuccess(200, res as any);
      }

      if (pathname.match(/^\/api\/v1\/conversations\/([^/]+)\/messages$/) && method === 'POST') {
        const convId = pathname.split('/')[4];
        if (!auth.userId) throw { statusCode: 401, message: 'Unauthorized' };
        const res = this.simulator.sendMessage(convId, auth.userId, body?.text);
        return this.formatSuccess(201, res as any, 'Message sent successfully');
      }

      if (pathname === '/api/v1/notifications' && method === 'GET') {
        if (!auth.userId) throw { statusCode: 401, message: 'Unauthorized' };
        const res = this.simulator.getUserNotifications(auth.userId);
        return this.formatSuccess(200, res as any);
      }

      // 6. REVIEWS & REPORTS ROUTES
      if (pathname === '/api/v1/reviews' && method === 'POST') {
        this.requireRole(auth, ['STUDENT']);
        const res = this.simulator.submitReview({
          ...body,
          studentId: auth.userId!,
        });
        return this.formatSuccess(201, res as any, 'Review submitted successfully');
      }

      if (pathname.match(/^\/api\/v1\/reviews\/([^/]+)\/response$/) && method === 'POST') {
        const revId = pathname.split('/')[4];
        this.requireRole(auth, ['OWNER']);
        const res = this.simulator.submitReviewResponse(revId, auth.userId!, body?.responseText);
        return this.formatSuccess(201, res as any, 'Provider response submitted successfully');
      }

      if (pathname === '/api/v1/reports' && method === 'POST') {
        if (!auth.userId) throw { statusCode: 401, message: 'Unauthorized' };
        const res = this.simulator.submitComplaint({
          ...body,
          reporterId: auth.userId,
        });
        return this.formatSuccess(201, res as any, 'Report submitted successfully');
      }

      if (pathname.match(/^\/api\/v1\/reports\/([^/]+)\/status$/) && method === 'PATCH') {
        this.requireRole(auth, ['ADMIN']);
        const repId = pathname.split('/')[4];
        const res = this.simulator.updateComplaintStatus(
          repId,
          auth.userId!,
          body?.status,
          body?.resolutionNotes,
        );
        return this.formatSuccess(200, res as any, 'Report status updated');
      }

      // 7. ADMIN & AUDIT ROUTES
      if (pathname === '/api/v1/admin/dashboard/metrics' && method === 'GET') {
        this.requireRole(auth, ['ADMIN']);
        const res = this.simulator.getPlatformDashboardMetrics(auth.userId!);
        return this.formatSuccess(200, res as any);
      }

      if (pathname === '/api/v1/admin/moderation/kyc' && method === 'GET') {
        this.requireRole(auth, ['ADMIN']);
        const res = this.simulator.getPendingKycQueue(auth.userId!);
        return this.formatSuccess(200, res as any);
      }

      if (
        pathname.match(/^\/api\/v1\/admin\/moderation\/kyc\/([^/]+)\/review$/) &&
        method === 'POST'
      ) {
        this.requireRole(auth, ['ADMIN']);
        const providerId = pathname.split('/')[6];
        const res = this.simulator.reviewProviderKyc(
          auth.userId!,
          providerId,
          body?.approved,
          body?.rejectionReason,
        );
        return this.formatSuccess(200, res as any, 'KYC review completed');
      }

      if (pathname === '/api/v1/admin/moderation/properties' && method === 'GET') {
        this.requireRole(auth, ['ADMIN']);
        const res = this.simulator.getPendingListingQueue(auth.userId!);
        return this.formatSuccess(200, res as any);
      }

      if (
        pathname.match(/^\/api\/v1\/admin\/moderation\/properties\/([^/]+)\/review$/) &&
        method === 'POST'
      ) {
        this.requireRole(auth, ['ADMIN']);
        const propId = pathname.split('/')[6];
        const res = this.simulator.reviewPropertyListing(
          auth.userId!,
          propId,
          body?.approved,
          body?.reason,
        );
        return this.formatSuccess(200, res as any, 'Property listing review completed');
      }

      if (
        pathname.match(/^\/api\/v1\/admin\/moderation\/properties\/([^/]+)\/suspend$/) &&
        method === 'POST'
      ) {
        this.requireRole(auth, ['ADMIN']);
        const propId = pathname.split('/')[6];
        const res = this.simulator.suspendPropertyListing(auth.userId!, propId, body?.reason);
        return this.formatSuccess(200, res as any, 'Property listing suspended');
      }

      if (pathname === '/api/v1/admin/audit-logs' && method === 'GET') {
        this.requireRole(auth, ['ADMIN']);
        const res = this.simulator.getAdminActionLogs(auth.userId!);
        return this.formatSuccess(200, res as any);
      }

      // Route Not Found
      return this.formatError(404, 'NOT_FOUND', `Route ${method} ${pathname} not found`);
    } catch (err: any) {
      const statusCode = err?.statusCode || 500;
      const error = err?.error || this.httpStatusToError(statusCode);
      const message = err?.message || 'Internal Server Error';
      return this.formatError(statusCode, error, message, err?.details);
    }
  }

  private requireRole(
    auth: { userId?: string; role?: UserRole },
    allowedRoles: UserRole[],
    targetOwnerId?: string,
  ): void {
    if (!auth.userId || !auth.role) {
      throw { statusCode: 401, message: 'Unauthorized: Authentication required' };
    }
    if (!allowedRoles.includes(auth.role)) {
      throw { statusCode: 403, message: `Forbidden: Role ${auth.role} not permitted` };
    }
    if (targetOwnerId && auth.role !== 'ADMIN' && auth.userId !== targetOwnerId) {
      throw { statusCode: 403, message: "Forbidden: Cannot access another user's resource" };
    }
  }

  private formatSuccess<T>(status: number, data: T, message?: string): HttpResponse<T> {
    return {
      status,
      body: {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
      } as any,
    };
  }

  private formatError(
    status: number,
    error: string,
    message: string,
    details?: any,
  ): HttpResponse<any> {
    return {
      status,
      body: {
        success: false,
        statusCode: status,
        error,
        message,
        details,
        timestamp: new Date().toISOString(),
      } as any,
    };
  }

  private httpStatusToError(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 429:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
