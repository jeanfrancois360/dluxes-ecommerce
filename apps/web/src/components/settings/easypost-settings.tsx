'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, CheckCircle2, XCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface EasyPostSettings {
  easypost_enabled: boolean;
  easypost_api_key: string;
  easypost_test_mode: boolean;
  easypost_webhook_secret: string;
  easypost_default_label_format: 'PNG' | 'PDF' | 'ZPL' | 'EPL2';
  easypost_address_verification: boolean;
  easypost_default_carriers: string[];
}

const AVAILABLE_CARRIERS = [
  { value: 'USPS', label: 'USPS' },
  { value: 'UPS', label: 'UPS' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'DHL', label: 'DHL Express' },
  { value: 'CanadaPost', label: 'Canada Post' },
  { value: 'AustraliaPost', label: 'Australia Post' },
];

export function EasyPostSettingsSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [settings, setSettings] = useState<EasyPostSettings>({
    easypost_enabled: false,
    easypost_api_key: '',
    easypost_test_mode: true,
    easypost_webhook_secret: '',
    easypost_default_label_format: 'PDF',
    easypost_address_verification: true,
    easypost_default_carriers: ['USPS', 'UPS', 'FedEx'],
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Load all EasyPost settings
      const settingsToLoad = [
        'easypost_enabled',
        'easypost_api_key',
        'easypost_test_mode',
        'easypost_webhook_secret',
        'easypost_default_label_format',
        'easypost_address_verification',
        'easypost_default_carriers',
      ];

      const promises = settingsToLoad.map((key) =>
        fetch(`/api/v1/settings/${key}`, { credentials: 'include' })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      );

      const results = await Promise.all(promises);

      const loadedSettings: any = {};
      results.forEach((result, index) => {
        if (result?.value !== undefined) {
          loadedSettings[settingsToLoad[index]] = result.value;
        }
      });

      setSettings((prev) => ({ ...prev, ...loadedSettings }));
    } catch (error) {
      console.error('Failed to load EasyPost settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const response = await fetch(`/api/v1/settings/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      return true;
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      return false;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => updateSetting(key, value));

      const results = await Promise.all(updates);

      if (results.every((r) => r)) {
        toast.success('EasyPost settings saved successfully');
      } else {
        toast.error('Some settings failed to save');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCarrier = (carrier: string) => {
    setSettings((prev) => {
      const carriers = prev.easypost_default_carriers;
      if (carriers.includes(carrier)) {
        return {
          ...prev,
          easypost_default_carriers: carriers.filter((c) => c !== carrier),
        };
      } else {
        return {
          ...prev,
          easypost_default_carriers: [...carriers, carrier],
        };
      }
    });
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 16) return key;
    const start = key.substring(0, 12);
    const end = key.substring(key.length - 12);
    return `${start}${'•'.repeat(16)}${end}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">EasyPost Shipping</h2>
          <p className="text-muted-foreground">
            Multi-carrier shipping integration with 100+ carriers worldwide
          </p>
        </div>
        <Badge variant={settings.easypost_enabled ? 'default' : 'secondary'}>
          {settings.easypost_enabled ? (
            <>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Enabled
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Disabled
            </>
          )}
        </Badge>
      </div>

      {/* Enable/Disable Card */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>Enable or disable EasyPost shipping integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled" className="text-base">
                Enable EasyPost
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, EasyPost becomes the primary shipping provider
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.easypost_enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, easypost_enabled: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Configure your EasyPost API credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="api-key">API Key</Label>
              <a
                href="https://easypost.com/account/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Get API Key
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? 'text' : 'password'}
                value={
                  showApiKey ? settings.easypost_api_key : maskApiKey(settings.easypost_api_key)
                }
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    easypost_api_key: e.target.value,
                  }))
                }
                placeholder="EASYPOST_TEST_xxxxx or EASYPOST_PROD_xxxxx"
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use test key (EASYPOST_TEST_) for development, production key (EASYPOST_PROD_) for
              live transactions
            </p>
          </div>

          {/* Test Mode */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="test-mode" className="text-base">
                Test Mode
              </Label>
              <p className="text-sm text-muted-foreground">Use test environment for development</p>
            </div>
            <Switch
              id="test-mode"
              checked={settings.easypost_test_mode}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, easypost_test_mode: checked }))
              }
            />
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
            <div className="relative">
              <Input
                id="webhook-secret"
                type={showWebhookSecret ? 'text' : 'password'}
                value={settings.easypost_webhook_secret}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    easypost_webhook_secret: e.target.value,
                  }))
                }
                placeholder="Webhook HMAC secret"
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              >
                {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Optional: Add webhook secret for signature verification
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Preferences</CardTitle>
          <CardDescription>Configure default shipping options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Label Format */}
          <div className="space-y-2">
            <Label htmlFor="label-format">Default Label Format</Label>
            <Select
              value={settings.easypost_default_label_format}
              onValueChange={(value: any) =>
                setSettings((prev) => ({
                  ...prev,
                  easypost_default_label_format: value,
                }))
              }
            >
              <SelectTrigger id="label-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF (Recommended)</SelectItem>
                <SelectItem value="PNG">PNG Image</SelectItem>
                <SelectItem value="ZPL">ZPL (Thermal Printers)</SelectItem>
                <SelectItem value="EPL2">EPL2 (Thermal Printers)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Address Verification */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="address-verification" className="text-base">
                Address Verification
              </Label>
              <p className="text-sm text-muted-foreground">
                Verify and standardize addresses before shipping
              </p>
            </div>
            <Switch
              id="address-verification"
              checked={settings.easypost_address_verification}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  easypost_address_verification: checked,
                }))
              }
            />
          </div>

          {/* Default Carriers */}
          <div className="space-y-2">
            <Label>Default Carriers</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select carriers to show rates for (select at least one)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_CARRIERS.map((carrier) => (
                <div
                  key={carrier.value}
                  onClick={() => toggleCarrier(carrier.value)}
                  className={`cursor-pointer p-3 border rounded-lg transition-all ${
                    settings.easypost_default_carriers.includes(carrier.value)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{carrier.label}</span>
                    {settings.easypost_default_carriers.includes(carrier.value) && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
