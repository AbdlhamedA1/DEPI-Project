export const NOTIFICATIONS_FEATURE = 'notifications';
export interface NotificationState {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
}
