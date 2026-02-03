/**
 * Notification Preferences API Client
 *
 * API methods for managing user notification preferences
 */

import { api } from './client';

export interface NotificationPreferences {
  id: string;
  userId: string;
  notifications: boolean;
  newsletter: boolean;

  // Email preferences
  emailOrderConfirmation: boolean;
  emailOrderShipped: boolean;
  emailOrderDelivered: boolean;
  emailPaymentReceipt: boolean;
  emailRefundProcessed: boolean;
  emailPromotions: boolean;
  emailPriceDrops: boolean;
  emailBackInStock: boolean;
  emailReviewReminder: boolean;
  emailSecurityAlerts: boolean;

  // Push preferences
  pushOrderUpdates: boolean;
  pushPromotions: boolean;
  pushPriceDrops: boolean;
  pushBackInStock: boolean;
  pushSecurityAlerts: boolean;
}

export interface NotificationPreferencesResponse {
  success: boolean;
  data: NotificationPreferences;
  message?: string;
}

export type NotificationPreferencesUpdate = Partial<Omit<NotificationPreferences, 'id' | 'userId'>>;

export const notificationPreferencesApi = {
  /**
   * Get notification preferences for current user
   */
  getPreferences: () =>
    api.get<NotificationPreferencesResponse>('/users/notification-preferences'),

  /**
   * Update notification preferences for current user
   */
  updatePreferences: (data: NotificationPreferencesUpdate) =>
    api.patch<NotificationPreferencesResponse>('/users/notification-preferences', data),
};

export default notificationPreferencesApi;
