import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Badge } from '@nextpik/ui';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Key, RefreshCw, LucideIcon } from 'lucide-react';
import { EnvSettingsDisplay } from '../env-settings-display';
import { getSettingsByCategory, type SettingDefinition } from '@/lib/settings-config';

interface GatewayStatus {
  configured: boolean;
  enabled: boolean;
  testMode?: boolean;
  keys: {
    [key: string]: boolean;
  };
}

interface PaymentGatewayCardProps {
  name: string;
  icon: LucideIcon;
  description: string;
  status: GatewayStatus | null;
  loading?: boolean;
  onReload?: () => Promise<void>;
  reloading?: boolean;
  envKeyPrefix: string;
  setupInstructions?: {
    dashboardUrl: string;
    steps: string[];
  };
  children?: React.ReactNode; // Business configuration section
}

export function PaymentGatewayCard({
  name,
  icon: Icon,
  description,
  status,
  loading = false,
  onReload,
  reloading = false,
  envKeyPrefix,
  setupInstructions,
  children,
}: PaymentGatewayCardProps) {
  const [showEnvSettings, setShowEnvSettings] = useState(false);

  // Get environment settings for this gateway
  const envSettings = getSettingsByCategory('payment', 'env').filter(
    s => s.key.startsWith(envKeyPrefix.toLowerCase())
  );

  // Prepare env values from status
  const envValues = status?.keys
    ? Object.fromEntries(
        Object.entries(status.keys).map(([key, configured]) => [
          key,
          configured ? 'configured' : undefined,
        ])
      )
    : {};

  // Determine overall status badge
  const getStatusBadge = () => {
    if (loading) {
      return (
        <Badge variant="outline" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading...
        </Badge>
      );
    }

    if (!status) return null;

    if (status.configured && status.enabled) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
          <CheckCircle className="h-3 w-3" />
          Connected
        </Badge>
      );
    }

    if (!status.configured) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Not Configured
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Disabled
      </Badge>
    );
  };

  return (
    <Card className="border-[#CBB57B]/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#CBB57B]/10">
              <Icon className="h-5 w-5 text-[#CBB57B]" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {name}
                {getStatusBadge()}
                {status?.testMode && (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    Test Mode
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {onReload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReload}
              disabled={reloading || loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${reloading ? 'animate-spin' : ''}`} />
              Reload Config
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configuration Status Grid */}
        {status && !loading && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="text-sm font-medium mb-3">Configuration Status</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(status.keys).map(([key, configured]) => (
                <div key={key} className="flex items-center gap-2">
                  {configured ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{formatKeyName(key)}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                {status.enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Integration {status.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Toggle to show/hide environment settings */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowEnvSettings(!showEnvSettings)}
          className="w-full gap-2"
        >
          <Key className="h-4 w-4" />
          {showEnvSettings ? 'Hide' : 'Show'} API Keys Configuration
        </Button>

        {/* Environment Settings Display */}
        {showEnvSettings && (
          <div className="space-y-4">
            <EnvSettingsDisplay
              settings={envSettings}
              values={envValues}
              showValues={false}
            />

            {/* Setup Instructions */}
            {setupInstructions && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Quick Setup
                </h4>
                <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
                  {setupInstructions.steps.map((step, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: step }} />
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Business Configuration (passed as children) */}
        {children && (
          <div className="space-y-4 pt-4 border-t">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatKeyName(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace('Key', 'Key (.env)')
    .replace('Secret', 'Secret (.env)');
}
