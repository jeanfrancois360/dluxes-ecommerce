'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@luxury/ui';
import { Button } from '@luxury/ui';
import { Input } from '@luxury/ui';
import { Label } from '@luxury/ui';
import { Switch } from '@luxury/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@luxury/ui';
import { AlertCircle, Loader2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { currencySettingsSchema, type CurrencySettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';

const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
];

export function CurrencySettingsSection() {
  const { settings, loading, refetch } = useSettings('currency');
  const { updateSetting, updating } = useSettingsUpdate();
  const [newCurrency, setNewCurrency] = useState('');

  const form = useForm<CurrencySettings>({
    resolver: zodResolver(currencySettingsSchema),
    defaultValues: {
      default_currency: 'USD',
      supported_currencies: ['USD', 'EUR', 'GBP'],
      currency_auto_sync: true,
      currency_sync_frequency: 'daily',
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      form.reset(formData as CurrencySettings);
    }
  }, [settings, form]);

  const onSubmit = async (data: CurrencySettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via settings panel');
      }
      toast.success('Currency settings saved successfully');
      await refetch();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const addCurrency = (code: string) => {
    const current = form.watch('supported_currencies') || [];
    if (code && !current.includes(code)) {
      form.setValue('supported_currencies', [...current, code]);
      setNewCurrency('');
    }
  };

  const removeCurrency = (code: string) => {
    const current = form.watch('supported_currencies') || [];
    if (current.length <= 1) {
      toast.error('At least one currency must be supported');
      return;
    }
    form.setValue('supported_currencies', current.filter(c => c !== code));
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
          <CardTitle>Currency Settings</CardTitle>
          <CardDescription>
            Configure supported currencies and exchange rate synchronization
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Default Currency */}
          <div className="space-y-2">
            <Label htmlFor="default_currency">Default Currency *</Label>
            <Select
              value={form.watch('default_currency')}
              onValueChange={(value) => form.setValue('default_currency', value)}
            >
              <SelectTrigger id="default_currency" className="max-w-[300px]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {form.watch('supported_currencies')?.map((code) => {
                  const currency = COMMON_CURRENCIES.find(c => c.code === code);
                  return (
                    <SelectItem key={code} value={code}>
                      {code} - {currency?.name || code}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {form.formState.errors.default_currency && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.default_currency.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Primary currency for pricing and transactions
            </p>
          </div>

          {/* Supported Currencies */}
          <div className="space-y-2">
            <Label>Supported Currencies *</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {form.watch('supported_currencies')?.map((code) => {
                  const currency = COMMON_CURRENCIES.find(c => c.code === code);
                  return (
                    <div
                      key={code}
                      className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-md text-sm"
                    >
                      <span>{code}</span>
                      {form.watch('supported_currencies')?.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCurrency(code)}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Select value={newCurrency} onValueChange={setNewCurrency}>
                  <SelectTrigger className="max-w-[250px]">
                    <SelectValue placeholder="Add currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_CURRENCIES.filter(
                      c => !form.watch('supported_currencies')?.includes(c.code)
                    ).map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => newCurrency && addCurrency(newCurrency)}
                  disabled={!newCurrency}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            {form.formState.errors.supported_currencies && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.supported_currencies.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Currencies available for customer selection
            </p>
          </div>

          {/* Auto Sync */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="currency_auto_sync">Auto-Sync Exchange Rates</Label>
              <p className="text-sm text-muted-foreground">
                Automatically update exchange rates from external API
              </p>
            </div>
            <Switch
              id="currency_auto_sync"
              checked={form.watch('currency_auto_sync')}
              onCheckedChange={(checked) => form.setValue('currency_auto_sync', checked)}
            />
          </div>

          {/* Sync Frequency */}
          {form.watch('currency_auto_sync') && (
            <div className="space-y-2">
              <Label htmlFor="currency_sync_frequency">Sync Frequency *</Label>
              <Select
                value={form.watch('currency_sync_frequency')}
                onValueChange={(value) => form.setValue('currency_sync_frequency', value as any)}
              >
                <SelectTrigger id="currency_sync_frequency" className="max-w-[300px]">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.currency_sync_frequency && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.currency_sync_frequency.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                How often exchange rates are updated
              </p>
            </div>
          )}
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
