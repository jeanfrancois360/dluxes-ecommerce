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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@nextpik/ui/components/tooltip';
import { AlertCircle, Loader2, Info, HelpCircle, TrendingUp, Users, FolderTree } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { commissionSettingsSchema, type CommissionSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
export function CommissionSettingsSection() {
  const { settings, loading, refetch } = useSettings('commission');
  const { updateSetting, updating } = useSettingsUpdate();

  const [calcProductPrice, setCalcProductPrice] = useState(1000);
  const [calcShippingFee, setCalcShippingFee] = useState(50);

  const form = useForm<CommissionSettings>({
    resolver: zodResolver(commissionSettingsSchema),
    defaultValues: {
      global_commission_rate: 10,
      commission_type: 'percentage',
      commission_applies_to_shipping: false,
      commission_min_amount: 0.50,
      commission_max_amount: 0,
      commission_fixed_fee: 0.30,
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      form.reset(formData as CommissionSettings, { keepDirtyValues: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]); // form is stable, don't include it

  const onSubmit = async (data: CommissionSettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via settings panel');
      }
      toast.success('Commission settings saved successfully');
      await refetch();
    } catch (error) {
      console.error('Failed to save settings:', error);
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

  const isDirty = form.formState.isDirty;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="border-muted shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            Commission Settings
            {isDirty && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                Unsaved changes
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Configure platform commission rates and calculation methods
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-12">
          {/* Commission Priority Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Commission Priority
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Seller-specific override → Category override → Global rate (configured below)
                </p>
              </div>
            </div>
          </div>

          {/* Global Commission Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="global_commission_rate">Global Commission Rate *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The default commission percentage applied to all sales. Can be overridden at category or seller level.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                id="global_commission_rate"
                type="number"
                min={0}
                max={100}
                step="0.1"
                {...form.register('global_commission_rate', { valueAsNumber: true })}
                placeholder="10"
                className="max-w-[200px]"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            {form.formState.errors.global_commission_rate && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.global_commission_rate.message}
              </p>
            )}
            {form.watch('global_commission_rate') > 30 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Warning: Commission rate above 30% may discourage sellers
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Default commission rate applied to all sales (0-100%)
            </p>
          </div>

          {/* Commission Type */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="commission_type">Commission Type *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p><strong>Percentage:</strong> Commission based on sale amount<br/>
                    <strong>Fixed:</strong> Flat fee per transaction<br/>
                    <strong>Tiered:</strong> Rate varies by order value</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={form.watch('commission_type')}
              onValueChange={(value) => form.setValue('commission_type', value as any, { shouldDirty: true })}
            >
              <SelectTrigger id="commission_type" className="max-w-[300px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
                <SelectItem value="tiered">Tiered (varies by amount)</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.commission_type && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.commission_type.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              How commission is calculated on sales
            </p>
          </div>

          {/* Apply to Shipping */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="commission_applies_to_shipping">Apply Commission to Shipping</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>When enabled, the commission rate applies to both product price and shipping fees.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">
                Include shipping fees in commission calculation
              </p>
            </div>
            <Switch
              id="commission_applies_to_shipping"
              checked={form.watch('commission_applies_to_shipping')}
              onCheckedChange={(checked) => form.setValue('commission_applies_to_shipping', checked, { shouldDirty: true })}
            />
          </div>

          {/* Commission Calculation Formula */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Commission Calculation Formula
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300 font-mono">
                  Commission = (Order Amount × Rate%) + Fixed Fee
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Then min/max limits are applied to the final commission amount (including fixed fee)
                </p>
              </div>
            </div>
          </div>

          {/* Commission Limits Section */}
          <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Commission Limits</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Minimum Commission */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="commission_min_amount">Minimum Commission</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>The minimum commission charged per transaction, regardless of the percentage rate. Useful for low-value items.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="commission_min_amount"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register('commission_min_amount', { valueAsNumber: true })}
                    placeholder="0.50"
                    className="max-w-[280px]"
                  />
                </div>
                {form.formState.errors.commission_min_amount && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {form.formState.errors.commission_min_amount.message}
                  </p>
                )}
                {(() => {
                  const minAmount = form.watch('commission_min_amount') || 0;
                  const maxAmount = form.watch('commission_max_amount') || 0;
                  const fixedFee = form.watch('commission_fixed_fee') || 0;

                  if (maxAmount > 0 && minAmount >= maxAmount) {
                    return (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Minimum must be less than maximum (${formatCurrencyAmount(maxAmount, 2)})
                      </p>
                    );
                  }

                  if (minAmount > 0 && fixedFee >= minAmount) {
                    return (
                      <p className="text-sm text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Fixed fee (${formatCurrencyAmount(fixedFee, 2)}) meets/exceeds minimum
                      </p>
                    );
                  }

                  return (
                    <p className="text-xs text-muted-foreground">
                      Minimum fee charged per transaction
                    </p>
                  );
                })()}
              </div>

              {/* Maximum Commission */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="commission_max_amount">Maximum Commission</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>The maximum commission cap per transaction. Set to $0 for no maximum limit. Useful for high-value items.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="commission_max_amount"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register('commission_max_amount', { valueAsNumber: true })}
                    placeholder="0 (no maximum)"
                    className="max-w-[280px]"
                  />
                </div>
                {form.formState.errors.commission_max_amount && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {form.formState.errors.commission_max_amount.message}
                  </p>
                )}
                {(() => {
                  const maxAmount = form.watch('commission_max_amount') || 0;
                  const minAmount = form.watch('commission_min_amount') || 0;

                  if (maxAmount > 0 && minAmount >= maxAmount) {
                    return (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Maximum must be greater than minimum (${formatCurrencyAmount(minAmount, 2)})
                      </p>
                    );
                  }

                  return (
                    <p className="text-xs text-muted-foreground">
                      {maxAmount === 0 ? 'No maximum limit' : `Capped at $${formatCurrencyAmount(maxAmount, 2)}`}
                    </p>
                  );
                })()}
              </div>

              {/* Fixed Fee */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="commission_fixed_fee">Fixed Fee per Transaction</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>A flat fee added to every transaction (similar to Stripe's $0.30 fee). This is added on top of the percentage-based commission.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="commission_fixed_fee"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register('commission_fixed_fee', { valueAsNumber: true })}
                    placeholder="0.30"
                    className="max-w-[280px]"
                  />
                </div>
                {form.formState.errors.commission_fixed_fee && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {form.formState.errors.commission_fixed_fee.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Flat fee added to every transaction
                </p>
              </div>
            </div>
          </div>

          {/* Commission Overrides Summary */}
          <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-950">
            <div className="flex items-center gap-3 pb-2">
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(203, 181, 123, 0.12)' }}>
                <Users className="h-5 w-5" style={{ color: '#CBB57B' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Commission Overrides</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Custom rates for categories and sellers</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-slate-400 dark:text-slate-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Custom commission rates that override the global rate for specific categories or sellers.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {/* Category Overrides */}
              <a
                href="/admin/categories"
                className="group relative flex items-center gap-4 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-all duration-200 hover:border-[#CBB57B] hover:bg-white dark:hover:bg-slate-950 hover:shadow-md"
              >
                <div className="p-2.5 rounded-lg flex-shrink-0" style={{ backgroundColor: '#CBB57B' }}>
                  <FolderTree className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900 dark:text-white">Category Overrides</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Custom rates per category</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all" style={{ color: '#CBB57B' }}>
                  <span>View</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </a>

              {/* Seller Overrides */}
              <a
                href="/admin/commissions"
                className="group relative flex items-center gap-4 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-all duration-200 hover:border-[#CBB57B] hover:bg-white dark:hover:bg-slate-950 hover:shadow-md"
              >
                <div className="p-2.5 rounded-lg flex-shrink-0" style={{ backgroundColor: '#CBB57B' }}>
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900 dark:text-white">Seller Overrides</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Custom rates per seller</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all" style={{ color: '#CBB57B' }}>
                  <span>View</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </a>
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-lg border" style={{ backgroundColor: 'rgba(203, 181, 123, 0.05)', borderColor: 'rgba(203, 181, 123, 0.2)' }}>
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#CBB57B' }} />
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="font-semibold" style={{ color: '#CBB57B' }}>Priority:</strong> Seller-specific override → Category override → Global rate
              </p>
            </div>
          </div>

          {/* Interactive Calculator */}
          <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 dark:from-primary/10 dark:to-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Interactive Calculator</h3>
            </div>

            {/* Calculator Inputs */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
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
                    className="flex-1 bg-background"
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
                    className="flex-1 bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="space-y-3 p-4 rounded-lg bg-background/50 border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Product Price:</span>
                <span className="font-medium">${formatCurrencyAmount(calcProductPrice, 2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping Fee:</span>
                <span className="font-medium">${formatCurrencyAmount(calcShippingFee, 2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Total:</span>
                <span className="font-medium">${formatCurrencyAmount(calcProductPrice + calcShippingFee, 2)}</span>
              </div>

              <hr className="my-2" />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commission Rate:</span>
                <span className="font-medium">{form.watch('global_commission_rate') || 0}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base for Commission:</span>
                <span className="font-medium">
                  ${formatCurrencyAmount(
                    form.watch('commission_applies_to_shipping')
                      ? calcProductPrice + calcShippingFee
                      : calcProductPrice,
                    2
                  )}
                  {form.watch('commission_applies_to_shipping') ? (
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 ml-1">(+ shipping)</span>
                  ) : (
                    <span className="text-xs text-muted-foreground ml-1">(product only)</span>
                  )}
                </span>
              </div>

              <hr className="my-2" />

              {(() => {
                const rate = form.watch('global_commission_rate') || 0;
                const applyToShipping = form.watch('commission_applies_to_shipping');
                const minAmount = form.watch('commission_min_amount') || 0;
                const maxAmount = form.watch('commission_max_amount') || 0;
                const fixedFee = form.watch('commission_fixed_fee') || 0;

                const base = applyToShipping ? calcProductPrice + calcShippingFee : calcProductPrice;
                const rawPercentageCommission = (base * rate) / 100;
                let percentageCommission = rawPercentageCommission;
                let minApplied = false;
                let maxApplied = false;

                // Apply minimum
                if (percentageCommission < minAmount) {
                  percentageCommission = minAmount;
                  minApplied = true;
                }

                // Apply maximum (if set)
                if (maxAmount > 0 && percentageCommission > maxAmount) {
                  percentageCommission = maxAmount;
                  maxApplied = true;
                }

                // Add fixed fee
                const totalCommission = percentageCommission + fixedFee;
                const sellerReceives = calcProductPrice + calcShippingFee - totalCommission;

                return (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Calculated ({rate}% of ${formatCurrencyAmount(base, 2)}):</span>
                      <span className="font-medium">${formatCurrencyAmount(rawPercentageCommission, 2)}</span>
                    </div>

                    {/* Show when min/max is applied */}
                    {(minApplied || maxApplied) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {minApplied ? 'Minimum limit applied:' : 'Maximum limit applied:'}
                        </span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          ${formatCurrencyAmount(rawPercentageCommission, 2)} → ${formatCurrencyAmount(percentageCommission, 2)}
                        </span>
                      </div>
                    )}

                    {!minApplied && !maxApplied && percentageCommission > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">After limits:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          No limits applied ✓
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Percentage Fee:</span>
                      <span className="font-medium">${formatCurrencyAmount(percentageCommission, 2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fixed Fee:</span>
                      <span className="font-medium">${formatCurrencyAmount(fixedFee, 2)}</span>
                    </div>

                    <hr className="my-3 border-primary/30" />

                    <div className="flex justify-between text-base">
                      <span className="font-semibold text-primary">Total Platform Fee:</span>
                      <span className="font-bold text-primary text-lg">
                        ${formatCurrencyAmount(totalCommission, 2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Seller Receives:</span>
                      <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                        ${formatCurrencyAmount(sellerReceives, 2)}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
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
  );
}
