'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@nextpik/ui';
import { AlertCircle, Loader2, X, Plus, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { useCurrencyAdmin } from '@/hooks/use-currency';
import { currencySettingsSchema, type CurrencySettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { invalidateCurrencySettings } from '@/lib/settings-cache';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export function CurrencySettingsSection() {
  const { settings, loading, refetch } = useSettings('currency');
  const { updateSetting, updating } = useSettingsUpdate();
  const { currencies: availableCurrencies, isLoading: currenciesLoading, error: currenciesError } = useCurrencyAdmin();
  const [newCurrency, setNewCurrency] = useState('');

  useEffect(() => {
    if (currenciesError) {
      console.error('Error loading currencies:', currenciesError);
      toast.error('Failed to load currencies', currenciesError.message || 'Please check your connection');
    }
  }, [currenciesError]);

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
      form.reset(formData as CurrencySettings, { keepDirtyValues: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: CurrencySettings) => {
    try {
      if (!data.supported_currencies.includes(data.default_currency)) {
        toast.error('Default currency must be in supported currencies list');
        return;
      }

      const updateOrder = [
        'supported_currencies',
        'default_currency',
        'currency_auto_sync',
        'currency_sync_frequency',
      ];

      for (const key of updateOrder) {
        if (key in data) {
          const value = data[key as keyof CurrencySettings];
          try {
            await updateSetting(key, value, 'Updated via settings panel');
          } catch (err: any) {
            toast.error(`Failed to update ${key}: ${err.response?.data?.message || err.message}`);
            throw err;
          }
        }
      }

      toast.success('Currency settings saved successfully');

      await Promise.all([
        refetch(),
        invalidateCurrencySettings(),
      ]);
    } catch (error: any) {
      console.error('Failed to save settings:', error);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => form.handleSubmit(onSubmit)(),
    onReset: () => form.reset(),
  });

  const addCurrency = (code: string) => {
    if (!code || code.startsWith('__')) {
      return;
    }
    const current = form.watch('supported_currencies') || [];
    if (!current.includes(code)) {
      form.setValue('supported_currencies', [...current, code], { shouldDirty: true });
      setNewCurrency('');
    }
  };

  const removeCurrency = (code: string) => {
    const current = form.watch('supported_currencies') || [];
    const defaultCurrency = form.watch('default_currency');

    if (current.length <= 1) {
      toast.error('At least one currency must be supported');
      return;
    }

    if (code === defaultCurrency) {
      toast.error('Cannot remove the default currency. Change the default currency first.');
      return;
    }

    form.setValue('supported_currencies', current.filter(c => c !== code), { shouldDirty: true });
  };

  if (loading || currenciesLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const activeCurrencies = availableCurrencies.filter(c => c.isActive);
  const isDirty = form.formState.isDirty;

  if (currenciesError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <h3 className="font-semibold text-lg">Failed to Load Currencies</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {currenciesError.message || 'Unable to fetch currency data'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Please ensure you're logged in as an admin and try refreshing the page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <SettingsCard
        icon={DollarSign}
        title="Currency Configuration"
        description="Configure supported currencies and default currency"
      >
        <SettingsField
          label="Default Currency"
          id="default_currency"
          required
          tooltip="Primary currency for pricing and transactions"
          error={form.formState.errors.default_currency?.message}
          helperText="Primary currency for pricing and transactions"
        >
          <Select
            value={form.watch('default_currency')}
            onValueChange={(value) => form.setValue('default_currency', value, { shouldDirty: true })}
          >
            <SelectTrigger id="default_currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {form.watch('supported_currencies')?.map((code) => {
                const currency = activeCurrencies.find(c => c.currencyCode === code);
                return (
                  <SelectItem key={code} value={code}>
                    {code} - {currency?.currencyName || code}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </SettingsField>

        <div className="space-y-2">
          <Label>Supported Currencies *</Label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {form.watch('supported_currencies')?.map((code) => {
                const currency = activeCurrencies.find(c => c.currencyCode === code);
                return (
                  <div
                    key={code}
                    className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-md text-sm"
                  >
                    <span>{currency?.symbol || ''} {code}</span>
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
                  {(() => {
                    const supportedCodes = form.watch('supported_currencies') || [];
                    const availableActive = activeCurrencies.filter(c => !supportedCodes.includes(c.currencyCode));
                    const allInactive = availableCurrencies.filter(c => !c.isActive && !supportedCodes.includes(c.currencyCode));

                    return (
                      <>
                        {availableActive.length > 0 ? (
                          availableActive.map((currency) => (
                            <SelectItem key={currency.currencyCode} value={currency.currencyCode}>
                              {currency.currencyCode} - {currency.currencyName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="__all_added__" disabled>
                            All active currencies are already added
                          </SelectItem>
                        )}

                        {allInactive.length > 0 && (
                          <>
                            <SelectItem value="__separator__" disabled className="font-semibold">
                              ─── Inactive (Activate first) ───
                            </SelectItem>
                            {allInactive.map((currency) => (
                              <SelectItem key={currency.currencyCode} value={currency.currencyCode} disabled>
                                {currency.currencyCode} - {currency.currencyName} (Inactive)
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </>
                    );
                  })()}
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
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Currencies available for customer selection
            </p>
            {activeCurrencies.length === 0 ? (
              <p className="text-sm text-amber-600">
                ⚠️ No active currencies found. Please <a href="/admin/currencies" className="underline font-medium">activate currencies</a> first.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {activeCurrencies.length} active {activeCurrencies.length === 1 ? 'currency' : 'currencies'} available.
                  {availableCurrencies.length > activeCurrencies.length && (
                    <> {availableCurrencies.length - activeCurrencies.length} inactive {availableCurrencies.length - activeCurrencies.length === 1 ? 'currency' : 'currencies'} can be activated in </>
                  )}
                  <a href="/admin/currencies" className="underline font-medium">Currency Management</a>.
                </p>
                {activeCurrencies.filter(c => !form.watch('supported_currencies')?.includes(c.currencyCode)).length === 0 && (
                  <p className="text-sm text-blue-600">
                    ✓ All active currencies are already supported. To add more, activate currencies in <a href="/admin/currencies" className="underline font-medium">Currency Management</a>.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={RefreshCw}
        title="Exchange Rate Synchronization"
        description="Automatically update exchange rates from external API"
      >
        <SettingsToggle
          label="Auto-Sync Exchange Rates"
          description="Automatically update exchange rates from external API"
          checked={form.watch('currency_auto_sync')}
          onCheckedChange={(checked) => form.setValue('currency_auto_sync', checked, { shouldDirty: true })}
          tooltip="When enabled, exchange rates will be automatically updated at the specified frequency"
        />

        {form.watch('currency_auto_sync') && (
          <SettingsField
            label="Sync Frequency"
            id="currency_sync_frequency"
            required
            tooltip="How often exchange rates are updated from the external API"
            error={form.formState.errors.currency_sync_frequency?.message}
            helperText="How often exchange rates are updated"
          >
            <Select
              value={form.watch('currency_sync_frequency')}
              onValueChange={(value) => form.setValue('currency_sync_frequency', value as any, { shouldDirty: true })}
            >
              <SelectTrigger id="currency_sync_frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
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
