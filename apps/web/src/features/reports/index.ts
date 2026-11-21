export const REPORTS_FEATURE = 'reports';
export interface ReportState {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
}
