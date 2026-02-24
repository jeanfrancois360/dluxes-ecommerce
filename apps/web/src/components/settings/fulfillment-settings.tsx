'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Switch } from '@nextpik/ui';
import { Loader2, Save, Package, Truck, ExternalLink, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import { toast } from '@/lib/utils/toast';

interface FulfillmentSetting {
  key: string;
  value: boolean | string | number;
  label: string;
  description: string;
  valueType: string;
}

export function FulfillmentSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, FulfillmentSetting>>({});

  const settingsConfig = [
    {
      key: 'gelato_enabled',
      label: 'Gelato POD Enabled',
      description: 'Enable Gelato print-on-demand integration for the platform',
      type: 'boolean',
      icon: Package,
    },
    {
      key: 'gelato_auto_submit_orders',
      label: 'Auto-Submit POD Orders',
      description: 'Automatically submit POD orders to Gelato when payment is confirmed',
      type: 'boolean',
      icon: Truck,
    },
    {
      key: 'gelato_default_shipping_method',
      label: 'Default Shipping Method',
      description: 'Default Gelato shipping method (standard, express, overnight)',
      type: 'string',
      options: ['standard', 'express', 'overnight'],
    },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsData: Record<string, FulfillmentSetting> = {};

      for (const config of settingsConfig) {
        try {
          const response = await api.get(`/settings/${config.key}`);
          if (response.data) {
            settingsData[config.key] = response.data;
          }
        } catch (error) {
          console.warn(`Setting ${config.key} not found, using default`);
          settingsData[config.key] = {
            key: config.key,
            value: config.type === 'boolean' ? false : 'standard',
            label: config.label,
            description: config.description,
            valueType: config.type,
          };
        }
      }

      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load fulfillment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: boolean | string | number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
  };

  const saveSetting = async (key: string) => {
    try {
      setSaving(true);
      const setting = settings[key];
      await api.patch(`/settings/${key}`, { value: setting.value });
      toast.success(`${setting.label} updated successfully`);
    } catch (error: any) {
      console.error(`Failed to save ${key}:`, error);
      toast.error(error.response?.data?.message || `Failed to update ${settings[key].label}`);
    } finally {
      setSaving(false);
    }
  };

  const saveAllSettings = async () => {
    try {
      setSaving(true);
      const savePromises = Object.keys(settings).map((key) =>
        api.patch(`/settings/${key}`, { value: settings[key].value })
      );
      await Promise.all(savePromises);
      toast.success('All fulfillment settings saved successfully');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save some settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#CBB57B]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#CBB57B]" />
                Fulfillment Settings
              </CardTitle>
              <CardDescription>
                Configure print-on-demand and order fulfillment settings
              </CardDescription>
            </div>
            <Button onClick={saveAllSettings} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save All
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Gelato POD Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gelato Print-on-Demand</CardTitle>
          <CardDescription>
            Configure Gelato integration for automatic order fulfillment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Important Notice */}
          {settings['gelato_enabled']?.value === true &&
            settings['gelato_auto_submit_orders']?.value === false && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">Manual Order Submission</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Gelato is enabled but auto-submit is off. Orders will need to be manually
                    submitted to Gelato after payment confirmation.
                  </p>
                </div>
              </div>
            )}

          {/* Gelato Enabled */}
          {settings['gelato_enabled'] && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-medium">{settings['gelato_enabled'].label}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {settings['gelato_enabled'].description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings['gelato_enabled'].value as boolean}
                  onCheckedChange={(checked) => handleSettingChange('gelato_enabled', checked)}
                  disabled={saving}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveSetting('gelato_enabled')}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          )}

          {/* Auto-Submit Orders */}
          {settings['gelato_auto_submit_orders'] && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-medium">
                  {settings['gelato_auto_submit_orders'].label}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {settings['gelato_auto_submit_orders'].description}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  ℹ️ When enabled, orders are automatically sent to Gelato when payment succeeds
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings['gelato_auto_submit_orders'].value as boolean}
                  onCheckedChange={(checked) =>
                    handleSettingChange('gelato_auto_submit_orders', checked)
                  }
                  disabled={saving || (settings['gelato_enabled']?.value as boolean) === false}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveSetting('gelato_auto_submit_orders')}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          )}

          {/* Default Shipping Method */}
          {settings['gelato_default_shipping_method'] && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-medium">
                  {settings['gelato_default_shipping_method'].label}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {settings['gelato_default_shipping_method'].description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={settings['gelato_default_shipping_method'].value as string}
                  onChange={(e) =>
                    handleSettingChange('gelato_default_shipping_method', e.target.value)
                  }
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                >
                  <option value="standard">Standard (5-7 business days)</option>
                  <option value="express">Express (2-3 business days)</option>
                  <option value="overnight">Overnight (1 business day)</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveSetting('gelato_default_shipping_method')}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          )}

          {/* Seller Gelato Settings Link */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Seller Gelato Accounts</p>
              <p className="text-sm text-blue-700 mt-1">
                Sellers can connect their own Gelato accounts for POD fulfillment. Platform
                credentials serve as fallback.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2 text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              <a href="/seller/gelato-settings" target="_blank" rel="noopener noreferrer">
                View Guide
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
