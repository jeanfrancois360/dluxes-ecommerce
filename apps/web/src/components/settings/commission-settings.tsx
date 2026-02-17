'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import {
  AlertCircle,
  Loader2,
  Info,
  Percent,
  DollarSign,
  Settings as SettingsIcon,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { commissionSettingsSchema, type CommissionSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export function CommissionSettingsSection() {
  const { settings, loading, refetch } = useSettings('commission');
  const { updateSetting, updating } = useSettingsUpdate();
  const justSavedRef = useRef(false);

  const [calcProductPrice, setCalcProductPrice] = useState(1000);
  const [calcShippingFee, setCalcShippingFee] = useState(50);

  const form = useForm<CommissionSettings>({
    resolver: zodResolver(commissionSettingsSchema),
    defaultValues: {
      global_commission_rate: 10,
      commission_type: 'percentage',
      commission_applies_to_shipping: false,
      commission_min_amount: 0.5,
      commission_max_amount: 0,
      commission_fixed_fee: 0.3,
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      if (!form.formState.isDirty || justSavedRef.current) {
        // Ensure commission_type always has a valid value even if missing from DB
        const resetData = {
          ...formData,
          commission_type: (formData.commission_type as string) || 'percentage',
        } as CommissionSettings;
        form.reset(resetData);
        justSavedRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: CommissionSettings) => {
    // Ensure commission_type always has a value before saving
    const safeData = { ...data, commission_type: data.commission_type || 'percentage' };
    try {
      const updates = Object.entries(safeData);
      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via commission settings panel');
      }
      justSavedRef.current = true;
      await refetch();
      toast.success('Commission settings saved successfully');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      justSavedRef.current = false;
      // useSettingsUpdate already shows an error toast per-setting; avoid a duplicate
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* How Commission Works */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-900">How Platform Commission Works</p>
            <div className="text-sm text-blue-700 space-y-1">
              <p>
                <strong>Step 1:</strong> Calculate percentage of order value (product + shipping if
                enabled)
              </p>
              <p>
                <strong>Step 2:</strong> Apply min/max caps if percentage falls outside limits
              </p>
              <p>
                <strong>Step 3:</strong> Add fixed transaction fee (if any)
              </p>
              <p className="text-xs pt-1 border-t border-blue-200 mt-2">
                💡 Example: $1000 sale @ 10% = $100 + $0.30 fixed fee ={' '}
                <strong>$100.30 total commission</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Percentage Commission Settings */}
      <SettingsCard
        icon={Percent}
        title="Percentage Commission"
        description="Commission rate as a percentage of order value"
      >
        <SettingsField
          label="Commission Percentage"
          id="global_commission_rate"
          required
          tooltip="The percentage of each sale charged as commission (e.g., 10% means $10 commission on a $100 sale)"
          error={form.formState.errors.global_commission_rate?.message}
        >
          <div className="flex gap-2 items-center">
            <Input
              id="global_commission_rate"
              type="number"
              min={0}
              max={100}
              step="0.1"
              {...form.register('global_commission_rate', { valueAsNumber: true })}
              placeholder="10"
              className="flex-1"
            />
            <span className="text-muted-foreground font-medium">%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {form.watch('global_commission_rate') || 0}% of order value = $
            {formatCurrencyAmount(
              (calcProductPrice * (form.watch('global_commission_rate') || 0)) / 100,
              2
            )}{' '}
            on a ${formatCurrencyAmount(calcProductPrice, 2)} order
          </p>
          {form.watch('global_commission_rate') > 30 && (
            <p className="text-sm text-yellow-600 flex items-center gap-1 mt-2">
              <AlertCircle className="h-3 w-3" />
              Warning: Rates above 30% may discourage sellers
            </p>
          )}
        </SettingsField>

        <Controller
          name="commission_applies_to_shipping"
          control={form.control}
          render={({ field }) => (
            <SettingsToggle
              label="Include Shipping in Commission"
              description="Apply commission percentage to both product price AND shipping fees"
              checked={!!field.value}
              onCheckedChange={field.onChange}
              tooltip="When ON: Commission applies to (Product + Shipping). When OFF: Commission only applies to Product price."
            />
          )}
        />

        {/* Hidden field — use defaultValue so React Hook Form owns the DOM value */}
        <input type="hidden" {...form.register('commission_type')} defaultValue="percentage" />
      </SettingsCard>

      {/* Commission Caps & Limits */}
      <SettingsCard
        icon={DollarSign}
        title="Commission Limits & Fees"
        description="Set minimum/maximum caps and fixed transaction fees"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {/* Minimum Commission Cap */}
          <SettingsField
            label="Minimum Commission"
            id="commission_min_amount"
            tooltip="Minimum commission per transaction. If percentage calculation is less than this, the minimum applies instead."
            error={form.formState.errors.commission_min_amount?.message}
          >
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground">$</span>
              <Input
                id="commission_min_amount"
                type="number"
                min={0}
                step="0.01"
                {...form.register('commission_min_amount', { valueAsNumber: true })}
                placeholder="0.50"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Protects against very low commissions on small sales
            </p>
            {(() => {
              const minAmount = form.watch('commission_min_amount') || 0;
              const maxAmount = form.watch('commission_max_amount') || 0;

              if (maxAmount > 0 && minAmount >= maxAmount) {
                return (
                  <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    Min must be less than max (${formatCurrencyAmount(maxAmount, 2)})
                  </p>
                );
              }
              return null;
            })()}
          </SettingsField>

          {/* Maximum Commission Cap */}
          <SettingsField
            label="Maximum Commission"
            id="commission_max_amount"
            tooltip="Maximum commission per transaction. If percentage calculation exceeds this, the maximum applies instead. Set to $0 for no limit."
            error={form.formState.errors.commission_max_amount?.message}
          >
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground">$</span>
              <Input
                id="commission_max_amount"
                type="number"
                min={0}
                step="0.01"
                {...form.register('commission_max_amount', { valueAsNumber: true })}
                placeholder="0 (no limit)"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(() => {
                const maxAmount = form.watch('commission_max_amount') || 0;
                return maxAmount === 0
                  ? 'No maximum limit set'
                  : `Capped at $${formatCurrencyAmount(maxAmount, 2)}`;
              })()}
            </p>
          </SettingsField>

          {/* Fixed Transaction Fee */}
          <SettingsField
            label="Fixed Transaction Fee"
            id="commission_fixed_fee"
            tooltip="Flat fee added to EVERY transaction, similar to payment processor fees (e.g., Stripe's $0.30). Added AFTER percentage commission."
            error={form.formState.errors.commission_fixed_fee?.message}
          >
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground">$</span>
              <Input
                id="commission_fixed_fee"
                type="number"
                min={0}
                step="0.01"
                {...form.register('commission_fixed_fee', { valueAsNumber: true })}
                placeholder="0.30"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Added to every sale regardless of order value
            </p>
          </SettingsField>
        </div>

        {/* Visual Formula */}
        <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
          <div className="flex gap-2">
            <Calculator className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-purple-900">
                Commission Calculation Formula
              </p>
              <div className="font-mono text-sm text-purple-700 space-y-1">
                <p>
                  1. Percentage Fee = (Order Value × {form.watch('global_commission_rate') || 0}%)
                </p>
                <p>2. Apply Min/Max Caps (if exceeded)</p>
                <p>
                  3. Total Commission = Percentage Fee + $
                  {formatCurrencyAmount(form.watch('commission_fixed_fee') || 0, 2)} fixed
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Live Calculator */}
      <SettingsCard
        icon={Calculator}
        title="Commission Calculator"
        description="Test your commission settings with real numbers"
      >
        {/* Calculator Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="calc_product_price">Product Price</Label>
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground">$</span>
              <Input
                id="calc_product_price"
                type="number"
                min={0}
                step="0.01"
                value={calcProductPrice}
                onChange={(e) => setCalcProductPrice(parseFloat(e.target.value) || 0)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calc_shipping_fee">Shipping Fee</Label>
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground">$</span>
              <Input
                id="calc_shipping_fee"
                type="number"
                min={0}
                step="0.01"
                value={calcShippingFee}
                onChange={(e) => setCalcShippingFee(parseFloat(e.target.value) || 0)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Calculation Breakdown */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
          {/* Order Summary */}
          <div className="space-y-2 pb-3 border-b">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Product Price:</span>
              <span className="font-medium">${formatCurrencyAmount(calcProductPrice, 2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping Fee:</span>
              <span className="font-medium">${formatCurrencyAmount(calcShippingFee, 2)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Order Total:</span>
              <span>${formatCurrencyAmount(calcProductPrice + calcShippingFee, 2)}</span>
            </div>
          </div>

          {/* Commission Calculation Steps */}
          {(() => {
            const rate = form.watch('global_commission_rate') || 0;
            const applyToShipping = form.watch('commission_applies_to_shipping');
            const minAmount = form.watch('commission_min_amount') || 0;
            const maxAmount = form.watch('commission_max_amount') || 0;
            const fixedFee = form.watch('commission_fixed_fee') || 0;

            const commissionBase = applyToShipping
              ? calcProductPrice + calcShippingFee
              : calcProductPrice;
            let percentageFee = (commissionBase * rate) / 100;
            const originalPercentageFee = percentageFee;
            let capApplied = '';

            // Apply min cap
            if (percentageFee < minAmount) {
              percentageFee = minAmount;
              capApplied = 'minimum';
            }

            // Apply max cap
            if (maxAmount > 0 && percentageFee > maxAmount) {
              percentageFee = maxAmount;
              capApplied = 'maximum';
            }

            const totalCommission = percentageFee + fixedFee;
            const sellerReceives = calcProductPrice + calcShippingFee - totalCommission;

            return (
              <>
                {/* Step 1: Percentage Calculation */}
                <div className="space-y-2 py-3 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Step 1: Percentage Commission
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Commission Base{applyToShipping ? ' (Product + Shipping)' : ' (Product Only)'}
                      :
                    </span>
                    <span className="font-medium">${formatCurrencyAmount(commissionBase, 2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rate ({rate}%):</span>
                    <span className="font-medium">
                      ${formatCurrencyAmount(originalPercentageFee, 2)}
                    </span>
                  </div>
                </div>

                {/* Step 2: Caps Applied */}
                <div className="space-y-2 py-3 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Step 2: Apply Caps
                  </p>
                  {capApplied ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-600 font-medium capitalize">
                        {capApplied} cap applied:
                      </span>
                      <span className="font-semibold text-orange-600">
                        ${formatCurrencyAmount(originalPercentageFee, 2)} → $
                        {formatCurrencyAmount(percentageFee, 2)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">No caps applied:</span>
                      <span className="text-green-600 font-medium">✓ Within limits</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Percentage Fee After Caps:</span>
                    <span className="font-medium">${formatCurrencyAmount(percentageFee, 2)}</span>
                  </div>
                </div>

                {/* Step 3: Add Fixed Fee */}
                <div className="space-y-2 py-3 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Step 3: Add Transaction Fee
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Percentage Fee:</span>
                    <span className="font-medium">${formatCurrencyAmount(percentageFee, 2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fixed Transaction Fee:</span>
                    <span className="font-medium">+ ${formatCurrencyAmount(fixedFee, 2)}</span>
                  </div>
                </div>

                {/* Final Result */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-base bg-primary/10 -mx-4 px-4 py-3 rounded">
                    <span className="font-bold text-primary">Total Platform Commission:</span>
                    <span className="font-bold text-primary text-xl">
                      ${formatCurrencyAmount(totalCommission, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base bg-green-50 -mx-4 px-4 py-3 rounded">
                    <span className="font-bold text-green-700">Seller Receives:</span>
                    <span className="font-bold text-green-600 text-xl">
                      ${formatCurrencyAmount(sellerReceives, 2)}
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </SettingsCard>

      {/* Commission Overrides Info */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-2">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-900">Override Priority</p>
            <p className="text-sm text-amber-700">
              These are default rates. You can set custom commission rates for specific sellers or
              categories.
            </p>
            <p className="text-xs text-amber-600 font-semibold">
              Priority: Seller-specific override → Category override → Global rate (configured here)
            </p>
            <div className="flex gap-3 mt-3">
              <a
                href="/admin/categories"
                className="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
              >
                Manage Category Overrides →
              </a>
              <a
                href="/admin/commissions"
                className="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
              >
                Manage Seller Overrides →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <SettingsFooter
        onReset={() => form.reset()}
        onSave={form.handleSubmit(onSubmit)}
        isLoading={updating}
        isDirty={isDirty}
      />
    </form>
  );
}
