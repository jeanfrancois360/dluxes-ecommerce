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
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { paymentSettingsSchema, type PaymentSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';

export function PaymentSettingsSection() {
  const { settings, loading, refetch } = useSettings('payment');
  const { updateSetting, updating } = useSettingsUpdate();

  const form = useForm<PaymentSettings>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      escrow_enabled: true,
      escrow_default_hold_days: 7,
      escrow_auto_release_enabled: true,
      min_payout_amount: 50,
      payout_schedule: 'weekly',
      payment_methods: ['stripe', 'paypal'],
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      form.reset(formData as PaymentSettings);
    }
  }, [settings, form]);

  const onSubmit = async (data: PaymentSettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via settings panel');
      }
      toast.success('Payment settings saved successfully');
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
          <CardTitle>Payment & Escrow Settings</CardTitle>
          <CardDescription>
            Manage payment processing and escrow configuration
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Escrow Enabled */}
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
              checked={form.watch('escrow_enabled')}
              onCheckedChange={(checked) => form.setValue('escrow_enabled', checked)}
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

          {/* Auto Release */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="escrow_auto_release_enabled">Auto-Release Escrow</Label>
              <p className="text-sm text-muted-foreground">
                Automatically release payment after hold period expires
              </p>
            </div>
            <Switch
              id="escrow_auto_release_enabled"
              checked={form.watch('escrow_auto_release_enabled')}
              onCheckedChange={(checked) => form.setValue('escrow_auto_release_enabled', checked)}
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
              onValueChange={(value) => form.setValue('payout_schedule', value as any)}
            >
              <SelectTrigger id="payout_schedule">
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
            <Label>Enabled Payment Methods</Label>
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
