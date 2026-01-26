import { CheckCircle, XCircle, Lock, AlertTriangle, Info } from 'lucide-react';
import { Label } from '@nextpik/ui';
import { Badge } from '@nextpik/ui';
import { maskSecretValue, type SettingDefinition } from '@/lib/settings-config';

interface EnvSettingsDisplayProps {
  settings: SettingDefinition[];
  values?: Record<string, any>;
  showValues?: boolean;
}

/**
 * Display component for environment-based settings
 * Shows configuration status and optionally masked values
 */
export function EnvSettingsDisplay({ settings, values = {}, showValues = false }: EnvSettingsDisplayProps) {
  if (settings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Environment Configuration
            </h4>
            <p className="text-sm text-blue-700">
              These settings are configured via environment variables in your <code className="px-1 py-0.5 bg-blue-100 rounded text-xs">.env</code> file.
              Changes require updating the file and restarting the application.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-4">
        {settings.map((setting) => {
          const value = values[setting.key];
          const isConfigured = Boolean(value);
          const displayValue = value ? (setting.isSecret ? maskSecretValue(value) : value) : undefined;

          return (
            <div
              key={setting.key}
              className="rounded-lg border bg-muted/30 p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label className="text-sm font-medium">
                      {setting.label}
                    </Label>
                    {setting.isSecret && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                    {setting.requiresRestart && (
                      <Badge variant="outline" className="text-xs">
                        Requires Restart
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {setting.description}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  {isConfigured ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>Configured</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                      <XCircle className="h-4 w-4" />
                      <span>Missing</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Environment Variable Name */}
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background px-2 py-1 rounded border font-mono">
                  {setting.envKey}
                </code>
                <Badge variant="secondary" className="text-xs">
                  .env
                </Badge>
              </div>

              {/* Value Display (if configured and showValues is true) */}
              {isConfigured && showValues && displayValue && (
                <div className="mt-2 p-2 bg-background rounded border">
                  <code className="text-xs font-mono break-all">
                    {displayValue}
                  </code>
                </div>
              )}

              {/* Warning for missing critical settings */}
              {!isConfigured && !setting.isSecret && (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span>
                    This setting is not configured. Add <code className="px-1 bg-amber-100 rounded">{setting.envKey}</code> to your .env file.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Configuration Instructions */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          How to configure these settings:
        </h4>
        <ol className="text-sm text-gray-700 space-y-1 ml-4 list-decimal">
          <li>
            Open <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">apps/api/.env</code> in your project
          </li>
          <li>Add or update the environment variables shown above</li>
          <li>Restart the application for changes to take effect</li>
        </ol>
        <p className="text-xs text-gray-600 mt-3">
          <strong>Note:</strong> Never commit sensitive keys to version control. Use <code className="px-1 bg-gray-100 rounded">.env.example</code> for templates.
        </p>
      </div>
    </div>
  );
}

/**
 * Compact status display for showing configuration health
 */
export function EnvSettingsStatus({ settings, values = {} }: Omit<EnvSettingsDisplayProps, 'showValues'>) {
  const totalSettings = settings.length;
  const configuredSettings = settings.filter(s => Boolean(values[s.key])).length;
  const missingCritical = settings.filter(s => !values[s.key] && !s.isSecret).length;

  const isHealthy = configuredSettings === totalSettings;
  const hasIssues = missingCritical > 0;

  return (
    <div className={`rounded-lg border p-3 ${isHealthy ? 'bg-green-50 border-green-200' : hasIssues ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isHealthy ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : hasIssues ? (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          ) : (
            <Info className="h-4 w-4 text-gray-600" />
          )}
          <span className="text-sm font-medium">
            Environment Configuration
          </span>
        </div>
        <Badge variant={isHealthy ? 'default' : 'secondary'}>
          {configuredSettings} / {totalSettings} configured
        </Badge>
      </div>

      {hasIssues && (
        <p className="text-xs text-amber-700 mt-2">
          {missingCritical} required {missingCritical === 1 ? 'setting' : 'settings'} missing from .env file
        </p>
      )}
    </div>
  );
}
