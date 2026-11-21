import {
  ApiResponse,
  ApiErrorResponse,
  IUser,
  IStudentProfile,
  IOwnerProfile,
  IProperty,
  IBookingRequest,
  PaginatedResponse,
} from '@repo/shared-types';
import {
  CreatePropertyInput,
  SearchPropertyFilterInput,
  CreateBookingRequestInput,
  UpdateBookingStatusInput,
  LoginInput,
  RegisterStudentInput,
  RegisterOwnerInput,
} from '@repo/validation';
import { VerifyOtpDto, RequestOtpDto, AuthTokensResponse, RequestOtpResponse } from './contracts';

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
        : errorResponse.message.join(', '),
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
  };

  public readonly properties = {
    list: (params?: SearchPropertyFilterInput) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined) searchParams.append(key, String(val));
        });
      }
      const qs = searchParams.toString();
      return this.get<PaginatedResponse<IProperty>>(`/properties${qs ? `?${qs}` : ''}`);
    },

    getById: (id: string) => this.get<IProperty>(`/properties/${id}`),

    create: (data: CreatePropertyInput) => this.post<IProperty>('/properties', data),
  };

  public readonly bookingRequests = {
    create: (data: CreateBookingRequestInput) =>
      this.post<IBookingRequest>('/booking-requests', data),

    getById: (id: string) => this.get<IBookingRequest>(`/booking-requests/${id}`),

    getByStudent: (studentId: string) =>
      this.get<IBookingRequest[]>(`/booking-requests/student/${studentId}`),

    updateStatus: (id: string, data: UpdateBookingStatusInput) =>
      this.patch<IBookingRequest>(`/booking-requests/${id}/status`, data),
  };

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getToken = config.getToken;
    this.getLocale = config.getLocale;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

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
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
