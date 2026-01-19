'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Switch } from '@nextpik/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@nextpik/ui';
import { AlertCircle, Loader2, Lock, CreditCard, DollarSign, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { paymentSettingsSchema, type PaymentSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { api } from '@/lib/api/client';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { PaymentGatewayCard } from './payment/PaymentGatewayCard';
import { GatewayBusinessConfig } from './payment/GatewayBusinessConfig';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

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

// Currency options
const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'RWF', label: 'RWF - Rwandan Franc' },
];

// Capture method options
const CAPTURE_METHOD_OPTIONS = [
  { value: 'manual', label: 'Manual (Escrow Compatible)' },
  { value: 'automatic', label: 'Automatic (Instant Capture)' },
];

// Payout schedule options
const PAYOUT_SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

// Payment method options
const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Stripe' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
];

export function PaymentSettingsSection() {
  const { settings, loading, refetch } = useSettings('payment');
  const { settings: paymentSettingsUpper, refetch: refetchUpper } = useSettings('PAYMENT');
  const { updateSetting, updating } = useSettingsUpdate();
  const justSavedRef = useRef(false);

  // Stripe-specific state
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loadingStripeStatus, setLoadingStripeStatus] = useState(true);
  const [reloadingStripe, setReloadingStripe] = useState(false);

  const form = useForm<PaymentSettings>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      escrow_default_hold_days: 7,
      min_payout_amount: 50,
      payout_schedule: 'weekly',
      payment_methods: ['stripe', 'paypal'],
    },
  });

  // Load settings into form
  useEffect(() => {
    if (settings.length > 0) {
      const allFormData = transformSettingsToForm(settings);
      const filteredData: Partial<PaymentSettings> = {
        escrow_default_hold_days: allFormData.escrow_default_hold_days ?? 7,
        min_payout_amount: allFormData.min_payout_amount ?? 50,
        payout_schedule: allFormData.payout_schedule ?? 'weekly',
        payment_methods: allFormData.payment_methods ?? ['stripe', 'paypal'],
      };
      if (!form.formState.isDirty || justSavedRef.current) {
        form.reset(filteredData as PaymentSettings);
        justSavedRef.current = false;
      }
    }
  }, [settings, form]);

  // Fetch Stripe status on mount
  useEffect(() => {
    fetchStripeStatus();
  }, []);

  const fetchStripeStatus = async () => {
    try {
      setLoadingStripeStatus(true);
      // api.get already unwraps { success, data } - response IS the data
      const response = await api.get<any>('/settings/stripe/status');
      if (response) {
        setStripeStatus(response);
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
      // api.post already unwraps the response
      await api.post('/settings/stripe/reload');
      toast.success('Stripe configuration reloaded successfully');
      await fetchStripeStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reload Stripe');
    } finally {
      setReloadingStripe(false);
    }
  };

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
        if (key === 'escrow_enabled' || key === 'escrow_auto_release_enabled') continue;
        await updateSetting(key, value, 'Updated via settings panel');
      }
      justSavedRef.current = true;
      await refetch();
      toast.success('Payment settings saved successfully');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error?.message || 'Failed to save settings. Please try again.');
      justSavedRef.current = false;
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => form.handleSubmit(onSubmit)(),
    onReset: () => form.reset(),
  });

  // Helper to get setting value
  const getSetting = (key: string) => {
    // First try lowercase 'payment' category
    let setting = settings.find(s => s.key === key);

    // Fallback to uppercase 'PAYMENT' category
    if (!setting) {
      setting = paymentSettingsUpper.find(s => s.key === key);
    }

    if (!setting) return undefined;

    // Handle boolean conversion
    if (setting.valueType === 'BOOLEAN') {
      if (typeof setting.value === 'string') {
        return setting.value === 'true' || setting.value === '1';
      }
      return Boolean(setting.value);
    }

    return setting.value;
  };

  const getUpperPaymentSetting = (key: string) => {
    const setting = paymentSettingsUpper.find(s => s.key === key);
    if (!setting) return undefined;
    if (setting.valueType === 'BOOLEAN') {
      if (typeof setting.value === 'string') {
        return setting.value === 'true' || setting.value === '1';
      }
      return Boolean(setting.value);
    }
    return setting.value;
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

  return (
    <div className="space-y-6">
      {/* Stripe Payment Gateway */}
      <PaymentGatewayCard
        name="Stripe Payment Gateway"
        icon={CreditCard}
        description="Configure Stripe integration for secure payment processing"
        status={
          stripeStatus
            ? {
                configured: stripeStatus.configured,
                enabled: stripeStatus.enabled,
                testMode: stripeStatus.testMode,
                keys: {
                  stripe_publishable_key: stripeStatus.hasPublishableKey,
                  stripe_secret_key: stripeStatus.hasSecretKey,
                  stripe_webhook_secret: stripeStatus.hasWebhookSecret,
                },
              }
            : null
        }
        loading={loadingStripeStatus}
        onReload={handleReloadStripe}
        reloading={reloadingStripe}
        envKeyPrefix="stripe"
        setupInstructions={{
          dashboardUrl: 'https://dashboard.stripe.com/apikeys',
          steps: [
            'Visit <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Stripe Dashboard</a>',
            'Copy your Publishable Key (starts with pk_)',
            'Copy your Secret Key (starts with sk_)',
            'Get Webhook Secret from Webhooks section (starts with whsec_)',
            'Add to <code class="px-1 py-0.5 bg-gray-100 rounded text-xs">apps/api/.env</code>',
            'Restart the API server',
            'Configure business settings below',
          ],
        }}
      >
        <GatewayBusinessConfig
          title="Stripe Business Configuration"
          fields={[
            {
              key: 'stripe_test_mode',
              label: 'Test Mode',
              type: 'toggle',
              description: 'Use Stripe test environment (sandbox)',
              value: getSetting('stripe_test_mode'),
              onChange: (checked) =>
                updateStripeSettingWithReload('stripe_test_mode', checked, 'Toggled Stripe test mode'),
              disabled: updating,
            },
            {
              key: 'stripe_currency',
              label: 'Default Currency',
              type: 'select',
              description: 'Currency for Stripe transactions',
              value: getSetting('stripe_currency') || 'USD',
              options: CURRENCY_OPTIONS,
              onChange: (value) =>
                updateStripeSettingWithReload('stripe_currency', value, 'Updated Stripe currency'),
              disabled: updating,
            },
            {
              key: 'stripe_capture_method',
              label: 'Capture Method',
              type: 'select',
              description: 'Payment capture timing',
              value: getSetting('stripe_capture_method') || 'manual',
              options: CAPTURE_METHOD_OPTIONS,
              onChange: (value) =>
                updateStripeSettingWithReload('stripe_capture_method', value, 'Updated Stripe capture method'),
              disabled: updating,
            },
            {
              key: 'stripe_statement_descriptor',
              label: 'Statement Descriptor',
              type: 'input',
              description: 'Text shown on customer credit card statements (max 22 characters)',
              value: getSetting('stripe_statement_descriptor') || 'LUXURY ECOM',
              maxLength: 22,
              placeholder: 'LUXURY ECOM',
              onChange: (value) =>
                updateStripeSettingWithReload('stripe_statement_descriptor', value, 'Updated statement descriptor'),
              disabled: updating,
            },
          ]}
        />
      </PaymentGatewayCard>

      {/* PayPal Payment Gateway */}
      <PaymentGatewayCard
        name="PayPal Payment Gateway"
        icon={Wallet}
        description="Configure PayPal integration for alternative payment processing"
        status={{
          configured: true, // Credentials configured in .env
          enabled: true, // Status controlled by Payment Methods section below
          keys: {
            paypal_client_id: true,
            paypal_client_secret: true,
          },
        }}
        envKeyPrefix="paypal"
        setupInstructions={{
          dashboardUrl: 'https://developer.paypal.com/dashboard',
          steps: [
            'Visit <a href="https://developer.paypal.com/dashboard/applications/live" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">PayPal Developer Dashboard</a>',
            'Create a new REST API app or select an existing one',
            'Copy your Client ID and Client Secret',
            'Add to <code class="px-1 py-0.5 bg-gray-100 rounded text-xs">apps/api/.env</code>:<pre class="mt-2 p-2 bg-gray-800 text-gray-100 rounded text-xs overflow-x-auto">PAYPAL_CLIENT_ID=your_client_id_here\nPAYPAL_CLIENT_SECRET=your_client_secret_here</pre>',
            'Restart the API server',
            'Enable PayPal in <strong>Payment Methods</strong> section below to make it available to customers',
          ],
        }}
      >
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> PayPal business configuration will be available in future updates.
            To enable/disable PayPal for customers, use the <strong>Payment Methods</strong> section below.
          </p>
        </div>
      </PaymentGatewayCard>

      {/* Payment & Escrow Settings */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <SettingsCard
          icon={Lock}
          title="Escrow & Payment Settings"
          description="Manage payment processing and escrow configuration"
        >
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h4 className="text-sm font-medium text-red-900">Form Validation Errors</h4>
              </div>
              <ul className="text-sm text-red-700 space-y-1 ml-7">
                {Object.entries(form.formState.errors).map(([field, error]: any) => (
                  <li key={field}>
                    <strong>{field}:</strong> {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <SettingsToggle
            label="Escrow System"
            description={`Enable secure payment holding until delivery confirmation${isProduction ? ' (Required in production)' : ''}`}
            checked={getUpperPaymentSetting('escrow_enabled') ?? true}
            onCheckedChange={async (checked) => {
              await updateSetting('escrow_enabled', checked, 'Toggled escrow system');
              await Promise.all([refetch(), refetchUpper()]);
            }}
            disabled={isProduction || updating}
          />

          <SettingsField
            label="Escrow Hold Period (Days)"
            id="escrow_default_hold_days"
            required
            tooltip="Number of days to hold payment after delivery before releasing to seller"
            error={form.formState.errors.escrow_default_hold_days?.message}
            helperText="Default days to hold payment after delivery (1-90 days)"
          >
            <Input
              id="escrow_default_hold_days"
              type="number"
              min={1}
              max={90}
              {...form.register('escrow_default_hold_days', { valueAsNumber: true })}
              placeholder="7"
              className="max-w-xs"
            />
          </SettingsField>

          <SettingsToggle
            label="Auto-Release Escrow"
            description="Automatically release payment after hold period expires"
            checked={getUpperPaymentSetting('escrow_auto_release_enabled') ?? true}
            onCheckedChange={async (checked) => {
              await updateSetting('escrow_auto_release_enabled', checked, 'Toggled auto-release escrow');
              await Promise.all([refetch(), refetchUpper()]);
            }}
            disabled={updating}
          />
        </SettingsCard>

        <SettingsCard
          icon={DollarSign}
          title="Payout Configuration"
          description="Configure seller payout settings"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingsField
              label="Minimum Payout Amount (USD)"
              id="min_payout_amount"
              required
              tooltip="Minimum balance required before sellers can request a payout"
              error={form.formState.errors.min_payout_amount?.message}
              helperText="Sellers must reach this amount to request payout"
            >
              <Input
                id="min_payout_amount"
                type="number"
                min={0}
                step="0.01"
                {...form.register('min_payout_amount', { valueAsNumber: true })}
                placeholder="50.00"
              />
            </SettingsField>

            <SettingsField
              label="Payout Schedule"
              id="payout_schedule"
              required
              tooltip="How often payouts are processed automatically"
              error={form.formState.errors.payout_schedule?.message}
              helperText="How often payouts are processed"
            >
              <Select
                value={form.watch('payout_schedule')}
                onValueChange={(value) => form.setValue('payout_schedule', value as any, { shouldDirty: true })}
              >
                <SelectTrigger id="payout_schedule">
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  {PAYOUT_SCHEDULE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsField>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={CreditCard}
          title="Payment Methods"
          description="Enable/disable payment methods available to customers"
        >
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-900 mb-1">
                  Single Source of Truth
                </h4>
                <p className="text-sm text-amber-700">
                  This section controls which payment methods are available to customers during checkout.
                  Gateway configuration above sets up API credentials and business logic, while these toggles
                  control customer-facing availability.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Available Payment Methods *</Label>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const currentMethods = form.watch('payment_methods') || [];
                const isChecked = Array.isArray(currentMethods) && currentMethods.includes(method.id);

                // Determine if gateway is configured
                let isConfigured = true;
                let configWarning = '';

                if (method.id === 'stripe') {
                  isConfigured = stripeStatus?.configured ?? false;
                  configWarning = !isConfigured ? 'Configure Stripe API keys above first' : '';
                } else if (method.id === 'paypal') {
                  // PayPal is configured via .env, assume available
                  isConfigured = true;
                }

                return (
                  <div key={method.id} className="flex items-start justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`payment_method_${method.id}`} className="cursor-pointer text-sm font-medium">
                          {method.label}
                        </Label>
                        {!isConfigured && (
                          <span className="text-xs text-red-600 font-medium">Not Configured</span>
                        )}
                      </div>
                      {configWarning && (
                        <p className="text-xs text-muted-foreground text-red-600">
                          {configWarning}
                        </p>
                      )}
                      {isConfigured && (
                        <p className="text-xs text-muted-foreground">
                          {method.id === 'stripe' && 'Credit/Debit cards via Stripe'}
                          {method.id === 'paypal' && 'PayPal and PayPal Credit'}
                          {method.id === 'bank_transfer' && 'Direct bank transfers'}
                        </p>
                      )}
                    </div>
                    <Switch
                      id={`payment_method_${method.id}`}
                      checked={isChecked}
                      disabled={!isConfigured}
                      onCheckedChange={(checked) => {
                        const current = form.watch('payment_methods') || [];
                        if (checked) {
                          form.setValue('payment_methods', [...current, method.id], { shouldDirty: true });
                        } else {
                          form.setValue('payment_methods', current.filter(m => m !== method.id), { shouldDirty: true });
                        }
                      }}
                    />
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
        </SettingsCard>

        <SettingsFooter
          onReset={() => form.reset()}
          onSave={() => form.handleSubmit(onSubmit)()}
          isLoading={updating}
          isDirty={isDirty}
        />
      </form>
    </div>
  );
}
