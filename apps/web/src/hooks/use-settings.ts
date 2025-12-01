'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface Setting {
  key: string;
  value: any;
  label: string;
  description?: string;
  valueType: string;
  isPublic: boolean;
  isEditable: boolean;
  requiresRestart: boolean;
}

export function useSettings(category?: string) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const url = category 
        ? `${API_URL}/settings/category/${category}`
        : `${API_URL}/settings`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [API_URL, category]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, refetch: fetchSettings };
}

export function useSettingsUpdate() {
  const [updating, setUpdating] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const updateSetting = async (key: string, value: any, reason?: string) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await axios.patch(
        `${API_URL}/settings/${key}`,
        { value, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Setting updated successfully');
        return response.data.data;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update setting');
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return { updateSetting, updating };
}

export function useSettingsAudit(settingKey?: string) {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const url = settingKey
        ? `${API_URL}/settings/${settingKey}/audit`
        : `${API_URL}/settings/admin/audit-logs`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAuditLogs(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, settingKey]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return { auditLogs, loading, refetch: fetchAuditLogs };
}
