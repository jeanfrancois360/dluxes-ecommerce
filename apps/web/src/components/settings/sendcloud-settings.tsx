'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Label,
  Switch,
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
  Package,
  MapPin,
  ArrowRight,
  Sparkles,
  DollarSign,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

interface SendCloudSettings {
  sendcloud_enabled: boolean;
}

interface SendCloudHealthStatus {
  enabled: boolean;
  configured: boolean;
  credentialsValid: boolean;
  publicKey: string;
  connectionError: string | null;
  message: string;
  supportedCountries: string[];
}

const SENDCLOUD_COUNTRIES = [
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'GB', name: 'United Kingdom' },
];

export function SendCloudSettingsSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [healthStatus, setHealthStatus] = useState<SendCloudHealthStatus | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [settings, setSettings] = useState<SendCloudSettings>({
    sendcloud_enabled: false,
  });

  useEffect(() => {
    loadSettings();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const data = await api.get('/sendcloud/health');
      setHealthStatus(data);
    } catch (error) {
      console.error('Failed to check SendCloud health:', error);
      toast.error('Failed to check connection status');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const data = await api.get('/sendcloud/health');
      if (data.credentialsValid) {
        toast.success('Connection successful! SendCloud is ready to use.');
      } else if (data.configured) {
        toast.error('Connection failed. Please check your API credentials.');
      } else {
        toast.error('SendCloud not configured. Add environment variables first.');
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
      const result = await api.get('/settings/sendcloud_enabled');
      if (result?.value !== undefined) {
        setSettings({ sendcloud_enabled: result.value });
      }
    } catch (error: any) {
      console.error('Failed to load SendCloud settings:', error);
      if (error.status === 401) {
        toast.error('Please log in as admin to access SendCloud settings');
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
      await api.patch('/settings/sendcloud_enabled', { value: settings.sendcloud_enabled });
      toast.success('SendCloud settings saved successfully');
      await checkHealth();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-[#CBB57B] mb-4" />
        <p className="text-sm text-muted-foreground">Loading SendCloud settings...</p>
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
            <Package className="h-6 w-6 text-[#CBB57B]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              SendCloud Shipping
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              European shipping integration with multiple carriers across 13 countries
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
              {settings.sendcloud_enabled && (
                <Badge className="bg-[#CBB57B]/20 text-[#CBB57B] border border-[#CBB57B]/30">
                  <Zap className="h-3 w-3 mr-1" />
                  Enabled
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
              <CardDescription>Real-time SendCloud API connection status</CardDescription>
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
                      <p className="font-semibold text-green-900 dark:text-green-100 mb-1 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {healthStatus.message}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your SendCloud account is connected and ready to provide shipping rates for
                        European orders.
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
                        {healthStatus.message}
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                        {healthStatus.connectionError || 'Unable to verify your API credentials'}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Double-check your SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY in the .env
                        file
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-900/30">
                      <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {healthStatus.message}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Follow the setup steps below to connect your SendCloud account
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Configuration Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Public Key</p>
                  <p className="font-mono text-sm truncate">
                    {healthStatus.configured ? healthStatus.publicKey : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <p className="font-medium text-sm">
                    {isConnected ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                      </span>
                    ) : isConfigured ? (
                      <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Invalid
                      </span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Not Set
                      </span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Currency</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    EUR (Euro)
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
            <CardDescription>Get SendCloud up and running in 3 easy steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#CBB57B] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  Get your SendCloud API credentials
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Sign in to your SendCloud account and navigate to the integrations page
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open('https://panel.sendcloud.sc/settings/integrations/api', '_blank')
                  }
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open SendCloud Dashboard
                </Button>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent dark:via-blue-800" />

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#CBB57B] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Add credentials to your server
                </p>
                <div className="bg-gray-900 dark:bg-black rounded-lg p-3 relative group">
                  <code className="text-xs text-green-400 block space-y-1">
                    <div className="text-gray-500"># Add to apps/api/.env</div>
                    <div>SENDCLOUD_PUBLIC_KEY=your_public_key</div>
                    <div>SENDCLOUD_SECRET_KEY=your_secret_key</div>
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        'SENDCLOUD_PUBLIC_KEY=your_public_key\nSENDCLOUD_SECRET_KEY=your_secret_key',
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
                  Replace <code>your_public_key</code> and <code>your_secret_key</code> with your
                  actual credentials
                </p>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent dark:via-blue-800" />

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
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <ArrowRight className="h-4 w-4" />
                    <span>Once connected, enable the integration below</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supported Countries */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Supported European Countries</CardTitle>
          </div>
          <CardDescription>
            SendCloud provides shipping rates for these 13 European markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {SENDCLOUD_COUNTRIES.map((country) => (
              <div
                key={country.code}
                className="flex items-center gap-2 p-2.5 rounded-lg border bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-md transition-shadow"
              >
                <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {country.code}
                  </p>
                  <p className="text-sm truncate">{country.name}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>
                <strong>Currency:</strong> All SendCloud rates are provided in EUR (Euro)
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Enable/Disable Card */}
      <Card className={isConnected ? 'border-green-200 dark:border-green-800' : ''}>
        <CardHeader>
          <CardTitle>Integration Control</CardTitle>
          <CardDescription>
            {isConnected
              ? 'Your SendCloud integration is ready to use'
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
                {settings.sendcloud_enabled ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    SendCloud Enabled
                  </>
                ) : (
                  'Enable SendCloud'
                )}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {settings.sendcloud_enabled
                  ? 'SendCloud is providing shipping rates for European orders'
                  : 'Turn on to start using SendCloud for European shipping'}
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.sendcloud_enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, sendcloud_enabled: checked }))
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
          {settings.sendcloud_enabled
            ? 'SendCloud will be used for European shipping'
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
