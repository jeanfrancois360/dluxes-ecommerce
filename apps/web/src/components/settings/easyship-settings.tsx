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
  Ship,
  MapPin,
  ArrowRight,
  Sparkles,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

interface EasyShipSettings {
  easyship_enabled: boolean;
}

interface EasyShipHealthStatus {
  enabled: boolean;
  configured: boolean;
  credentialsValid: boolean;
  apiKey: string;
  connectionError: string | null;
  message: string;
  supportedCountries: string[];
}

const EASYSHIP_COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CA', name: 'Canada' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SG', name: 'Singapore' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
];

export function EasyShipSettingsSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [healthStatus, setHealthStatus] = useState<EasyShipHealthStatus | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [settings, setSettings] = useState<EasyShipSettings>({
    easyship_enabled: false,
  });

  useEffect(() => {
    loadSettings();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const data = await api.get('/easyship/health');
      setHealthStatus(data);
    } catch (error) {
      console.error('Failed to check EasyShip health:', error);
      toast.error('Failed to check connection status');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const data = await api.get('/easyship/health');
      if (data.credentialsValid) {
        toast.success('Connection successful! EasyShip is ready to use.');
      } else if (data.configured) {
        toast.error('Connection failed. Please check your API key.');
      } else {
        toast.error('EasyShip not configured. Add environment variable first.');
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
      const result = await api.get('/settings/easyship_enabled');
      if (result?.value !== undefined) {
        setSettings({ easyship_enabled: result.value });
      }
    } catch (error: any) {
      console.error('Failed to load EasyShip settings:', error);
      if (error.status === 401) {
        toast.error('Please log in as admin to access EasyShip settings');
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
      await api.patch('/settings/easyship_enabled', { value: settings.easyship_enabled });
      toast.success('EasyShip settings saved successfully');
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
        <p className="text-sm text-muted-foreground">Loading EasyShip settings...</p>
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
            <Ship className="h-6 w-6 text-[#CBB57B]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              EasyShip Shipping
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Regional shipping for APAC &amp; alternative markets — used as fallback after EasyPost
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
              {settings.easyship_enabled && (
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
              <CardDescription>Real-time EasyShip API connection status</CardDescription>
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
                        Your EasyShip account is connected and ready to provide shipping rates for
                        global orders.
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
                        {healthStatus.connectionError || 'Unable to verify your API key'}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Double-check your EASYSHIP_API_KEY in the .env file
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
                        Follow the setup steps below to connect your EasyShip account
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Configuration Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
                  <p className="text-xs font-medium text-muted-foreground mb-1">Coverage</p>
                  <p className="font-medium text-sm">10 Countries</p>
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
            <CardDescription>Get EasyShip up and running in 3 easy steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#CBB57B] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  Get your EasyShip API key
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Sign in to your EasyShip account and navigate to the API settings
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://app.easyship.com/settings/connect', '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open EasyShip Dashboard
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
                    <div>EASYSHIP_API_KEY=your_api_key_here</div>
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard('EASYSHIP_API_KEY=your_api_key_here', 'environment variable')
                    }
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copied === 'environment variable' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Replace <code>your_api_key_here</code> with your actual EasyShip API key
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
                    Restart your API server to load the new environment variable, then click the
                    "Test Connection" button above.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[#CBB57B]">
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
            <CardTitle>Supported Markets</CardTitle>
          </div>
          <CardDescription>
            EasyShip supports these 10 ship-from countries — primarily used for APAC regions not
            covered by EasyPost
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {EASYSHIP_COUNTRIES.map((country) => (
              <div
                key={country.code}
                className="flex items-center gap-2 p-2.5 rounded-lg border bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-md transition-shadow"
              >
                <Globe className="h-4 w-4 text-[#CBB57B] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {country.code}
                  </p>
                  <p className="text-sm truncate">{country.name}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-[#CBB57B]/10 border border-[#CBB57B]/20">
            <p className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#CBB57B]" />
              <span>
                <strong>Multi-Currency:</strong> EasyShip supports multiple currencies with USD as
                default
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
              ? 'Your EasyShip integration is ready to use'
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
                {settings.easyship_enabled ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    EasyShip Enabled
                  </>
                ) : (
                  'Enable EasyShip'
                )}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {settings.easyship_enabled
                  ? 'EasyShip is active as a regional fallback (Tier 3, after EasyPost)'
                  : 'Enable to use EasyShip as a Tier 3 fallback for APAC &amp; alternative markets'}
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.easyship_enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, easyship_enabled: checked }))
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
          {settings.easyship_enabled
            ? 'EasyShip will be used for global shipping'
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
