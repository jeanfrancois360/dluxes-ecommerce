/**
 * Settings API Client
 * Type-safe wrapper for settings endpoints
 */

import { api } from './client';

export interface Setting {
  key: string;
  value: any;
  label: string;
  description?: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY';
  category: string;
  isPublic: boolean;
  isEditable: boolean;
  requiresRestart: boolean;
}

export interface SettingAuditLog {
  id: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedByEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ROLLBACK';
  reason?: string;
  createdAt: string;
}

export interface UpdateSettingDto {
  value: any;
  reason?: string;
}

export interface CreateSettingDto {
  key: string;
  category: string;
  value: any;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY';
  label: string;
  description?: string;
  isPublic?: boolean;
  isEditable?: boolean;
  requiresRestart?: boolean;
}

/**
 * Settings API
 */
export const settingsAPI = {
  /**
   * Get all settings (Admin only)
   */
  getAll: () => api.get<Setting[]>('/settings'),

  /**
   * Get settings by category (Admin only)
   */
  getByCategory: (category: string) =>
    api.get<Setting[]>(`/settings/category/${category}`),

  /**
   * Get a single setting by key
   */
  get: (key: string) => api.get<Setting>(`/settings/${key}`),

  /**
   * Get public settings (No auth required)
   */
  getPublic: () => api.get<Setting[]>('/settings/public'),

  /**
   * Get public settings (Alias for getPublic for backward compatibility)
   */
  getPublicSettings: () => api.get<Setting[]>('/settings/public'),

  /**
   * Update a setting (Admin only)
   */
  update: (key: string, dto: UpdateSettingDto) =>
    api.patch<Setting>(`/settings/${key}`, dto),

  /**
   * Create a new setting (Admin only)
   */
  create: (dto: CreateSettingDto) => api.post<Setting>('/settings', dto),

  /**
   * Delete a setting (Admin only)
   */
  delete: (key: string) => api.delete(`/settings/${key}`),

  /**
   * Get audit log for a setting (Admin only)
   */
  getAuditLog: (key: string, limit?: number) =>
    api.get<SettingAuditLog[]>(`/settings/${key}/audit`, {
      ...(limit && { params: { limit } }),
    } as any),

  /**
   * Get all audit logs (Admin only)
   */
  getAllAuditLogs: (limit?: number) =>
    api.get<SettingAuditLog[]>('/settings/admin/audit-logs', {
      ...(limit && { params: { limit } }),
    } as any),

  /**
   * Rollback a setting to a previous value (Admin only)
   */
  rollback: (auditLogId: string) =>
    api.post('/settings/rollback', { auditLogId }),

  /**
   * Get Stripe publishable key (Public)
   */
  getStripePublishableKey: () =>
    api.get<{ publishableKey: string }>('/settings/stripe/publishable-key'),

  /**
   * Check if Stripe is configured (Public)
   */
  isStripeConfigured: () =>
    api.get<{ configured: boolean }>('/settings/stripe/configured'),

  /**
   * Get Stripe status (Admin only)
   */
  getStripeStatus: () => api.get('/settings/stripe/status'),

  /**
   * Reload Stripe configuration (Admin only)
   */
  reloadStripeConfig: () => api.post('/settings/stripe/reload'),

  /**
   * Get inventory settings (Public)
   */
  getInventorySettings: () => api.get('/settings/inventory/all'),
};

// Export lowercase alias for backward compatibility
export const settingsApi = settingsAPI;

// Export individual functions for convenience
export const getAllSettings = () => settingsAPI.getAll();
export const getSettingsByCategory = (category: string) =>
  settingsAPI.getByCategory(category);
export const getSetting = (key: string) => settingsAPI.get(key);
export const getPublicSettings = () => settingsAPI.getPublic();
export const updateSetting = (key: string, value: any, reason?: string) =>
  settingsAPI.update(key, { value, reason });
export const createSetting = (dto: CreateSettingDto) => settingsAPI.create(dto);
export const deleteSetting = (key: string) => settingsAPI.delete(key);
export const getSettingAuditLog = (key: string, limit?: number) =>
  settingsAPI.getAuditLog(key, limit);
export const getAllAuditLogs = (limit?: number) =>
  settingsAPI.getAllAuditLogs(limit);
export const rollbackSetting = (auditLogId: string) =>
  settingsAPI.rollback(auditLogId);
