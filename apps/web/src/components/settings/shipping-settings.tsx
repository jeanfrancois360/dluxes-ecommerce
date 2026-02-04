'use client';

import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@nextpik/ui';
import { Loader2, Calculator, Info, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { shippingSettingsSchema, type ShippingSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

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
      shipping_international_surcharge: 15.00,
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
      for (const [key, value] of Object.entries(data)) {
        await updateSetting(key, value, 'Updated via settings panel');
      }
      justSavedRef.current = true;
      toast.success('Shipping settings saved successfully');
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
                <li><strong>Manual:</strong> Use manually configured rates (below)</li>
                <li><strong>DHL API:</strong> Real-time rates from DHL (coming soon)</li>
                <li><strong>Hybrid:</strong> Try DHL API, fallback to manual if unavailable</li>
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
            onValueChange={(value) => form.setValue('shipping_mode', value as any, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual Configuration</SelectItem>
              <SelectItem value="dhl_api" disabled>DHL API (Coming Soon)</SelectItem>
              <SelectItem value="hybrid" disabled>Hybrid (Coming Soon)</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>

        {currentMode === 'manual' && (
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
              <p className="text-sm font-medium mb-2">Rate Preview</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Standard (5-7 days): ${(form.watch('shipping_standard_rate') ?? 9.99).toFixed(2)}</p>
                <p>Express (2-3 days): ${(form.watch('shipping_express_rate') ?? 19.99).toFixed(2)}</p>
                <p>Overnight (1 day): ${(form.watch('shipping_overnight_rate') ?? 29.99).toFixed(2)}</p>
                <p>International Surcharge: +${(form.watch('shipping_international_surcharge') ?? 15.00).toFixed(2)}</p>
              </div>
            </div>
          </>
        )}
      </SettingsCard>

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
            Orders ${(form.watch('free_shipping_threshold') ?? 100).toFixed(2)} or more will receive free shipping
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
