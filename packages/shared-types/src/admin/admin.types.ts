export type AdminActionType =
  | 'KYC_APPROVE'
  | 'KYC_REJECT'
  | 'PROPERTY_APPROVE'
  | 'PROPERTY_REJECT'
  | 'PROPERTY_SUSPEND'
  | 'USER_SUSPEND'
  | 'USER_REACTIVATE'
  | 'REPORT_STATUS_UPDATE'
  | 'PLATFORM_SETTING_UPDATE'
  | string;

export type AdminTargetType =
  'KYC_DOCUMENT' | 'USER' | 'PROPERTY' | 'REPORT' | 'REVIEW' | 'PLATFORM_SETTING' | string;

export interface IAdminActionLog {
  id: string;
  adminId: string;
  actionType: AdminActionType;
  action?: string;
  targetType: AdminTargetType;
  targetId: string;
  details?: Record<string, any>;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string | Date;
}

export interface AuditLogQueryParams {
  adminId?: string;
  actionType?: string;
  targetType?: string;
  targetId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface AdminUserFilterParams {
  role?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateUserStatusDto {
  status: 'ACTIVE' | 'SUSPENDED';
  reason?: string;
}

export interface SuspendPropertyDto {
  reason?: string;
}

export interface AdminOverviewMetrics {
  pendingVerifications: number;
  pendingProperties: number;
  totalUsers: number;
  totalProperties: number;
  openReports?: number;
}
