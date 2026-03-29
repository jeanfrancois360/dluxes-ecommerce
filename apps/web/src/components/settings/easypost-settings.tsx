'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
} from '@nextpik/ui';
import {
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

interface EasyPostSettings {
  easypost_enabled: boolean;
  easypost_test_mode: boolean;
  easypost_default_label_format: 'PNG' | 'PDF' | 'ZPL' | 'EPL2';
  easypost_address_verification: boolean;
  easypost_default_carriers: string[];
}

interface EasyPostHealthStatus {
  enabled: boolean;
  configured: boolean;
  credentialsValid: boolean;
  testMode: boolean;
  webhookSecretConfigured: boolean;
  apiKey: string;
  connectionError: string | null;
  message: string;
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
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<EasyPostHealthStatus | null>(null);
  const [settings, setSettings] = useState<EasyPostSettings>({
    easypost_enabled: false,
    easypost_test_mode: true,
    easypost_default_label_format: 'PDF',
    easypost_address_verification: true,
    easypost_default_carriers: ['USPS', 'UPS', 'FedEx'],
  });

  useEffect(() => {
    loadSettings();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const data = await api.get('/easypost/health');
      setHealthStatus(data);
    } catch (error) {
      console.error('Failed to check EasyPost health:', error);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Load EasyPost settings (excluding API keys - those are in .env now)
      const settingsToLoad = [
        'easypost_enabled',
        'easypost_test_mode',
        'easypost_default_label_format',
        'easypost_address_verification',
        'easypost_default_carriers',
      ];

      const promises = settingsToLoad.map(async (key) => {
        try {
          const result = await api.get(`/settings/${key}`);
          return result;
        } catch (error: any) {
          if (error.status === 401) {
            throw new Error('AUTHENTICATION_REQUIRED');
          }
          return null;
        }
      });

      const results = await Promise.all(promises);

      const loadedSettings: any = {};
      results.forEach((result, index) => {
        if (result?.value !== undefined) {
          loadedSettings[settingsToLoad[index]] = result.value;
        }
      });

      setSettings((prev) => ({ ...prev, ...loadedSettings }));
    } catch (error: any) {
      console.error('Failed to load EasyPost settings:', error);
      if (error.message === 'AUTHENTICATION_REQUIRED') {
        toast.error('Please log in as admin to access EasyPost settings');
      } else {
        toast.error('Failed to load settings');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      await api.patch(`/settings/${key}`, { value });

      return true;
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      throw error; // Re-throw so handleSave can catch it
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(settings).map(async ([key, value]) => {
        try {
          await updateSetting(key, value);
          return { key, success: true };
        } catch (error: any) {
          return { key, success: false, error: error.message };
        }
      });

      const results = await Promise.all(updates);
      const failed = results.filter((r) => !r.success);

      if (failed.length === 0) {
        toast.success('EasyPost settings saved successfully');
        // Reload health status after saving
        await checkHealth();
      } else if (failed.length === results.length) {
        toast.error(`Failed to save settings: ${failed[0].error}`);
      } else {
        toast.error(`Some settings failed to save: ${failed.map((f) => f.key).join(', ')}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
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

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>EasyPost API connection and configuration status</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={isCheckingHealth}
              className="gap-2"
            >
              {isCheckingHealth ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {healthStatus ? (
            <>
              {/* Status Indicator */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                {healthStatus.configured && healthStatus.credentialsValid ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        {healthStatus.message}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        EasyPost is ready to process shipping requests
                      </p>
                    </div>
                  </>
                ) : healthStatus.configured && !healthStatus.credentialsValid ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        {healthStatus.message}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {healthStatus.connectionError || 'Check your API credentials'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                        {healthStatus.message}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure API credentials in environment variables
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Configuration Details */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Environment</p>
                  <p className="font-medium">
                    {healthStatus.testMode ? 'Test (Sandbox)' : 'Production'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">API Key</p>
                  <p className="font-mono text-sm">
                    {healthStatus.configured ? healthStatus.apiKey : 'Not Configured'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Webhook Secret</p>
                  <p className="font-medium">
                    {healthStatus.webhookSecretConfigured ? 'Configured ✓' : 'Not Set'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Integration Status</p>
                  <p className="font-medium">{healthStatus.enabled ? 'Enabled ✓' : 'Disabled'}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Configuration Instructions */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-base">API Configuration</CardTitle>
              <CardDescription className="mt-1">
                EasyPost API credentials are configured via <strong>environment variables</strong>{' '}
                for security.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted/50 rounded-md font-mono text-xs">
            <p className="text-muted-foreground mb-1"># Server Environment Variables:</p>
            <p>EASYPOST_API_KEY=EZTK_test_xxxxx</p>
            <p>EASYPOST_WEBHOOK_SECRET=whsec_xxxxx</p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-semibold">How to configure:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                Get your API key from{' '}
                <a
                  href="https://easypost.com/account/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  EasyPost Dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Add the environment variables to your server (apps/api/.env)</li>
              <li>Restart the API server to load new variables</li>
              <li>Click &quot;Refresh&quot; above to verify connection</li>
            </ol>
          </div>
        </CardContent>
      </Card>

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

          {/* Test Mode */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="test-mode" className="text-base">
                Test Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Use test environment for development (free, no charges)
              </p>
            </div>
            <Switch
              id="test-mode"
              checked={settings.easypost_test_mode}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, easypost_test_mode: checked }))
              }
            />
          </div>

          {settings.easypost_test_mode && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Test mode uses test API keys (EZTK_) and won&apos;t charge for label purchases.
                Perfect for development!
              </p>
            </div>
          )}
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
            <p className="text-xs text-muted-foreground">
              PDF works with standard printers. ZPL/EPL2 for thermal label printers.
            </p>
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
