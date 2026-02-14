'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@nextpik/ui';
import {
  Loader2,
  Calculator,
  Info,
  DollarSign,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { shippingSettingsSchema, type ShippingSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { api } from '@/lib/api/client';

// DHL Health Status Interface
interface DhlHealthStatus {
  enabled: boolean;
  configured: boolean;
  credentialsValid?: boolean;
  environment: string;
}

// DHL Test Rate Result Interface
interface DhlTestRateResult {
  success: boolean;
  message: string;
  ratesCount?: number;
  rates?: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    estimatedDays: number;
  }>;
  error?: string;
}

// DHL Configuration Component
function DhlConfigurationSection() {
  const [healthStatus, setHealthStatus] = useState<DhlHealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isTestingRates, setIsTestingRates] = useState(false);
  const [testRateResult, setTestRateResult] = useState<DhlTestRateResult | null>(null);
  const [showTestRates, setShowTestRates] = useState(false);

  const checkDhlHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const status = await api.get<DhlHealthStatus>('/shipping/admin/dhl/health');
      setHealthStatus(status);
    } catch (error) {
      console.error('Failed to check DHL health:', error);
      setHealthStatus({
        enabled: false,
        configured: false,
        environment: 'unknown',
      });
      toast.error('Failed to check DHL API status');
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  const testDhlRates = useCallback(async () => {
    setIsTestingRates(true);
    setTestRateResult(null);
    try {
      const result = await api.post<DhlTestRateResult>('/shipping/admin/dhl/test-rates', {
        originCountry: 'US',
        originPostalCode: '10001',
        destinationCountry: 'GB',
        destinationPostalCode: 'SW1A 1AA',
        weight: 1,
      });
      setTestRateResult(result);
      setShowTestRates(true);
      if (result.success) {
        toast.success(`DHL API working: ${result.ratesCount} rates found`);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Failed to test DHL rates:', error);
      setTestRateResult({
        success: false,
        message: error.message || 'Failed to test DHL rates',
        error: error.data?.message || error.message,
      });
      toast.error('Failed to test DHL rates');
    } finally {
      setIsTestingRates(false);
    }
  }, []);

  // Check health on mount
  useEffect(() => {
    checkDhlHealth();
  }, [checkDhlHealth]);

  return (
    <SettingsCard
      icon={Truck}
      title="DHL Express Configuration"
      description="Configure and test DHL Express API integration for real-time shipping rates"
    >
      {/* Connection Status */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isCheckingHealth ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : healthStatus?.credentialsValid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : healthStatus?.configured ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isCheckingHealth
                  ? 'Checking connection...'
                  : healthStatus?.credentialsValid
                    ? 'DHL API Connected'
                    : healthStatus?.configured
                      ? 'Credentials Invalid'
                      : 'Not Configured'}
              </p>
              <p className="text-xs text-muted-foreground">
                Environment: {healthStatus?.environment || 'Unknown'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={checkDhlHealth}
            disabled={isCheckingHealth}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Status Details */}
        {healthStatus && (
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">API Key</p>
              <p
                className={`text-sm font-medium ${healthStatus.configured ? 'text-green-600' : 'text-red-600'}`}
              >
                {healthStatus.configured ? 'Configured' : 'Missing'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Credentials</p>
              <p
                className={`text-sm font-medium ${healthStatus.credentialsValid ? 'text-green-600' : healthStatus.configured ? 'text-yellow-600' : 'text-red-600'}`}
              >
                {healthStatus.credentialsValid
                  ? 'Valid'
                  : healthStatus.configured
                    ? 'Invalid'
                    : 'Not Set'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Mode</p>
              <p
                className={`text-sm font-medium ${healthStatus.environment === 'production' ? 'text-blue-600' : 'text-orange-600'}`}
              >
                {healthStatus.environment === 'production' ? 'Production' : 'Sandbox'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Test Rates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Test DHL Rates</p>
            <p className="text-xs text-muted-foreground">
              Send a test request to verify DHL API is working (US → UK, 1kg)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={testDhlRates}
            disabled={isTestingRates || !healthStatus?.configured}
          >
            {isTestingRates ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Rates'
            )}
          </Button>
        </div>

        {/* Test Results */}
        {showTestRates && testRateResult && (
          <div
            className={`rounded-lg border p-4 ${testRateResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {testRateResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <p
                className={`text-sm font-medium ${testRateResult.success ? 'text-green-800' : 'text-red-800'}`}
              >
                {testRateResult.message}
              </p>
            </div>

            {testRateResult.success && testRateResult.rates && testRateResult.rates.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Available Rates (US → UK, 1kg):</p>
                <div className="space-y-1.5">
                  {testRateResult.rates.slice(0, 5).map((rate, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm bg-white rounded px-3 py-2"
                    >
                      <span className="text-gray-700">{rate.name}</span>
                      <span className="font-medium text-gray-900">
                        {rate.currency} {rate.price.toFixed(2)} ({rate.estimatedDays} days)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testRateResult.error && (
              <p className="text-xs text-red-600 mt-2">Error: {testRateResult.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-2">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-900">DHL API Configuration</p>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>API credentials are configured in server environment variables</li>
              <li>
                Current environment: <strong>{healthStatus?.environment || 'Unknown'}</strong>
              </li>
              <li>
                To switch to production, update{' '}
                <code className="bg-amber-100 px-1 rounded">DHL_API_ENVIRONMENT</code> in .env
              </li>
            </ul>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

export function ShippingSettingsSection() {
  const { settings, loading, refetch } = useSettings('shipping');
  const { updateSetting, updating } = useSettingsUpdate();
  const justSavedRef = useRef(false);

  const form = useForm<ShippingSettings>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      shipping_mode: 'manual',
      shipping_standard_rate: 9.99,
      shipping_express_rate: 19.99,
      shipping_overnight_rate: 29.99,
      shipping_international_surcharge: 15.0,
      free_shipping_enabled: true,
      free_shipping_threshold: 100,
    },
    shouldUnregister: false,
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      if (!form.formState.isDirty || justSavedRef.current) {
        form.reset(formData as ShippingSettings);
        justSavedRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: ShippingSettings) => {
    try {
      const errors: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        try {
          await updateSetting(key, value, 'Updated via settings panel');
          console.log(`✓ Saved ${key}:`, value);
        } catch (err: any) {
          console.error(`✗ Failed to save ${key}:`, err);
          errors.push(`${key}: ${err.message || 'Unknown error'}`);
        }
      }

      if (errors.length > 0) {
        console.error('Some settings failed to save:', errors);
        toast.error(`Failed to save some settings: ${errors.join(', ')}`);
        justSavedRef.current = false;
      } else {
        justSavedRef.current = true;
        toast.success('Shipping settings saved successfully');
      }

      await refetch();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save shipping settings');
      justSavedRef.current = false;
    }
  };

  useKeyboardShortcuts({
    onSave: () => form.handleSubmit(onSubmit)(),
    onReset: () => form.reset(),
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isDirty = form.formState.isDirty;
  const currentMode = form.watch('shipping_mode');
  const freeShippingEnabled = form.watch('free_shipping_enabled');

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <SettingsCard
        icon={Calculator}
        title="Shipping Rates & Pricing"
        description="Configure shipping cost calculator and free shipping promotions"
      >
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">Shipping Modes</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  <strong>Manual:</strong> Use manually configured rates (below)
                </li>
                <li>
                  <strong>DHL API:</strong> Real-time rates from DHL Express
                </li>
                <li>
                  <strong>Hybrid:</strong> Try DHL API, fallback to manual if unavailable
                  (Recommended)
                </li>
              </ul>
            </div>
          </div>
        </div>

        <SettingsField
          label="Shipping Mode"
          id="shipping_mode"
          required
          tooltip="Choose how shipping rates are calculated"
          error={form.formState.errors.shipping_mode?.message}
        >
          <Select
            value={form.watch('shipping_mode')}
            onValueChange={(value) =>
              form.setValue('shipping_mode', value as any, { shouldDirty: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual Configuration</SelectItem>
              <SelectItem value="dhl_api">DHL API Only</SelectItem>
              <SelectItem value="hybrid">Hybrid (Recommended)</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>

        {/* Manual rates configuration - show when manual or hybrid mode */}
        {(currentMode === 'manual' || currentMode === 'hybrid') && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SettingsField
                label="Standard Shipping Rate"
                id="shipping_standard_rate"
                required
                tooltip="Base rate for standard shipping (5-7 business days)"
                error={form.formState.errors.shipping_standard_rate?.message}
              >
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="shipping_standard_rate"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register('shipping_standard_rate', { valueAsNumber: true })}
                    placeholder="9.99"
                    className="flex-1"
                  />
                </div>
              </SettingsField>

              <SettingsField
                label="Express Shipping Rate"
                id="shipping_express_rate"
                required
                tooltip="Base rate for express shipping (2-3 business days)"
                error={form.formState.errors.shipping_express_rate?.message}
              >
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="shipping_express_rate"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register('shipping_express_rate', { valueAsNumber: true })}
                    placeholder="19.99"
                    className="flex-1"
                  />
                </div>
              </SettingsField>

              <SettingsField
                label="Overnight Shipping Rate"
                id="shipping_overnight_rate"
                required
                tooltip="Base rate for overnight delivery (1 business day)"
                error={form.formState.errors.shipping_overnight_rate?.message}
              >
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="shipping_overnight_rate"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register('shipping_overnight_rate', { valueAsNumber: true })}
                    placeholder="29.99"
                    className="flex-1"
                  />
                </div>
              </SettingsField>

              <SettingsField
                label="International Surcharge"
                id="shipping_international_surcharge"
                required
                tooltip="Additional fee for international orders"
                error={form.formState.errors.shipping_international_surcharge?.message}
              >
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="shipping_international_surcharge"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register('shipping_international_surcharge', { valueAsNumber: true })}
                    placeholder="15.00"
                    className="flex-1"
                  />
                </div>
              </SettingsField>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium mb-2">
                {currentMode === 'hybrid' ? 'Fallback Rate Preview' : 'Rate Preview'}
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Standard (5-7 days): ${(form.watch('shipping_standard_rate') ?? 9.99).toFixed(2)}
                </p>
                <p>
                  Express (2-3 days): ${(form.watch('shipping_express_rate') ?? 19.99).toFixed(2)}
                </p>
                <p>
                  Overnight (1 day): ${(form.watch('shipping_overnight_rate') ?? 29.99).toFixed(2)}
                </p>
                <p>
                  International Surcharge: +$
                  {(form.watch('shipping_international_surcharge') ?? 15.0).toFixed(2)}
                </p>
              </div>
              {currentMode === 'hybrid' && (
                <p className="text-xs text-amber-600 mt-2">
                  These rates are used when DHL API is unavailable
                </p>
              )}
            </div>
          </>
        )}

        {/* DHL-only mode info */}
        {currentMode === 'dhl_api' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">DHL API Only Mode</p>
                <p className="text-sm text-amber-700">
                  Shipping rates will be fetched exclusively from DHL Express. If DHL API is
                  unavailable, customers will see an error. Consider using{' '}
                  <strong>Hybrid mode</strong> for better reliability.
                </p>
              </div>
            </div>
          </div>
        )}
      </SettingsCard>

      {/* DHL Configuration Section - show when DHL or Hybrid mode */}
      {(currentMode === 'dhl_api' || currentMode === 'hybrid') && <DhlConfigurationSection />}

      <SettingsCard
        icon={DollarSign}
        title="Free Shipping Promotion"
        description="Offer free shipping when order total exceeds threshold"
      >
        <Controller
          name="free_shipping_enabled"
          control={form.control}
          render={({ field }) => (
            <SettingsToggle
              label="Enable Free Shipping"
              description="Offer free shipping when order total exceeds threshold"
              checked={!!field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        <SettingsField
          label="Free Shipping Threshold"
          id="free_shipping_threshold"
          required
          tooltip="Minimum order total to qualify for free shipping"
          error={form.formState.errors.free_shipping_threshold?.message}
          className={!freeShippingEnabled ? 'opacity-50 pointer-events-none' : ''}
        >
          <div className="flex gap-2 items-center">
            <span className="text-muted-foreground">$</span>
            <Input
              id="free_shipping_threshold"
              type="number"
              min={0}
              step="0.01"
              {...form.register('free_shipping_threshold', {
                valueAsNumber: true,
              })}
              placeholder="100.00"
              className="flex-1"
              disabled={!freeShippingEnabled}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Orders ${(form.watch('free_shipping_threshold') ?? 100).toFixed(2)} or more will receive
            free shipping
          </p>
        </SettingsField>
      </SettingsCard>

      <SettingsFooter
        onReset={() => form.reset()}
        onSave={form.handleSubmit(onSubmit)}
        isLoading={updating}
        isDirty={isDirty}
      />
    </form>
  );
}
