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
  Truck,
  ArrowRight,
  Sparkles,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

interface DhlSettings {
  dhl_enabled: boolean;
}

interface DhlHealthStatus {
  rates: {
    enabled: boolean;
    configured: boolean;
    credentialsValid?: boolean;
    environment: string;
  };
  shipments: {
    enabled: boolean;
    configured: boolean;
  };
  overall: {
    healthy: boolean;
    message: string;
  };
}

export function DhlSettingsSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [healthStatus, setHealthStatus] = useState<DhlHealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [settings, setSettings] = useState<DhlSettings>({ dhl_enabled: false });

  useEffect(() => {
    loadSettings();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    setHealthError(null);
    try {
      const data = await api.get('/dhl/health');
      // Response shape: { success: true, data: { rates, shipments, overall } }
      setHealthStatus(data?.data ?? data);
    } catch (error: any) {
      if (error?.status === 401 || error?.status === 403) {
        setHealthError('Admin login required to view DHL connection status.');
      } else {
        setHealthError('Failed to retrieve DHL health status.');
      }
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const data = await api.get('/dhl/health');
      const status: DhlHealthStatus = data?.data ?? data;
      setHealthStatus(status);
      if (status.overall.healthy) {
        toast.success('Connection successful! DHL Express is ready to use.');
      } else if (status.rates.configured) {
        toast.error('Connection failed. Please check your API key and secret.');
      } else {
        toast.error('DHL not configured. Add environment variables first.');
      }
    } catch (error: any) {
      if (error?.status === 401 || error?.status === 403) {
        toast.error('Admin authentication required to test DHL connection.');
      } else {
        toast.error('Failed to test connection');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const result = await api.get('/settings/dhl_enabled');
      if (result?.value !== undefined) {
        setSettings({ dhl_enabled: result.value });
      }
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Please log in as admin to access DHL settings');
      } else {
        toast.error('Failed to load DHL settings');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/settings/dhl_enabled', { value: settings.dhl_enabled });
      toast.success('DHL settings saved successfully');
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
        <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mb-4" />
        <p className="text-sm text-muted-foreground">Loading DHL settings...</p>
      </div>
    );
  }

  const isConnected = healthStatus?.overall.healthy ?? false;
  const isConfigured = healthStatus?.rates.configured ?? false;
  const environment = healthStatus?.rates.environment ?? 'test';

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex items-start justify-between p-6 rounded-lg bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Truck className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">DHL Express</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Premium express shipping worldwide — Tier 4 fallback after EasyPost and EasyShip
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
              {isConnected && (
                <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300">
                  {environment === 'production' ? 'Production' : 'Test Mode'}
                </Badge>
              )}
              {settings.dhl_enabled && (
                <Badge className="bg-yellow-500/20 text-yellow-700 border border-yellow-500/30">
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
              <CardDescription>Real-time DHL Express API connection status</CardDescription>
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
          {healthError ? (
            <div className="flex items-start gap-3 p-4 rounded-lg border-2 bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-900/30">
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Status Unavailable
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{healthError}</p>
              </div>
            </div>
          ) : healthStatus ? (
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
                        {healthStatus.overall.message}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        DHL Express is connected and ready to provide express shipping rates
                        worldwide.
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
                        {healthStatus.overall.message}
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                        Unable to verify your API credentials
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Double-check DHL_EXPRESS_API_KEY and DHL_EXPRESS_API_SECRET in your .env
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
                        {healthStatus.overall.message}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Follow the setup steps below to connect your DHL Express account
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Configuration Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">API Key</p>
                  <p className="font-mono text-sm truncate">{isConfigured ? 'Configured' : '—'}</p>
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
                  <p className="text-xs font-medium text-muted-foreground mb-1">Environment</p>
                  <p className="font-medium text-sm capitalize">{environment}</p>
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
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              <CardTitle>Quick Setup Guide</CardTitle>
            </div>
            <CardDescription>Get DHL Express up and running in 3 easy steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  Get your DHL Express API credentials
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Register on the DHL Developer Portal and create an app to obtain your API key and
                  secret
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://developer.dhl.com', '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open DHL Developer Portal
                </Button>
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700" />

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Add credentials to your server
                </p>
                <div className="bg-gray-900 dark:bg-black rounded-lg p-3 relative group">
                  <code className="text-xs text-green-400 block space-y-1">
                    <div className="text-gray-500"># Add to apps/api/.env</div>
                    <div>DHL_EXPRESS_API_KEY=your_api_key_here</div>
                    <div>DHL_EXPRESS_API_SECRET=your_api_secret_here</div>
                    <div>DHL_API_ENVIRONMENT=test</div>
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        'DHL_EXPRESS_API_KEY=your_api_key_here\nDHL_EXPRESS_API_SECRET=your_api_secret_here\nDHL_API_ENVIRONMENT=test',
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
                  Use <code>DHL_API_ENVIRONMENT=production</code> when going live
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700" />

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Restart and test</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Restart your API server to load the new environment variables, then click the
                    "Test Connection" button above.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                    <ArrowRight className="h-4 w-4" />
                    <span>Once connected, enable the integration below</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cascade Position Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Shipping Cascade Position</CardTitle>
          </div>
          <CardDescription>
            DHL Express operates as Tier 4 in the shipping cascade — used when EasyPost and EasyShip
            return no rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { tier: 'Tier 1', label: 'SendCloud', note: 'EU sellers', muted: true },
              { tier: 'Tier 2', label: 'EasyPost', note: 'Global multi-carrier', muted: true },
              { tier: 'Tier 3', label: 'EasyShip', note: 'APAC markets', muted: true },
              { tier: 'Tier 4', label: 'DHL Express', note: 'Express worldwide', active: true },
              { tier: 'Tier 5', label: 'Zones / Manual', note: 'Final fallback', muted: true },
            ].map((row) => (
              <div
                key={row.tier}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  row.active
                    ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/20 dark:border-yellow-700'
                    : 'bg-muted/30'
                }`}
              >
                <span className="text-xs font-mono text-muted-foreground w-12 flex-shrink-0">
                  {row.tier}
                </span>
                <span
                  className={`font-medium text-sm ${row.active ? 'text-yellow-700 dark:text-yellow-300' : ''}`}
                >
                  {row.label}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{row.note}</span>
                {row.active && (
                  <Badge className="bg-yellow-500/20 text-yellow-700 border border-yellow-500/30 text-xs">
                    You are here
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm flex items-center gap-2">
              <Truck className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <span>
                <strong>Express only:</strong> DHL Express provides premium 1–5 day international
                delivery. For economy rates, rely on EasyPost or EasyShip.
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
              ? 'Your DHL Express integration is ready to use'
              : 'Enable once you have configured and tested the connection'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed">
            <div>
              <Label
                htmlFor="dhl-enabled"
                className="text-base font-semibold cursor-pointer flex items-center gap-2"
              >
                {settings.dhl_enabled ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    DHL Express Enabled
                  </>
                ) : (
                  'Enable DHL Express'
                )}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {settings.dhl_enabled
                  ? 'DHL Express is active as Tier 4 express fallback'
                  : 'Enable to use DHL Express as a Tier 4 fallback for worldwide express shipping'}
              </p>
            </div>
            <Switch
              id="dhl-enabled"
              checked={settings.dhl_enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, dhl_enabled: checked }))
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
          {settings.dhl_enabled
            ? 'DHL Express will be used as Tier 4 worldwide express fallback'
            : 'Changes will be saved to system settings'}
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
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
