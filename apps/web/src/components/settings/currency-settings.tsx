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
import { useCurrencyAdmin } from '@/hooks/use-currency';
import { currencySettingsSchema, type CurrencySettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { invalidateCurrencySettings } from '@/lib/settings-cache';

export function CurrencySettingsSection() {
  const { settings, loading, refetch } = useSettings('currency');
  const { updateSetting, updating } = useSettingsUpdate();
  const { currencies: availableCurrencies, isLoading: currenciesLoading, error: currenciesError } = useCurrencyAdmin();
  const [newCurrency, setNewCurrency] = useState('');

  // Debug: Log currencies when they load
  useEffect(() => {
    if (availableCurrencies) {
      console.log('Available currencies:', availableCurrencies);
      console.log('Active currencies:', availableCurrencies.filter(c => c.isActive));
    }
    if (currenciesError) {
      console.error('Error loading currencies:', currenciesError);
      toast.error('Failed to load currencies', currenciesError.message || 'Please check your connection');
    }
  }, [availableCurrencies, currenciesError]);

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
      console.log('Loading settings into form:', settings);
      const formData = transformSettingsToForm(settings);
      console.log('Transformed form data:', formData);
      console.log('supported_currencies type:', typeof formData.supported_currencies);
      console.log('supported_currencies value:', formData.supported_currencies);
      form.reset(formData as CurrencySettings);
      console.log('Form after reset:', form.getValues());
    }
  }, [settings, form]);

  const onSubmit = async (data: CurrencySettings) => {
    try {
      console.log('Submitting currency settings:', data);
      console.log('Supported currencies being submitted:', data.supported_currencies);
      console.log('Number of currencies:', data.supported_currencies.length);
      console.log('Current form values:', form.getValues());

      // Validate that default currency is in supported currencies
      if (!data.supported_currencies.includes(data.default_currency)) {
        toast.error('Default currency must be in supported currencies list');
        return;
      }

      // Update settings in specific order to avoid validation errors
      // 1. Update supported_currencies first (so backend knows which currencies are valid)
      // 2. Then update default_currency (validated against the new supported_currencies)
      // 3. Then update other settings
      const updateOrder = [
        'supported_currencies',
        'default_currency',
        'currency_auto_sync',
        'currency_sync_frequency',
      ];

      for (const key of updateOrder) {
        if (key in data) {
          const value = data[key as keyof CurrencySettings];
          console.log(`Updating setting: ${key} =`, value);
          try {
            await updateSetting(key, value, 'Updated via settings panel');
            console.log(`Successfully updated: ${key}`);
          } catch (err: any) {
            console.error(`Failed to update ${key}:`, err);
            toast.error(`Failed to update ${key}: ${err.response?.data?.message || err.message}`);
            throw err; // Re-throw to stop the loop
          }
        }
      }
      toast.success('Currency settings saved successfully');

      // Invalidate all currency-related caches to trigger immediate UI updates
      await Promise.all([
        refetch(), // Refetch settings
        invalidateCurrencySettings(), // Update all currency caches (topbar, product pages, etc.)
      ]);

      console.log('Currency caches invalidated - UI updated immediately');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      // Error already shown in the loop above
    }
  };

  const addCurrency = (code: string) => {
    // Ignore placeholder values
    if (!code || code.startsWith('__')) {
      return;
    }
    const current = form.watch('supported_currencies') || [];
    console.log(`Attempting to add currency: ${code}`);
    console.log('Current supported currencies before addition:', current);
    if (!current.includes(code)) {
      const newCurrencies = [...current, code];
      console.log('New supported currencies after addition:', newCurrencies);
      form.setValue('supported_currencies', newCurrencies);
      setNewCurrency('');
    } else {
      console.log(`Currency ${code} already in supported list`);
    }
  };

  const removeCurrency = (code: string) => {
    const current = form.watch('supported_currencies') || [];
    const defaultCurrency = form.watch('default_currency');

    console.log(`Attempting to remove currency: ${code}`);
    console.log('Current supported currencies before removal:', current);

    // Prevent removing if it's the last currency
    if (current.length <= 1) {
      toast.error('At least one currency must be supported');
      return;
    }

    // Prevent removing the default currency
    if (code === defaultCurrency) {
      toast.error('Cannot remove the default currency. Change the default currency first.');
      return;
    }

    const newCurrencies = current.filter(c => c !== code);
    console.log('New supported currencies after removal:', newCurrencies);
    form.setValue('supported_currencies', newCurrencies);
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

  // Get only active currencies for the dropdown
  const activeCurrencies = availableCurrencies.filter(c => c.isActive);

  // Show error if currencies failed to load
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
                  const currency = activeCurrencies.find(c => c.currencyCode === code);
                  return (
                    <SelectItem key={code} value={code}>
                      {code} - {currency?.currencyName || code}
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
