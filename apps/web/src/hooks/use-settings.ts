'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import * as settingsApi from '@/lib/api/settings';
import type { Setting, SettingAuditLog } from '@/lib/api/settings';

export function useSettings(category?: string) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = category
        ? await settingsApi.getSettingsByCategory(category)
        : await settingsApi.getAllSettings();

      setSettings(data);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch settings';
      setError(errorMessage);

      // Only show toast for non-404 errors
      if (err.status !== 404) {
        toast.error('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, refetch: fetchSettings };
}

export function useSettingsUpdate() {
  const [updating, setUpdating] = useState(false);

  const updateSetting = async (key: string, value: any, reason?: string) => {
    try {
      setUpdating(true);
      const data = await settingsApi.updateSetting(key, value, reason);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update setting';
      toast.error(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return { updateSetting, updating };
}

export function useSettingsAudit(settingKey?: string) {
  const [auditLogs, setAuditLogs] = useState<SettingAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = settingKey
        ? await settingsApi.getSettingAuditLog(settingKey)
        : await settingsApi.getAllAuditLogs();

      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [settingKey]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return { auditLogs, loading, refetch: fetchAuditLogs };
}
