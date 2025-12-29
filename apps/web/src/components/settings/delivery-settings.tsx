'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Loader2, Truck, Info, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { deliverySettingsSchema, type DeliverySettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';

export function DeliverySettingsSection() {
  const { settings, loading, refetch } = useSettings('delivery');
  const { updateSetting, updating } = useSettingsUpdate();

  const form = useForm<DeliverySettings>({
    resolver: zodResolver(deliverySettingsSchema),
    defaultValues: {
      delivery_confirmation_required: true,
      delivery_auto_assign: false,
      delivery_partner_commission: 5,
      free_shipping_threshold: 100,
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      form.reset(formData as DeliverySettings, { keepDirtyValues: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: DeliverySettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via settings panel');
      }
      toast.success('Delivery settings saved successfully');
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <SettingsCard
        icon={Truck}
        title="Delivery Configuration"
        description="Configure delivery and shipping options"
      >
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Escrow Integration
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                When delivery is confirmed, escrow hold period starts automatically. Payment releases after hold period expires.
              </p>
            </div>
          </div>
        </div>

        <SettingsToggle
          label="Delivery Confirmation"
          description="Require delivery confirmation before releasing escrow (Required)"
          checked={form.watch('delivery_confirmation_required')}
          onCheckedChange={(checked) => form.setValue('delivery_confirmation_required', checked, { shouldDirty: true })}
          disabled={true}
          tooltip="This setting is required and cannot be disabled for security reasons"
        />

        <SettingsToggle
          label="Auto-Assign Delivery Partners"
          description="Automatically assign orders to available delivery partners"
          checked={form.watch('delivery_auto_assign')}
          onCheckedChange={(checked) => form.setValue('delivery_auto_assign', checked, { shouldDirty: true })}
          tooltip="When enabled, orders will be automatically assigned to available delivery partners based on location and availability"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            label="Delivery Partner Commission"
            id="delivery_partner_commission"
            required
            tooltip="Percentage commission paid to delivery partners per order"
            error={form.formState.errors.delivery_partner_commission?.message}
            helperText="Commission paid to delivery partners per order"
            suffix="%"
          >
            <div className="flex gap-2 items-center">
              <Input
                id="delivery_partner_commission"
                type="number"
                min={0}
                max={100}
                step="0.1"
                {...form.register('delivery_partner_commission', { valueAsNumber: true })}
                placeholder="5"
                className="flex-1"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </SettingsField>

          <SettingsField
            label="Free Shipping Threshold (USD)"
            id="free_shipping_threshold"
            required
            tooltip="Order total required for free shipping. Set to 0 to disable free shipping."
            error={form.formState.errors.free_shipping_threshold?.message}
            helperText="Order total required for free shipping (set to 0 to disable)"
            prefix="$"
          >
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground">$</span>
              <Input
                id="free_shipping_threshold"
                type="number"
                min={0}
                step="0.01"
                {...form.register('free_shipping_threshold', { valueAsNumber: true })}
                placeholder="100.00"
                className="flex-1"
              />
            </div>
          </SettingsField>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="text-sm font-medium mb-2">Customer Experience</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Cart Total: $85.00 → Shipping: Calculated</p>
            <p>
              Cart Total: ${form.watch('free_shipping_threshold') || 100}.00+ → Shipping: FREE
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsFooter
        onReset={() => form.reset()}
        onSave={() => form.handleSubmit(onSubmit)()}
        isLoading={updating}
        isDirty={isDirty}
      />
    </form>
  );
}
