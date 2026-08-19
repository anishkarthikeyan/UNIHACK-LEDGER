// Shared notification models. Both the in-app and push channels consume the same payload shape
// so a single call site (a "trigger point" — see NotificationService.notify) can fan out to
// whichever channels are actually configured without the caller knowing which ones exist.

export type NotificationType =
  | 'interest' | 'team_invite' | 'team_join_request' | 'verification' | 'update'
  | 'registration_submitted' | 'registration_reviewed' | 'achievement_reviewed' | 'project_reviewed' | 'suggestion_reviewed' | 'general';

export interface NotificationPayload {
  recipientId: string;
  type: NotificationType;
  title: string;
  body?: string;
  actionUrl?: string;
}

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  createdAt: string;
}

export interface InAppNotificationRecord extends NotificationPayload {
  id: string;
  readAt: string | null;
  createdAt: string;
}
