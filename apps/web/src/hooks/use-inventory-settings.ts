import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { INVENTORY_DEFAULTS } from '@/lib/constants/inventory';

export interface InventorySettings {
  lowStockThreshold: number;
  autoSkuGeneration: boolean;
  skuPrefix: string;
  enableStockNotifications: boolean;
  notificationRecipients: string[];
  allowNegativeStock: boolean;
  transactionHistoryPageSize: number;
}

/**
 * Hook to fetch and use inventory settings from the backend
 * Falls back to constants if settings aren't available
 */
export function useInventorySettings() {
  const [settings, setSettings] = useState<InventorySettings>({
    lowStockThreshold: INVENTORY_DEFAULTS.LOW_STOCK_THRESHOLD,
    autoSkuGeneration: true,
    skuPrefix: 'PROD',
    enableStockNotifications: true,
    notificationRecipients: [],
    allowNegativeStock: false,
    transactionHistoryPageSize: INVENTORY_DEFAULTS.TRANSACTION_HISTORY_PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const response = await api.get('/settings/inventory/all');

        if (response.success && response.data) {
          setSettings(response.data);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch inventory settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch settings');
        // Keep using defaults from state
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    // Helper getters for common settings
    lowStockThreshold: settings.lowStockThreshold,
    transactionHistoryPageSize: settings.transactionHistoryPageSize,
  };
}
