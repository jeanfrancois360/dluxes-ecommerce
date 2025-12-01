'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@luxury/ui';
import { Button } from '@luxury/ui';
import { Input } from '@luxury/ui';
import { Label } from '@luxury/ui';
import { Switch } from '@luxury/ui';
import { AlertCircle, Loader2, Lock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { deliverySettingsSchema, type DeliverySettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';

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
      form.reset(formData as DeliverySettings);
    }
  }, [settings, form]);

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

  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Delivery Settings</CardTitle>
          <CardDescription>
            Configure delivery and shipping options
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Delivery Confirmation Required */}
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="delivery_confirmation_required">Delivery Confirmation</Label>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Require delivery confirmation before releasing escrow (Required)
              </p>
            </div>
            <Switch
              id="delivery_confirmation_required"
              checked={form.watch('delivery_confirmation_required')}
              onCheckedChange={(checked) => form.setValue('delivery_confirmation_required', checked)}
              disabled={true}
            />
          </div>

          {/* Escrow Integration Info */}
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

          {/* Auto Assign Delivery */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="delivery_auto_assign">Auto-Assign Delivery Partners</Label>
              <p className="text-sm text-muted-foreground">
                Automatically assign orders to available delivery partners
              </p>
            </div>
            <Switch
              id="delivery_auto_assign"
              checked={form.watch('delivery_auto_assign')}
              onCheckedChange={(checked) => form.setValue('delivery_auto_assign', checked)}
            />
          </div>

          {/* Delivery Partner Commission */}
          <div className="space-y-2">
            <Label htmlFor="delivery_partner_commission">Delivery Partner Commission *</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="delivery_partner_commission"
                type="number"
                min={0}
                max={100}
                step="0.1"
                {...form.register('delivery_partner_commission', { valueAsNumber: true })}
                placeholder="5"
                className="max-w-[200px]"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            {form.formState.errors.delivery_partner_commission && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.delivery_partner_commission.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Commission paid to delivery partners per order
            </p>
          </div>

          {/* Free Shipping Threshold */}
          <div className="space-y-2">
            <Label htmlFor="free_shipping_threshold">Free Shipping Threshold (USD) *</Label>
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground">$</span>
              <Input
                id="free_shipping_threshold"
                type="number"
                min={0}
                step="0.01"
                {...form.register('free_shipping_threshold', { valueAsNumber: true })}
                placeholder="100.00"
                className="max-w-[200px]"
              />
            </div>
            {form.formState.errors.free_shipping_threshold && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.free_shipping_threshold.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Order total required for free shipping (set to 0 to disable)
            </p>
          </div>

          {/* Example Display */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm font-medium mb-2">Customer Experience</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Cart Total: $85.00 → Shipping: Calculated</p>
              <p>
                Cart Total: ${form.watch('free_shipping_threshold') || 100}.00+ → Shipping: FREE
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={updating}
          >
            Reset
          </Button>
          <Button type="submit" disabled={updating}>
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
