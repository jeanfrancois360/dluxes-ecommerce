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
  Globe,
  Copy,
  Check,
  Zap,
  Truck,
  MapPin,
  ArrowRight,
  Sparkles,
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
  { value: 'USPS', label: 'USPS', name: 'United States Postal Service' },
  { value: 'UPS', label: 'UPS', name: 'United Parcel Service' },
  { value: 'FedEx', label: 'FedEx', name: 'Federal Express' },
  { value: 'DHL', label: 'DHL', name: 'DHL Express' },
  { value: 'CanadaPost', label: 'Canada Post', name: 'Canada Post' },
  { value: 'AustraliaPost', label: 'Australia Post', name: 'Australia Post' },
];

export function EasyPostSettingsSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [healthStatus, setHealthStatus] = useState<EasyPostHealthStatus | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
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
      toast.error('Failed to check connection status');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const data = await api.get('/easypost/health');
      if (data.credentialsValid) {
        toast.success('Connection successful! EasyPost is ready to use.');
      } else if (data.configured) {
        toast.error('Connection failed. Please check your API key.');
      } else {
        toast.error('EasyPost not configured. Add environment variables first.');
      }
      setHealthStatus(data);
    } catch (error) {
      toast.error('Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(settings).map(async ([key, value]) => {
        try {
          await api.patch(`/settings/${key}`, { value });
          return { key, success: true };
        } catch (error: any) {
          return { key, success: false, error: error.message };
        }
      });

      const results = await Promise.all(updates);
      const failed = results.filter((r) => !r.success);

      if (failed.length === 0) {
        toast.success('EasyPost settings saved successfully');
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`📋 Copied ${label} to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-[#CBB57B] mb-4" />
        <p className="text-sm text-muted-foreground">Loading EasyPost settings...</p>
      </div>
    );
  }

  const isConnected = healthStatus?.configured && healthStatus?.credentialsValid;
  const isConfigured = healthStatus?.configured;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex items-start justify-between p-6 rounded-lg bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-[#CBB57B]/10 border border-[#CBB57B]/20">
            <Truck className="h-6 w-6 text-[#CBB57B]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              EasyPost Shipping
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Multi-carrier shipping with 100+ carriers worldwide (Primary Provider)
            </p>
            <div className="flex items-center gap-2">
              <Badge
                variant={isConnected ? 'default' : isConfigured ? 'secondary' : 'outline'}
                className={
                  isConnected
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : ''
                }
              >
                {isConnected ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : isConfigured ? (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Configured
                  </>
                )}
              </Badge>
              {settings.easypost_enabled && (
                <Badge className="bg-[#CBB57B]/20 text-[#CBB57B] border border-[#CBB57B]/30">
                  <Zap className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              )}
              {healthStatus?.testMode && (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  Test Mode
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={testConnection}
          disabled={isTesting || isCheckingHealth}
          className="gap-2 bg-white dark:bg-gray-800"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Test Connection
            </>
          )}
        </Button>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                Connection Status
              </CardTitle>
              <CardDescription>Real-time EasyPost API connection status</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkHealth}
              disabled={isCheckingHealth}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {healthStatus ? (
            <>
              {/* Status Indicator */}
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
                  isConnected
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                    : isConfigured
                      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800'
                }`}
              >
                {isConnected ? (
                  <>
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                        ✨ {healthStatus.message}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your EasyPost account is connected and ready to provide shipping rates from
                        100+ carriers worldwide.
                      </p>
                    </div>
                  </>
                ) : isConfigured ? (
                  <>
                    <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                        ⚠️ {healthStatus.message}
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                        {healthStatus.connectionError || 'Unable to verify your API key'}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        💡 Double-check your EASYPOST_API_KEY in the .env file
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-900/30">
                      <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        🔧 {healthStatus.message}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Follow the setup steps below to connect your EasyPost account
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Configuration Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">API Key</p>
                  <p className="font-mono text-sm truncate">
                    {healthStatus.configured ? healthStatus.apiKey : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <p className="font-medium text-sm">
                    {isConnected ? (
                      <span className="text-green-600 dark:text-green-400">✓ Connected</span>
                    ) : isConfigured ? (
                      <span className="text-yellow-600 dark:text-yellow-400">⚠ Invalid</span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">○ Not Set</span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Environment</p>
                  <p className="font-medium text-sm">
                    {healthStatus.testMode ? 'Test (Free)' : 'Production'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Webhook</p>
                  <p className="font-medium text-sm">
                    {healthStatus.webhookSecretConfigured ? '✓ Set' : '○ Not Set'}
                  </p>
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

      {/* Setup Guide Card */}
      {!isConnected && (
        <Card className="border-[#CBB57B]/30 bg-[#CBB57B]/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#CBB57B]" />
              <CardTitle>Quick Setup Guide</CardTitle>
            </div>
            <CardDescription>Get EasyPost up and running in 3 easy steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#CBB57B] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  Get your EasyPost API key
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Sign in to your EasyPost account and navigate to the API keys section
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://easypost.com/account/api-keys', '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open EasyPost Dashboard
                </Button>
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700" />

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#CBB57B] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Add API key to your server
                </p>
                <div className="bg-gray-900 dark:bg-black rounded-lg p-3 relative group">
                  <code className="text-xs text-green-400 block space-y-1">
                    <div className="text-gray-500"># Add to apps/api/.env</div>
                    <div>EASYPOST_API_KEY=EZTK_your_test_key</div>
                    <div className="text-gray-500"># Optional: for webhook verification</div>
                    <div>EASYPOST_WEBHOOK_SECRET=whsec_your_secret</div>
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        'EASYPOST_API_KEY=EZTK_your_test_key\nEASYPOST_WEBHOOK_SECRET=whsec_your_secret',
                        'environment variables'
                      )
                    }
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copied === 'environment variables' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Use <code>EZTK_</code> prefix for test mode (free), <code>EZAK_</code> for
                  production
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700" />

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#CBB57B] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Restart and test</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Restart your API server to load the new environment variables, then click the
                    "Test Connection" button above.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[#CBB57B]">
                    <ArrowRight className="h-4 w-4" />
                    <span>Once connected, configure preferences and enable below</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Carrier Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Preferred Carriers</CardTitle>
          </div>
          <CardDescription>
            Select which carriers to show shipping rates for (select at least one)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {AVAILABLE_CARRIERS.map((carrier) => (
              <div
                key={carrier.value}
                onClick={() => toggleCarrier(carrier.value)}
                className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                  settings.easypost_default_carriers.includes(carrier.value)
                    ? 'border-[#CBB57B] bg-[#CBB57B]/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-[#CBB57B]" />
                  <span className="font-semibold">{carrier.label}</span>
                  {settings.easypost_default_carriers.includes(carrier.value) && (
                    <CheckCircle2 className="h-4 w-4 text-[#CBB57B] ml-auto" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{carrier.name}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-[#CBB57B]/10 border border-[#CBB57B]/20">
            <p className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#CBB57B]" />
              <span>
                <strong>Selected:</strong> {settings.easypost_default_carriers.length} carrier
                {settings.easypost_default_carriers.length !== 1 ? 's' : ''} will be shown to
                customers
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Preferences</CardTitle>
          <CardDescription>Configure default shipping options and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Mode */}
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed">
            <div>
              <Label htmlFor="test-mode" className="text-base font-semibold cursor-pointer">
                {settings.easypost_test_mode ? 'Test Mode (Free)' : 'Production Mode'}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {settings.easypost_test_mode
                  ? 'Using test environment - no charges for label purchases'
                  : 'Using production environment - real charges apply'}
              </p>
            </div>
            <Switch
              id="test-mode"
              checked={settings.easypost_test_mode}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, easypost_test_mode: checked }))
              }
              className="data-[state=checked]:bg-orange-600"
            />
          </div>

          {/* Label Format */}
          <div className="space-y-2">
            <Label htmlFor="label-format" className="text-base font-semibold">
              Default Label Format
            </Label>
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
                <SelectItem value="PDF">PDF (Recommended - Standard Printers)</SelectItem>
                <SelectItem value="PNG">PNG (Image Format)</SelectItem>
                <SelectItem value="ZPL">ZPL (Zebra Thermal Printers)</SelectItem>
                <SelectItem value="EPL2">EPL2 (Thermal Label Printers)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              PDF works with standard printers. ZPL/EPL2 for thermal label printers.
            </p>
          </div>

          {/* Address Verification */}
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed">
            <div>
              <Label
                htmlFor="address-verification"
                className="text-base font-semibold cursor-pointer flex items-center gap-2"
              >
                {settings.easypost_address_verification && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                Address Verification
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Verify and standardize addresses before creating shipments
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
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Enable/Disable Card */}
      <Card className={isConnected ? 'border-green-200 dark:border-green-800' : ''}>
        <CardHeader>
          <CardTitle>Integration Control</CardTitle>
          <CardDescription>
            {isConnected
              ? 'Your EasyPost integration is ready to use as the primary shipping provider'
              : 'Enable once you have configured and tested the connection'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed">
            <div>
              <Label
                htmlFor="enabled"
                className="text-base font-semibold cursor-pointer flex items-center gap-2"
              >
                {settings.easypost_enabled ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    EasyPost Enabled (Primary)
                  </>
                ) : (
                  'Enable EasyPost'
                )}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {settings.easypost_enabled
                  ? 'EasyPost is the primary provider for shipping rates'
                  : 'Turn on to use EasyPost as the primary shipping provider'}
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.easypost_enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, easypost_enabled: checked }))
              }
              disabled={!isConnected}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          {!isConnected && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Connection required:</strong> Complete the setup guide above and test the
                connection before enabling.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
        <div className="text-sm text-muted-foreground">
          {settings.easypost_enabled
            ? 'EasyPost will be used as the primary shipping provider'
            : 'Changes will be saved to system settings'}
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="gap-2 bg-[#CBB57B] hover:bg-[#B8A066]"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
