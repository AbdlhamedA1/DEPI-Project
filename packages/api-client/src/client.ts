import {
  ApiResponse,
  ApiErrorResponse,
  IUser,
  IStudentProfile,
  IOwnerProfile,
  IProperty,
  IBookingRequest,
  PaginatedResponse,
  ICity,
  IArea,
  IUniversity,
  IPropertyUnit,
  IRoom,
  IBed,
  IPricing,
  IAvailability,
  IAdditionalExpense,
  SearchPropertyCardDto,
  SearchMapPinDto,
  SearchResponseDto,
  SearchQueryParams,
  SearchMapQueryParams,
  IAgreementConfirmation,
  IConversation,
  IMessage,
  INotification,
  IReview,
  IReviewResponse,
  IReport,
  IAdminActionLog,
  AuditLogQueryParams,
  PlatformOverviewAnalytics,
  CityAnalyticsSummary,
  PricingTrendPoint,
  BookingFunnelAnalytics,
  TrustSafetyAnalytics,
  AnalyticsExportQuery,
  UpdateUserStatusDto,
  SuspendPropertyDto,
} from '@repo/shared-types';
import {
  CreatePropertyInput,
  SearchPropertyFilterInput,
  CreateBookingRequestInput,
  UpdateBookingStatusInput,
  LoginInput,
  RegisterStudentInput,
  RegisterOwnerInput,
  CreateUnitInput,
  CreateRoomInput,
  CreateBedInput,
  CreatePricingInput,
  CreateAdditionalExpenseInput,
  ReviewPropertyInput,
  AttachPropertyImageInput,
  CalculatePricingQuoteInput,
  CreateReviewInput,
  CreateReviewResponseInput,
  CreateReportInput,
  SendMessageInput,
} from '@repo/validation';
import {
  VerifyOtpDto,
  RequestOtpDto,
  AuthTokensResponse,
  RequestOtpResponse,
  RefreshTokenResponse,
  UploadSignatureResponse,
  KycSubmissionResponse,
  KycStatusResponse,
  PricingCalculationResult,
} from './contracts';

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  getLocale?: () => string;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorResponse: ApiErrorResponse,
  ) {
    super(
      typeof errorResponse.message === 'string'
        ? errorResponse.message
        : Array.isArray(errorResponse.message)
          ? errorResponse.message.join(', ')
          : 'An unexpected error occurred',
    );
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;
  private getToken?: () => string | null | Promise<string | null>;
  private getLocale?: () => string;

  public readonly auth = {
    requestOtp: (data: RequestOtpDto) => this.post<RequestOtpResponse>('/auth/otp/request', data),

    verifyOtp: (data: VerifyOtpDto) => this.post<AuthTokensResponse>('/auth/otp/verify', data),

    login: (data: LoginInput) => this.post<AuthTokensResponse>('/auth/login', data),

    registerStudent: (data: RegisterStudentInput) =>
      this.post<{ success: boolean; user: IUser; profile: IStudentProfile }>(
        '/auth/student/register',
        data,
      ),

    registerOwner: (data: RegisterOwnerInput) =>
      this.post<{ success: boolean; user: IUser; profile: IOwnerProfile }>(
        '/auth/owner/register',
        data,
      ),

    resendOtp: (data: RequestOtpDto) => this.post<RequestOtpResponse>('/auth/resend-otp', data),

    refreshToken: (refreshToken: string) =>
      this.post<RefreshTokenResponse>('/auth/refresh-token', { refreshToken }),

    logout: () => this.post<{ success: boolean; message: string }>('/auth/logout'),
  };

  public readonly users = {
    getMe: () => this.get<IUser>('/users/me'),
    updateMe: (data: Partial<IUser>) => this.put<IUser>('/users/me', data),
    requestPhoneChange: (newPhone: string) =>
      this.post<{ success: boolean; message: string }>('/users/change-phone/request', {
        newPhone,
      }),
    verifyPhoneChange: (newPhone: string, code: string) =>
      this.post<{ success: boolean; message: string }>('/users/change-phone/verify', {
        newPhone,
        code,
      }),
  };

  public readonly students = {
    getMe: () => this.get<IStudentProfile & { user: IUser }>('/students/me'),
    updateMe: (data: Partial<IStudentProfile>) => this.put<IStudentProfile>('/students/me', data),
    getDashboard: () => this.get<any>('/students/me/dashboard'),
  };

  public readonly owners = {
    getMe: () => this.get<IOwnerProfile & { user: IUser }>('/owners/me'),
    updateMe: (data: Partial<IOwnerProfile>) => this.put<IOwnerProfile>('/owners/me', data),
    getDashboard: () => this.get<any>('/owners/me/dashboard'),
  };

  public readonly locations = {
    getGovernorates: () => this.get<string[]>('/locations/governorates'),
    getCities: () => this.get<ICity[]>('/locations/cities'),
    getAreas: (cityId: string) => this.get<IArea[]>(`/locations/cities/${cityId}/areas`),
  };

  public readonly universities = {
    getAll: (params?: { cityId?: string; governorate?: string; search?: string }) => {
      const qs = this.buildQueryString(params);
      return this.get<IUniversity[]>(`/universities${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => this.get<IUniversity>(`/universities/${id}`),
  };

  public readonly properties = {
    list: (params?: SearchPropertyFilterInput) => {
      const qs = this.buildQueryString(params);
      return this.get<PaginatedResponse<IProperty>>(`/properties${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => this.get<IProperty>(`/properties/${id}`),
    create: (data: CreatePropertyInput) => this.post<IProperty>('/properties', data),
    update: (id: string, data: Partial<CreatePropertyInput>) =>
      this.put<IProperty>(`/properties/${id}`, data),
    delete: (id: string) => this.delete<{ success: boolean }>(`/properties/${id}`),
    getHierarchy: (id: string) => this.get<any>(`/properties/${id}/hierarchy`),
    getUploadSignature: (id: string) =>
      this.post<UploadSignatureResponse>(`/properties/${id}/upload-signature`),
    attachImage: (id: string, data: AttachPropertyImageInput) =>
      this.post<any>(`/properties/${id}/images`, data),
    deleteImage: (id: string, imageId: string) =>
      this.delete<{ success: boolean }>(`/properties/${id}/images/${imageId}`),
  };

  public readonly units = {
    listByProperty: (propertyId: string) =>
      this.get<IPropertyUnit[]>(`/properties/${propertyId}/units`),
    create: (propertyId: string, data: CreateUnitInput) =>
      this.post<IPropertyUnit>(`/properties/${propertyId}/units`, data),
    update: (id: string, data: Partial<CreateUnitInput>) =>
      this.put<IPropertyUnit>(`/units/${id}`, data),
    delete: (id: string) => this.delete<{ success: boolean }>(`/units/${id}`),
  };

  public readonly rooms = {
    listByUnit: (unitId: string) => this.get<IRoom[]>(`/units/${unitId}/rooms`),
    create: (unitId: string, data: CreateRoomInput) =>
      this.post<IRoom>(`/units/${unitId}/rooms`, data),
    update: (id: string, data: Partial<CreateRoomInput>) => this.put<IRoom>(`/rooms/${id}`, data),
    delete: (id: string) => this.delete<{ success: boolean }>(`/rooms/${id}`),
  };

  public readonly beds = {
    listByRoom: (roomId: string) => this.get<IBed[]>(`/rooms/${roomId}/beds`),
    create: (roomId: string, data: CreateBedInput) =>
      this.post<IBed>(`/rooms/${roomId}/beds`, data),
    update: (id: string, data: Partial<CreateBedInput>) => this.put<IBed>(`/beds/${id}`, data),
    delete: (id: string) => this.delete<{ success: boolean }>(`/beds/${id}`),
  };

  public readonly pricing = {
    getByEntity: (entityType: string, entityId: string) =>
      this.get<IPricing>(`/pricing/${entityType}/${entityId}`),
    setForEntity: (entityType: string, entityId: string, data: CreatePricingInput) =>
      this.post<IPricing>(`/pricing/${entityType}/${entityId}`, data),
    addExpense: (propertyId: string, data: CreateAdditionalExpenseInput) =>
      this.post<IAdditionalExpense>(`/properties/${propertyId}/expenses`, data),
    deleteExpense: (id: string) => this.delete<{ success: boolean }>(`/expenses/${id}`),
    calculateQuote: (data: CalculatePricingQuoteInput) =>
      this.post<PricingCalculationResult>('/pricing/calculate', data),
  };

  public readonly availability = {
    getByEntity: (entityType: string, entityId: string) =>
      this.get<IAvailability>(`/availability/${entityType}/${entityId}`),
    updateStatus: (entityType: string, entityId: string, data: { status: string }) =>
      this.put<IAvailability>(`/availability/${entityType}/${entityId}`, data),
  };

  public readonly search = {
    query: (params?: SearchQueryParams) => {
      const qs = this.buildQueryString(params);
      return this.get<SearchResponseDto>(`/search${qs ? `?${qs}` : ''}`);
    },
    mapPins: (params?: SearchMapQueryParams) => {
      const qs = this.buildQueryString(params);
      return this.get<SearchMapPinDto[]>(`/search/map${qs ? `?${qs}` : ''}`);
    },
  };

  public readonly verification = {
    submitDocument: (data: FormData) =>
      this.request<KycSubmissionResponse>('/verification/documents', {
        method: 'POST',
        body: data,
        headers: {}, // Let browser set multipart boundary
      }),
    submitKyc: (data: any) => this.post<any>('/verification/kyc', data),
    getMyStatus: () => this.get<KycStatusResponse>('/verification/my-status'),
  };

  public readonly admin = {
    getDashboard: () => this.get<any>('/admin/dashboard'),
    getPendingVerifications: () => this.get<any[]>('/admin/verifications/pending'),
    reviewVerification: (id: string, data: { decision: 'APPROVE' | 'REJECT'; reason?: string }) =>
      this.post<{ success: boolean }>(`/admin/verifications/${id}/review`, data),
    getPendingProperties: () => this.get<any[]>('/admin/properties/pending'),
    reviewProperty: (id: string, data: ReviewPropertyInput) =>
      this.post<{ success: boolean }>(`/admin/properties/${id}/review`, data),
    getUsers: (params?: Record<string, any>) => {
      const qs = this.buildQueryString(params);
      return this.get<any[]>(`/admin/users${qs ? `?${qs}` : ''}`);
    },
    updateUserStatus: (id: string, data: UpdateUserStatusDto) =>
      this.put<{ success: boolean; user: any }>(`/admin/users/${id}/status`, data),
    suspendProperty: (id: string, data: SuspendPropertyDto) =>
      this.post<{ success: boolean; property: any }>(`/admin/properties/${id}/suspend`, data),
    getAuditLogs: (params?: AuditLogQueryParams) => {
      const qs = this.buildQueryString(params);
      return this.get<IAdminActionLog[]>(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
    },
  };

  public readonly analytics = {
    getDashboard: () => this.get<any>('/analytics/dashboard'),
    getOverview: () => this.get<PlatformOverviewAnalytics>('/analytics/overview'),
    getCitiesBreakdown: () => this.get<CityAnalyticsSummary[]>('/analytics/cities'),
    getPricingTrends: (params?: { cityId?: string; areaId?: string; period?: string }) => {
      const qs = this.buildQueryString(params);
      return this.get<PricingTrendPoint[]>(`/analytics/pricing-trends${qs ? `?${qs}` : ''}`);
    },
    getBookingFunnel: () => this.get<BookingFunnelAnalytics>('/analytics/funnel'),
    getTrustSafetyMetrics: () => this.get<TrustSafetyAnalytics>('/analytics/trust-safety'),
    exportData: (params: AnalyticsExportQuery) => {
      const qs = this.buildQueryString(params);
      return this.get<any>(`/analytics/export${qs ? `?${qs}` : ''}`);
    },
  };

  public readonly bookingRequests = {
    create: (data: CreateBookingRequestInput) =>
      this.post<IBookingRequest>('/booking-requests', data),
    getById: (id: string) => this.get<IBookingRequest>(`/booking-requests/${id}`),
    getByStudent: (studentId: string) =>
      this.get<IBookingRequest[]>(`/booking-requests/student/${studentId}`),
    getByOwner: (ownerId: string) =>
      this.get<IBookingRequest[]>(`/booking-requests/owner/${ownerId}`),
    updateStatus: (id: string, data: UpdateBookingStatusInput) =>
      this.patch<IBookingRequest>(`/booking-requests/${id}/status`, data),
    accept: (id: string) => this.post<IBookingRequest>(`/booking-requests/${id}/accept`, {}),
    reject: (id: string, reason?: string) =>
      this.post<IBookingRequest>(`/booking-requests/${id}/reject`, { reason }),
    cancel: (id: string, reason?: string) =>
      this.post<IBookingRequest>(`/booking-requests/${id}/cancel`, { reason }),
  };

  public readonly agreements = {
    getByRequestId: (requestId: string) =>
      this.get<IAgreementConfirmation>(`/agreements/booking-request/${requestId}`),
    confirm: (requestId: string, data?: { termsAccepted?: boolean; contractUrl?: string }) =>
      this.post<IAgreementConfirmation>(`/agreements/${requestId}/confirm`, data || {}),
  };

  public readonly messaging = {
    getConversations: () => this.get<IConversation[]>('/messaging/conversations'),
    getConversation: (id: string) => this.get<any>(`/messaging/conversations/${id}`),
    getMessages: (conversationId: string) =>
      this.get<IMessage[]>(`/messaging/conversations/${conversationId}/messages`),
    sendMessage: (conversationId: string, data: { body: string }) =>
      this.post<IMessage>(`/messaging/conversations/${conversationId}/messages`, data),
    markAsRead: (conversationId: string) =>
      this.put<{ success: boolean }>(`/messaging/conversations/${conversationId}/read`, {}),
    getUnreadCount: () => this.get<{ count: number }>('/messaging/unread-count'),
  };

  public readonly notifications = {
    getAll: (params?: { isRead?: boolean }) => {
      const qs = this.buildQueryString(params);
      return this.get<INotification[]>(`/notifications${qs ? `?${qs}` : ''}`);
    },
    getUnreadCount: () => this.get<{ count: number }>('/notifications/unread-count'),
    markAsRead: (id: string) => this.put<{ success: boolean }>(`/notifications/${id}/read`, {}),
    markAllAsRead: () => this.put<{ success: boolean }>('/notifications/read-all', {}),
  };

  public readonly reviews = {
    getByProperty: (propertyId: string) => this.get<IReview[]>(`/reviews/property/${propertyId}`),
    create: (data: CreateReviewInput) => this.post<IReview>('/reviews', data),
    createResponse: (reviewId: string, data: CreateReviewResponseInput) =>
      this.post<IReviewResponse>(`/reviews/${reviewId}/response`, data),
  };

  public readonly reports = {
    create: (data: CreateReportInput) => this.post<IReport>('/reports', data),
    getMyReports: () => this.get<IReport[]>('/reports/my-reports'),
    getAll: () => this.get<IReport[]>('/reports'),
    updateStatus: (id: string, data: { status: string; adminNotes?: string }) =>
      this.patch<IReport>(`/reports/${id}/status`, data),
  };

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getToken = config.getToken;
    this.getLocale = config.getLocale;
  }

  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    return searchParams.toString();
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.getToken) {
      const token = await this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    if (this.getLocale) {
      headers['Accept-Language'] = this.getLocale();
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({
      success: false,
      statusCode: response.status,
      error: response.statusText,
      message: 'Failed to parse JSON response',
      timestamp: new Date().toISOString(),
      path: endpoint,
    }));

    if (!response.ok || !data.success) {
      throw new ApiError(response.status, data as ApiErrorResponse);
    }

    return data as ApiResponse<T>;
  }

  public get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public post<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public put<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public patch<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
