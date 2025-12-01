'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@luxury/ui';
import { Button } from '@luxury/ui';
import { Input } from '@luxury/ui';
import { Label } from '@luxury/ui';
import { Switch } from '@luxury/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@luxury/ui';
import { AlertCircle, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { commissionSettingsSchema, type CommissionSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';

export function CommissionSettingsSection() {
  const { settings, loading, refetch } = useSettings('commission');
  const { updateSetting, updating } = useSettingsUpdate();

  const form = useForm<CommissionSettings>({
    resolver: zodResolver(commissionSettingsSchema),
    defaultValues: {
      global_commission_rate: 10,
      commission_type: 'percentage',
      commission_applies_to_shipping: false,
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      form.reset(formData as CommissionSettings);
    }
  }, [settings, form]);

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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
          <CardDescription>
            Configure platform commission rates and calculation methods
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
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
            <Label htmlFor="global_commission_rate">Global Commission Rate *</Label>
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
            <p className="text-sm text-muted-foreground">
              Default commission rate applied to all sales (0-100%)
            </p>
          </div>

          {/* Commission Type */}
          <div className="space-y-2">
            <Label htmlFor="commission_type">Commission Type *</Label>
            <Select
              value={form.watch('commission_type')}
              onValueChange={(value) => form.setValue('commission_type', value as any)}
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
            <div className="space-y-0.5">
              <Label htmlFor="commission_applies_to_shipping">Apply Commission to Shipping</Label>
              <p className="text-sm text-muted-foreground">
                Include shipping fees in commission calculation
              </p>
            </div>
            <Switch
              id="commission_applies_to_shipping"
              checked={form.watch('commission_applies_to_shipping')}
              onCheckedChange={(checked) => form.setValue('commission_applies_to_shipping', checked)}
            />
          </div>

          {/* Example Calculation */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm font-medium mb-2">Example Calculation</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Product Price: $1,000.00</p>
              <p>Shipping Fee: $50.00</p>
              <p>Commission Rate: {form.watch('global_commission_rate') || 0}%</p>
              <hr className="my-2" />
              <p className="font-medium text-foreground">
                Platform Fee: $
                {(() => {
                  const rate = form.watch('global_commission_rate') || 0;
                  const applyToShipping = form.watch('commission_applies_to_shipping');
                  const base = applyToShipping ? 1050 : 1000;
                  return ((base * rate) / 100).toFixed(2);
                })()}
              </p>
              <p className="font-medium text-foreground">
                Seller Receives: $
                {(() => {
                  const rate = form.watch('global_commission_rate') || 0;
                  const applyToShipping = form.watch('commission_applies_to_shipping');
                  const base = applyToShipping ? 1050 : 1000;
                  const total = 1050;
                  const commission = (base * rate) / 100;
                  return (total - commission).toFixed(2);
                })()}
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
