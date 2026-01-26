'use client';

import { useEffect, useRef } from 'react';
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
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export function DeliverySettingsSection() {
  const { settings, loading, refetch } = useSettings('delivery');
  const { updateSetting, updating } = useSettingsUpdate();
  const justSavedRef = useRef(false);

  const form = useForm<DeliverySettings>({
    resolver: zodResolver(deliverySettingsSchema),
    defaultValues: {
      delivery_confirmation_required: true,
      delivery_auto_assign: false,
      delivery_partner_commission: 5,
      free_shipping_enabled: true,
      free_shipping_threshold: 100,
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      if (!form.formState.isDirty || justSavedRef.current) {
        form.reset(formData as DeliverySettings);
        justSavedRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: DeliverySettings) => {
    try {
      // Protected settings that cannot be edited
      const protectedSettings = ['delivery_confirmation_required'];

      // Filter out protected settings before saving
      const updates = Object.entries(data).filter(([key]) => !protectedSettings.includes(key));

      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via settings panel');
      }
      justSavedRef.current = true;
      toast.success('Delivery settings saved successfully');
      await refetch();
    } catch (error) {
      console.error('Failed to save settings:', error);
      justSavedRef.current = false;
    }
  };

  // Keyboard shortcuts
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
      <SettingsCard
        icon={Truck}
        title="Delivery Configuration"
        description="Configure delivery and shipping options"
      >
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 ">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 ">
                Escrow Integration
              </p>
              <p className="text-sm text-blue-700 ">
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

        <SettingsToggle
          label="Enable Free Shipping"
          description="Offer free shipping when order total exceeds threshold"
          checked={form.watch('free_shipping_enabled')}
          onCheckedChange={(checked) => form.setValue('free_shipping_enabled', checked, { shouldDirty: true })}
          tooltip="When enabled, orders above the threshold will qualify for free shipping"
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

          {form.watch('free_shipping_enabled') && (
            <SettingsField
              label="Free Shipping Threshold (USD)"
              id="free_shipping_threshold"
              required
              tooltip="Order total required for free shipping"
              error={form.formState.errors.free_shipping_threshold?.message}
              helperText="Order total required for free shipping"
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
          )}
        </div>

        {form.watch('free_shipping_enabled') && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ">
            <p className="text-sm font-medium mb-2">Customer Experience</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Cart Total: $85.00 → Shipping: Calculated</p>
              <p>
                Cart Total: ${form.watch('free_shipping_threshold') || 100}.00+ → Shipping: FREE
              </p>
            </div>
          </div>
        )}
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
