'use client';

import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import {
  Loader2,
  Info,
  DollarSign,
  Store,
  Clock,
  UserCheck,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

// Validation schema
const sellerSettingsSchema = z.object({
  seller_monthly_credit_price: z.number().min(0).max(9999),
  seller_min_credit_purchase: z.number().int().min(1).max(24),
  seller_max_credit_purchase: z.number().int().min(1).max(24),
  seller_credit_grace_period_days: z.number().int().min(0).max(30),
  seller_low_credit_warning_threshold: z.number().int().min(0).max(12),
  seller_auto_approve: z.boolean(),
  seller_application_review_required: z.boolean(),
  seller_minimum_payout: z.number().min(0).max(10000),
});

type SellerSettings = z.infer<typeof sellerSettingsSchema>;

export function SellerSettingsSection() {
  const { settings, loading, refetch } = useSettings('seller');
  const { updateSetting, updating } = useSettingsUpdate();
  const justSavedRef = useRef(false);

  const form = useForm<SellerSettings>({
    resolver: zodResolver(sellerSettingsSchema),
    defaultValues: {
      seller_monthly_credit_price: 29.99,
      seller_min_credit_purchase: 1,
      seller_max_credit_purchase: 12,
      seller_credit_grace_period_days: 3,
      seller_low_credit_warning_threshold: 2,
      seller_auto_approve: false,
      seller_application_review_required: true,
      seller_minimum_payout: 50.0,
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      if (!form.formState.isDirty || justSavedRef.current) {
        form.reset(formData as SellerSettings);
        justSavedRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: SellerSettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via seller settings panel');
      }
      justSavedRef.current = true;
      await refetch();
      toast.success('Seller settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
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
  const monthlyPrice = form.watch('seller_monthly_credit_price') || 29.99;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-900">How Selling Credits Work</p>
            <div className="text-sm text-blue-700 space-y-1">
              <p>
                <strong>Step 1:</strong> Sellers purchase credits (months) to keep PHYSICAL products
                active
              </p>
              <p>
                <strong>Step 2:</strong> Credits are deducted monthly via automated cron job
              </p>
              <p>
                <strong>Step 3:</strong> When credits reach 0, grace period begins (if enabled)
              </p>
              <p>
                <strong>Step 4:</strong> After grace period, products are automatically suspended
              </p>
              <p className="text-xs pt-1 border-t border-blue-200 mt-2">
                💡 Example: At ${monthlyPrice.toFixed(2)}/month, 12 months costs $
                {(monthlyPrice * 12).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Settings */}
      <SettingsCard
        icon={DollarSign}
        title="Selling Credits Pricing"
        description="Configure monthly credit pricing for physical product listings"
      >
        <SettingsField
          label="Monthly Credit Price (USD)"
          id="seller_monthly_credit_price"
          required
          tooltip="Price charged per month to keep physical products listed and active"
          error={form.formState.errors.seller_monthly_credit_price?.message}
        >
          <div className="flex gap-2 items-center">
            <span className="text-muted-foreground font-medium">$</span>
            <Input
              id="seller_monthly_credit_price"
              type="number"
              min={0}
              max={9999}
              step="0.01"
              {...form.register('seller_monthly_credit_price', { valueAsNumber: true })}
              placeholder="29.99"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sellers pay ${monthlyPrice.toFixed(2)}/month. Example: 6 months = $
            {(monthlyPrice * 6).toFixed(2)}
          </p>
        </SettingsField>

        <div className="grid grid-cols-2 gap-4">
          <SettingsField
            label="Minimum Purchase (months)"
            id="seller_min_credit_purchase"
            required
            tooltip="Minimum number of months sellers can purchase at once"
            error={form.formState.errors.seller_min_credit_purchase?.message}
          >
            <Input
              id="seller_min_credit_purchase"
              type="number"
              min={1}
              max={24}
              {...form.register('seller_min_credit_purchase', { valueAsNumber: true })}
              placeholder="1"
            />
          </SettingsField>

          <SettingsField
            label="Maximum Purchase (months)"
            id="seller_max_credit_purchase"
            required
            tooltip="Maximum number of months sellers can purchase at once"
            error={form.formState.errors.seller_max_credit_purchase?.message}
          >
            <Input
              id="seller_max_credit_purchase"
              type="number"
              min={1}
              max={24}
              {...form.register('seller_max_credit_purchase', { valueAsNumber: true })}
              placeholder="12"
            />
          </SettingsField>
        </div>

        {/* Price Examples */}
        <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Price Examples</span>
            </div>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>1 month:</span>
              <span className="font-semibold">${monthlyPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>6 months:</span>
              <span className="font-semibold">${(monthlyPrice * 6).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>12 months:</span>
              <span className="font-semibold">${(monthlyPrice * 12).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Credit Management */}
      <SettingsCard
        icon={Clock}
        title="Credit Management"
        description="Configure grace periods, warnings, and credit depletion policies"
      >
        <SettingsField
          label="Grace Period (days)"
          id="seller_credit_grace_period_days"
          required
          tooltip="Days sellers can continue selling after credits run out. Set to 0 to disable grace period."
          error={form.formState.errors.seller_credit_grace_period_days?.message}
        >
          <Input
            id="seller_credit_grace_period_days"
            type="number"
            min={0}
            max={30}
            {...form.register('seller_credit_grace_period_days', { valueAsNumber: true })}
            placeholder="3"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Products remain active during grace period. After expiry, products are automatically
            suspended.
          </p>
        </SettingsField>

        <SettingsField
          label="Low Credit Warning (months)"
          id="seller_low_credit_warning_threshold"
          required
          tooltip="Send warning emails when seller credit balance falls to or below this threshold"
          error={form.formState.errors.seller_low_credit_warning_threshold?.message}
        >
          <Input
            id="seller_low_credit_warning_threshold"
            type="number"
            min={0}
            max={12}
            {...form.register('seller_low_credit_warning_threshold', { valueAsNumber: true })}
            placeholder="2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Sellers receive email alerts when their balance reaches this threshold
          </p>
        </SettingsField>

        {/* How Deductions Work */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex gap-3">
            <Store className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">Automated Credit Deductions</p>
              <p className="text-xs text-blue-700">
                A cron job runs monthly to deduct 1 credit from each seller&apos;s balance. When
                balance reaches 0, the grace period begins. After the grace period expires, all
                active products are automatically suspended (status: ARCHIVED) until credits are
                purchased.
              </p>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Seller Approval */}
      <SettingsCard
        icon={UserCheck}
        title="Seller Approval"
        description="Configure seller application and approval workflow"
      >
        <Controller
          name="seller_auto_approve"
          control={form.control}
          render={({ field }) => (
            <SettingsToggle
              label="Auto-Approve Sellers"
              description="Automatically approve seller applications without manual review"
              checked={!!field.value}
              onCheckedChange={field.onChange}
              tooltip="When ON: Sellers are approved instantly. When OFF: Admin must manually approve each application."
            />
          )}
        />

        <Controller
          name="seller_application_review_required"
          control={form.control}
          render={({ field }) => (
            <SettingsToggle
              label="Require Manual Review"
              description="Admin must manually review and approve each seller application"
              checked={!!field.value}
              onCheckedChange={field.onChange}
              tooltip="When ON: Applications go to admin dashboard for review. When OFF: Sellers can start selling immediately."
            />
          )}
        />

        <SettingsField
          label="Minimum Payout Threshold (USD)"
          id="seller_minimum_payout"
          required
          tooltip="Minimum balance required before sellers can request a payout"
          error={form.formState.errors.seller_minimum_payout?.message}
        >
          <div className="flex gap-2 items-center">
            <span className="text-muted-foreground font-medium">$</span>
            <Input
              id="seller_minimum_payout"
              type="number"
              min={0}
              max={10000}
              step="0.01"
              {...form.register('seller_minimum_payout', { valueAsNumber: true })}
              placeholder="50.00"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sellers must have at least this amount in earnings before requesting a payout
          </p>
        </SettingsField>

        {/* Warning for conflicting settings */}
        {form.watch('seller_auto_approve') && form.watch('seller_application_review_required') && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-900">Conflicting Settings</p>
                <p className="text-xs text-yellow-700">
                  Both &quot;Auto-Approve&quot; and &quot;Require Manual Review&quot; are enabled.
                  Auto-approve will take precedence.
                </p>
              </div>
            </div>
          </div>
        )}
      </SettingsCard>

      {/* Footer */}
      <SettingsFooter
        isDirty={isDirty}
        isLoading={updating}
        onSave={form.handleSubmit(onSubmit)}
        onReset={() => form.reset()}
      />
    </form>
  );
}
