'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Switch } from '@nextpik/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@nextpik/ui';
import { AlertCircle, Loader2, Lock, CreditCard, CheckCircle, XCircle, RefreshCw, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { paymentSettingsSchema, type PaymentSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { api } from '@/lib/api/client';

// Stripe configuration status interface
interface StripeStatus {
  configured: boolean;
  enabled: boolean;
  testMode: boolean;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  currency: string;
  captureMethod: string;
}

export function PaymentSettingsSection() {
  const { settings, loading, refetch } = useSettings('payment');
  const { settings: paymentSettingsUpper, refetch: refetchUpper } = useSettings('PAYMENT');
  const { updateSetting, updating } = useSettingsUpdate();

  // Stripe-specific state
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loadingStripeStatus, setLoadingStripeStatus] = useState(true);
  const [reloadingStripe, setReloadingStripe] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const form = useForm<PaymentSettings>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      escrow_default_hold_days: 7,
      min_payout_amount: 50,
      payout_schedule: 'weekly',
      payment_methods: ['stripe', 'paypal'],
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const allFormData = transformSettingsToForm(settings);

      // Filter to only include fields that are in the PaymentSettings schema
      // to avoid validation errors from extra Stripe fields
      // Note: escrow_enabled and escrow_auto_release_enabled are excluded as they save immediately
      const filteredData: Partial<PaymentSettings> = {
        escrow_default_hold_days: allFormData.escrow_default_hold_days ?? 7,
        min_payout_amount: allFormData.min_payout_amount ?? 50,
        payout_schedule: allFormData.payout_schedule ?? 'weekly',
        payment_methods: allFormData.payment_methods ?? ['stripe', 'paypal'],
      };

      // Reset with keepDirtyValues: false to ensure form is not dirty after reset
      form.reset(filteredData as PaymentSettings, { keepDirtyValues: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]); // form is stable, don't include it

  // Fetch Stripe status on component mount
  useEffect(() => {
    fetchStripeStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStripeStatus = async () => {
    try {
      setLoadingStripeStatus(true);
      const response = await api.get('/settings/stripe/status');
      if (response.data?.data) {
        setStripeStatus(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch Stripe status:', error);
    } finally {
      setLoadingStripeStatus(false);
    }
  };

  const handleReloadStripe = async () => {
    try {
      setReloadingStripe(true);
      const response = await api.post('/settings/stripe/reload');
      if (response.data?.success) {
        toast.success('Stripe configuration reloaded successfully');
        await fetchStripeStatus();
      }
    } catch (error: any) {
      toast.error('Failed to reload Stripe', error.message || 'Please try again');
    } finally {
      setReloadingStripe(false);
    }
  };

  // Helper function to update Stripe setting and reload config
  const updateStripeSettingWithReload = async (key: string, value: any, reason: string) => {
    try {
      await updateSetting(key, value, reason);
      await api.post('/settings/stripe/reload');
      await Promise.all([refetch(), fetchStripeStatus()]);
    } catch (error: any) {
      console.error('Failed to update Stripe setting:', error);
      toast.error('Failed to update setting');
    }
  };

  const onSubmit = async (data: PaymentSettings) => {
    try {
      const updates = Object.entries(data);

      for (const [key, value] of updates) {
        // Skip fields that save immediately via their own toggles
        if (key === 'escrow_enabled' || key === 'escrow_auto_release_enabled') continue;

        await updateSetting(key, value, 'Updated via settings panel');
      }

      toast.success('Payment settings saved successfully');
      await refetch();
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error?.message || 'Failed to save settings. Please try again.');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isDirty = form.formState.isDirty;

  // Helper to get Stripe setting value
  const getStripeSetting = (key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting?.value;
  };

  // Helper to get lowercase payment category setting with proper type conversion
  const getPaymentSetting = (key: string) => {
    const setting = settings.find(s => s.key === key);
    if (!setting) return undefined;

    // Apply type conversion based on valueType
    if (setting.valueType === 'BOOLEAN') {
      if (typeof setting.value === 'string') {
        return setting.value === 'true' || setting.value === '1';
      }
      return Boolean(setting.value);
    }

    return setting.value;
  };

  // Helper to get uppercase PAYMENT category setting with proper type conversion
  const getUpperPaymentSetting = (key: string) => {
    const setting = paymentSettingsUpper.find(s => s.key === key);
    if (!setting) return undefined;

    // Apply type conversion based on valueType
    if (setting.valueType === 'BOOLEAN') {
      if (typeof setting.value === 'string') {
        return setting.value === 'true' || setting.value === '1';
      }
      return Boolean(setting.value);
    }

    return setting.value;
  };

  return (
    <div className="space-y-6">
      {/* Stripe Configuration Card */}
      <Card className="border-[#CBB57B]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#CBB57B]/10">
                <CreditCard className="h-5 w-5 text-[#CBB57B]" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Stripe Payment Gateway
                  {loadingStripeStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : stripeStatus ? (
                    stripeStatus.configured && stripeStatus.enabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        Connected
                      </span>
                    ) : !stripeStatus.configured ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <AlertTriangle className="h-3 w-3" />
                        Not Configured
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3" />
                        Disabled
                      </span>
                    )
                  ) : null}
                  {stripeStatus?.testMode && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Test Mode
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Configure Stripe integration for secure payment processing
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReloadStripe}
              disabled={reloadingStripe || loadingStripeStatus}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${reloadingStripe ? 'animate-spin' : ''}`} />
              Reload Config
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Enable Stripe + Test Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="stripe_enabled">Enable Stripe</Label>
                <p className="text-xs text-muted-foreground">
                  Activate Stripe payment processing
                </p>
              </div>
              <Switch
                id="stripe_enabled"
                checked={getStripeSetting('stripe_enabled') ?? false}
                onCheckedChange={async (checked) => {
                  await updateStripeSettingWithReload('stripe_enabled', checked, 'Toggled Stripe enabled status');
                }}
                disabled={updating}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="stripe_test_mode">Test Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Use test API keys (sandbox)
                </p>
              </div>
              <Switch
                id="stripe_test_mode"
                checked={getStripeSetting('stripe_test_mode') ?? true}
                onCheckedChange={async (checked) => {
                  await updateStripeSettingWithReload('stripe_test_mode', checked, 'Toggled Stripe test mode');
                }}
                disabled={updating}
              />
            </div>
          </div>

          {/* Publishable Key */}
          <div className="space-y-2">
            <Label htmlFor="stripe_publishable_key">Publishable Key</Label>
            <Input
              id="stripe_publishable_key"
              type="text"
              placeholder="pk_test_... or pk_live_..."
              defaultValue={getStripeSetting('stripe_publishable_key') || ''}
              onBlur={async (e) => {
                if (e.target.value !== getStripeSetting('stripe_publishable_key')) {
                  await updateStripeSettingWithReload('stripe_publishable_key', e.target.value, 'Updated Stripe publishable key');
                }
              }}
              disabled={updating}
            />
            <p className="text-xs text-muted-foreground">
              Safe to expose to frontend (starts with pk_)
            </p>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="stripe_secret_key" className="flex items-center gap-2">
              Secret Key
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <div className="relative">
              <Input
                id="stripe_secret_key"
                type={showSecretKey ? 'text' : 'password'}
                placeholder="sk_test_... or sk_live_..."
                defaultValue={getStripeSetting('stripe_secret_key') || ''}
                onBlur={async (e) => {
                  if (e.target.value !== getStripeSetting('stripe_secret_key')) {
                    await updateStripeSettingWithReload('stripe_secret_key', e.target.value, 'Updated Stripe secret key');
                  }
                }}
                disabled={updating}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Never expose this key to frontend (starts with sk_)
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="stripe_webhook_secret" className="flex items-center gap-2">
              Webhook Signing Secret
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <div className="relative">
              <Input
                id="stripe_webhook_secret"
                type={showWebhookSecret ? 'text' : 'password'}
                placeholder="whsec_..."
                defaultValue={getStripeSetting('stripe_webhook_secret') || ''}
                onBlur={async (e) => {
                  if (e.target.value !== getStripeSetting('stripe_webhook_secret')) {
                    await updateStripeSettingWithReload('stripe_webhook_secret', e.target.value, 'Updated Stripe webhook secret');
                  }
                }}
                disabled={updating}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for webhook signature verification (starts with whsec_)
            </p>
          </div>

          {/* Currency and Capture Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stripe_currency">Default Currency</Label>
              <Select
                value={getStripeSetting('stripe_currency') || 'USD'}
                onValueChange={async (value) => {
                  await updateStripeSettingWithReload('stripe_currency', value, 'Updated Stripe currency');
                }}
                disabled={updating}
              >
                <SelectTrigger id="stripe_currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripe_capture_method">Capture Method</Label>
              <Select
                value={getStripeSetting('stripe_capture_method') || 'manual'}
                onValueChange={async (value) => {
                  await updateStripeSettingWithReload('stripe_capture_method', value, 'Updated Stripe capture method');
                }}
                disabled={updating}
              >
                <SelectTrigger id="stripe_capture_method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (Escrow Compatible)</SelectItem>
                  <SelectItem value="automatic">Automatic (Instant Capture)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Statement Descriptor */}
          <div className="space-y-2">
            <Label htmlFor="stripe_statement_descriptor">Statement Descriptor</Label>
            <Input
              id="stripe_statement_descriptor"
              type="text"
              maxLength={22}
              placeholder="LUXURY ECOM"
              defaultValue={getStripeSetting('stripe_statement_descriptor') || 'LUXURY ECOM'}
              onBlur={async (e) => {
                if (e.target.value !== getStripeSetting('stripe_statement_descriptor')) {
                  await updateStripeSettingWithReload('stripe_statement_descriptor', e.target.value, 'Updated statement descriptor');
                }
              }}
              disabled={updating}
            />
            <p className="text-xs text-muted-foreground">
              Text shown on customer credit card statements (max 22 characters)
            </p>
          </div>

          {/* Connection Status Summary */}
          {stripeStatus && !loadingStripeStatus && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="text-sm font-medium mb-3">Configuration Status</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {stripeStatus.hasPublishableKey ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Publishable Key</span>
                </div>
                <div className="flex items-center gap-2">
                  {stripeStatus.hasSecretKey ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Secret Key</span>
                </div>
                <div className="flex items-center gap-2">
                  {stripeStatus.hasWebhookSecret ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  )}
                  <span>Webhook Secret</span>
                </div>
                <div className="flex items-center gap-2">
                  {stripeStatus.enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Integration {stripeStatus.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment & Escrow Settings Form */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-muted shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              Payment & Escrow Settings
              {isDirty && (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                  Unsaved changes
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Manage payment processing and escrow configuration
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6 pb-12">
            {/* Show validation errors if form was submitted with errors */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
                    Form Validation Errors
                  </h4>
                </div>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 ml-7">
                  {Object.entries(form.formState.errors).map(([field, error]: any) => (
                    <li key={field}>
                      <strong>{field}:</strong> {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Escrow Enabled - Uses uppercase PAYMENT category */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="escrow_enabled">Escrow System</Label>
                  {isProduction && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable secure payment holding until delivery confirmation
                  {isProduction && ' (Required in production)'}
                </p>
              </div>
              <Switch
                id="escrow_enabled"
                checked={getUpperPaymentSetting('escrow_enabled') ?? true}
                onCheckedChange={async (checked) => {
                  await updateSetting('escrow_enabled', checked, 'Toggled escrow system');
                  await Promise.all([refetch(), refetchUpper()]);
                }}
                disabled={isProduction || updating}
              />
            </div>

            {/* Escrow Hold Days */}
            <div className="space-y-2">
              <Label htmlFor="escrow_default_hold_days">Escrow Hold Period (Days) *</Label>
              <Input
                id="escrow_default_hold_days"
                type="number"
                min={1}
                max={90}
                {...form.register('escrow_default_hold_days', { valueAsNumber: true })}
                placeholder="7"
                className="max-w-[200px]"
              />
              {form.formState.errors.escrow_default_hold_days && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.escrow_default_hold_days.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Default days to hold payment after delivery (1-90 days)
              </p>
            </div>

            {/* Auto Release - Saves immediately like Escrow System toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="escrow_auto_release_enabled">Auto-Release Escrow</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically release payment after hold period expires
                </p>
              </div>
              <Switch
                id="escrow_auto_release_enabled"
                checked={getUpperPaymentSetting('escrow_auto_release_enabled') ?? true}
                onCheckedChange={async (checked) => {
                  await updateSetting('escrow_auto_release_enabled', checked, 'Toggled auto-release escrow');
                  await Promise.all([refetch(), refetchUpper()]);
                }}
                disabled={updating}
              />
            </div>

            {/* Minimum Payout */}
            <div className="space-y-2">
              <Label htmlFor="min_payout_amount">Minimum Payout Amount (USD) *</Label>
              <Input
                id="min_payout_amount"
                type="number"
                min={0}
                step="0.01"
                {...form.register('min_payout_amount', { valueAsNumber: true })}
                placeholder="50.00"
                className="max-w-[200px]"
              />
              {form.formState.errors.min_payout_amount && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.min_payout_amount.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Sellers must reach this amount to request payout
              </p>
            </div>

            {/* Payout Schedule */}
            <div className="space-y-2">
              <Label htmlFor="payout_schedule">Payout Schedule *</Label>
              <Select
                value={form.watch('payout_schedule')}
                onValueChange={(value) => form.setValue('payout_schedule', value as any, { shouldDirty: true })}
              >
                <SelectTrigger id="payout_schedule" className="max-w-[300px]">
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.payout_schedule && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.payout_schedule.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                How often payouts are processed
              </p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <Label>Enabled Payment Methods *</Label>
              <div className="space-y-2">
                {['stripe', 'paypal', 'bank_transfer'].map((method) => {
                  const currentMethods = form.watch('payment_methods') || [];
                  const isChecked = Array.isArray(currentMethods) && currentMethods.includes(method);

                  return (
                    <div key={method} className="flex items-center space-x-3">
                      <Switch
                        id={`payment_method_${method}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const current = form.watch('payment_methods') || [];
                          if (checked) {
                            form.setValue('payment_methods', [...current, method], { shouldDirty: true });
                          } else {
                            form.setValue('payment_methods', current.filter(m => m !== method), { shouldDirty: true });
                          }
                        }}
                      />
                      <Label htmlFor={`payment_method_${method}`} className="capitalize cursor-pointer text-sm font-medium">
                        {method.replace('_', ' ')}
                      </Label>
                    </div>
                  );
                })}
              </div>
              {form.formState.errors.payment_methods && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.payment_methods.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t bg-muted/30 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={updating || !isDirty}
              className="gap-2"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={updating || !isDirty}
              className="gap-2 min-w-[140px]"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
