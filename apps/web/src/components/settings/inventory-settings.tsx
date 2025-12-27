'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Switch } from '@nextpik/ui';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { Loader2, Package, AlertCircle, Save, CheckCircle2 } from 'lucide-react';

interface InventorySettings {
  'inventory.low_stock_threshold': {
    value: number;
    label: string;
    description: string;
  };
  'inventory.auto_sku_generation': {
    value: boolean;
    label: string;
    description: string;
  };
  'inventory.sku_prefix': {
    value: string;
    label: string;
    description: string;
  };
  'inventory.enable_stock_notifications': {
    value: boolean;
    label: string;
    description: string;
  };
  'inventory.allow_negative_stock': {
    value: boolean;
    label: string;
    description: string;
  };
  'inventory.transaction_history_page_size': {
    value: number;
    label: string;
    description: string;
  };
}

export function InventorySettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [settings, setSettings] = useState<InventorySettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // API client unwraps the response, so we get the array directly
      const data = await api.get<any[]>('/settings/category/inventory');

      if (data && Array.isArray(data) && data.length > 0) {
        const settingsMap: any = {};
        data.forEach((setting: any) => {
          settingsMap[setting.key] = {
            value: setting.value,
            label: setting.label,
            description: setting.description,
          };
        });
        setSettings(settingsMap);
      } else {
        // No settings found, show error
        console.warn('No inventory settings found in response');
        toast.error('No inventory settings configured');
      }
    } catch (error) {
      console.error('Failed to fetch inventory settings:', error);
      toast.error('Failed to load inventory settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      setSaving(key);
      // API client unwraps the response, so we get the updated setting directly
      const updatedSetting = await api.patch(`/settings/${key}`, { value });

      // If we got here without error, the update was successful
      toast.success('Setting updated successfully');

      // Update local state
      if (settings) {
        setSettings({
          ...settings,
          [key]: {
            ...settings[key as keyof InventorySettings],
            value,
          },
        });
      }
    } catch (error: any) {
      console.error('Failed to update setting:', error);
      toast.error(error.message || 'Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Failed to load inventory settings</p>
          <Button onClick={fetchSettings} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Thresholds
          </CardTitle>
          <CardDescription>
            Configure stock level alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Low Stock Threshold */}
          <div className="space-y-2">
            <Label htmlFor="low-stock-threshold">
              {settings['inventory.low_stock_threshold']?.label}
            </Label>
            <p className="text-sm text-muted-foreground">
              {settings['inventory.low_stock_threshold']?.description}
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="low-stock-threshold"
                type="number"
                min="0"
                value={settings['inventory.low_stock_threshold']?.value || 10}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  if (!isNaN(newValue)) {
                    setSettings({
                      ...settings,
                      'inventory.low_stock_threshold': {
                        ...settings['inventory.low_stock_threshold'],
                        value: newValue,
                      },
                    });
                  }
                }}
                className="max-w-xs"
              />
              <Button
                onClick={() =>
                  updateSetting(
                    'inventory.low_stock_threshold',
                    settings['inventory.low_stock_threshold']?.value
                  )
                }
                disabled={saving === 'inventory.low_stock_threshold'}
                size="sm"
              >
                {saving === 'inventory.low_stock_threshold' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Transaction History Page Size */}
          <div className="space-y-2">
            <Label htmlFor="transaction-page-size">
              {settings['inventory.transaction_history_page_size']?.label}
            </Label>
            <p className="text-sm text-muted-foreground">
              {settings['inventory.transaction_history_page_size']?.description}
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="transaction-page-size"
                type="number"
                min="10"
                max="100"
                value={settings['inventory.transaction_history_page_size']?.value || 20}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  if (!isNaN(newValue)) {
                    setSettings({
                      ...settings,
                      'inventory.transaction_history_page_size': {
                        ...settings['inventory.transaction_history_page_size'],
                        value: newValue,
                      },
                    });
                  }
                }}
                className="max-w-xs"
              />
              <Button
                onClick={() =>
                  updateSetting(
                    'inventory.transaction_history_page_size',
                    settings['inventory.transaction_history_page_size']?.value
                  )
                }
                disabled={saving === 'inventory.transaction_history_page_size'}
                size="sm"
              >
                {saving === 'inventory.transaction_history_page_size' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SKU Generation</CardTitle>
          <CardDescription>
            Configure automatic SKU generation for products
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto SKU Generation */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label>{settings['inventory.auto_sku_generation']?.label}</Label>
              <p className="text-sm text-muted-foreground">
                {settings['inventory.auto_sku_generation']?.description}
              </p>
            </div>
            <Switch
              checked={settings['inventory.auto_sku_generation']?.value || false}
              onCheckedChange={(checked) =>
                updateSetting('inventory.auto_sku_generation', checked)
              }
              disabled={saving === 'inventory.auto_sku_generation'}
            />
          </div>

          {/* SKU Prefix */}
          <div className="space-y-2">
            <Label htmlFor="sku-prefix">{settings['inventory.sku_prefix']?.label}</Label>
            <p className="text-sm text-muted-foreground">
              {settings['inventory.sku_prefix']?.description}
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="sku-prefix"
                value={settings['inventory.sku_prefix']?.value || 'PROD'}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    'inventory.sku_prefix': {
                      ...settings['inventory.sku_prefix'],
                      value: e.target.value.toUpperCase(),
                    },
                  });
                }}
                className="max-w-xs"
              />
              <Button
                onClick={() =>
                  updateSetting('inventory.sku_prefix', settings['inventory.sku_prefix']?.value)
                }
                disabled={saving === 'inventory.sku_prefix'}
                size="sm"
              >
                {saving === 'inventory.sku_prefix' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications & Policies</CardTitle>
          <CardDescription>
            Configure stock notifications and inventory policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stock Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label>{settings['inventory.enable_stock_notifications']?.label}</Label>
              <p className="text-sm text-muted-foreground">
                {settings['inventory.enable_stock_notifications']?.description}
              </p>
            </div>
            <Switch
              checked={settings['inventory.enable_stock_notifications']?.value || false}
              onCheckedChange={(checked) =>
                updateSetting('inventory.enable_stock_notifications', checked)
              }
              disabled={saving === 'inventory.enable_stock_notifications'}
            />
          </div>

          {/* Allow Negative Stock */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label>{settings['inventory.allow_negative_stock']?.label}</Label>
              <p className="text-sm text-muted-foreground">
                {settings['inventory.allow_negative_stock']?.description}
              </p>
            </div>
            <Switch
              checked={settings['inventory.allow_negative_stock']?.value || false}
              onCheckedChange={(checked) =>
                updateSetting('inventory.allow_negative_stock', checked)
              }
              disabled={saving === 'inventory.allow_negative_stock'}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
