import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useSWR from 'swr';
import { currencyApi, currencyAdminApi, CurrencyRate } from '@/lib/api/currency';
import { settingsApi } from '@/lib/api/settings';
import { useCallback, useMemo, useEffect } from 'react';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

// Currency store for managing selected currency
interface CurrencyStore {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  defaultCurrency: string;
  setDefaultCurrency: (currency: string) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      selectedCurrency: '',
      defaultCurrency: 'USD',
      setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
      setDefaultCurrency: (currency) => set({ defaultCurrency: currency }),
    }),
    {
      name: 'currency-storage',
    }
  )
);

/**
 * Hook to get system settings for currencies
 */
export function useCurrencySettings() {
  const { data: settings, error, isLoading } = useSWR(
    '/settings/public',
    settingsApi.getPublicSettings,
    {
      revalidateOnFocus: true, // ✅ Enable revalidation on focus
      revalidateOnReconnect: true, // ✅ Enable revalidation on reconnect
      refreshInterval: 0, // Don't auto-refresh (only manual invalidation)
      dedupingInterval: 5000, // Reduce deduping to 5 seconds for faster updates
    }
  );

  const defaultCurrency = useMemo(() => {
    const setting = settings?.find(s => s.key === 'default_currency');
    return setting?.value || 'USD';
  }, [settings]);

  const supportedCurrencies = useMemo(() => {
    const setting = settings?.find(s => s.key === 'supported_currencies');
    return setting?.value || ['USD', 'EUR', 'GBP', 'JPY', 'RWF'];
  }, [settings]);

  return {
    defaultCurrency,
    supportedCurrencies,
    isLoading,
    error,
  };
}

/**
 * Hook to get all available currency rates (filtered by system settings)
 */
export function useCurrencyRates() {
  const { data, error, isLoading, mutate } = useSWR<CurrencyRate[]>(
    '/currency/rates',
    currencyApi.getRates,
    {
      revalidateOnFocus: true, // ✅ Enable revalidation on focus
      revalidateOnReconnect: true, // ✅ Enable revalidation on reconnect
      refreshInterval: 0, // Don't auto-refresh (only manual invalidation)
      dedupingInterval: 5000, // Reduce deduping to 5 seconds for faster updates
    }
  );

  const { supportedCurrencies, isLoading: settingsLoading } = useCurrencySettings();

  // Filter currencies based on system settings
  const filteredCurrencies = useMemo(() => {
    if (!data) return [];
    return data.filter(currency =>
      supportedCurrencies.includes(currency.currencyCode)
    );
  }, [data, supportedCurrencies]);

  return {
    currencies: filteredCurrencies,
    allCurrencies: data || [],
    error,
    isLoading: isLoading || settingsLoading,
    refresh: mutate,
  };
}

/**
 * Hook to get the currently selected currency
 */
export function useSelectedCurrency() {
  const { selectedCurrency, setSelectedCurrency, defaultCurrency, setDefaultCurrency } = useCurrencyStore();
  const { currencies, isLoading } = useCurrencyRates();
  const { defaultCurrency: settingsDefaultCurrency, isLoading: settingsLoading } = useCurrencySettings();

  // Update default currency from settings
  useEffect(() => {
    if (settingsDefaultCurrency && settingsDefaultCurrency !== defaultCurrency) {
      setDefaultCurrency(settingsDefaultCurrency);
      // If no currency is selected yet, use the default from settings
      if (!selectedCurrency) {
        setSelectedCurrency(settingsDefaultCurrency);
      }
    }
  }, [settingsDefaultCurrency, defaultCurrency, selectedCurrency, setDefaultCurrency, setSelectedCurrency]);

  // Determine the effective selected currency
  const effectiveCurrency = selectedCurrency || settingsDefaultCurrency || 'USD';

  // Get the currency object
  const current = currencies.find((c) => c.currencyCode === effectiveCurrency) ||
                 currencies.find((c) => c.currencyCode === settingsDefaultCurrency) ||
                 currencies.find((c) => c.currencyCode === 'USD');

  return {
    currency: current,
    selectedCurrency: effectiveCurrency,
    defaultCurrency: settingsDefaultCurrency,
    setSelectedCurrency,
    isLoading: isLoading || settingsLoading,
  };
}

/**
 * Hook to convert prices to the selected currency
 */
export function useCurrencyConverter() {
  const { selectedCurrency: effectiveSelectedCurrency } = useSelectedCurrency();
  const { allCurrencies } = useCurrencyRates();

  const convertPrice = useCallback((price: number, fromCurrency: string = 'USD'): number => {
    // Validate input
    if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) {
      return 0;
    }

    if (fromCurrency === effectiveSelectedCurrency || !allCurrencies.length) {
      return price;
    }

    const fromRate = allCurrencies.find((c) => c.currencyCode === fromCurrency);
    const toRate = allCurrencies.find((c) => c.currencyCode === effectiveSelectedCurrency);

    if (!fromRate || !toRate || !fromRate.rate || !toRate.rate) {
      return price;
    }

    // Convert to USD first (base currency), then to target currency
    const baseAmount = price / fromRate.rate;
    const convertedAmount = baseAmount * toRate.rate;

    // Ensure we return a valid number
    const decimalDigits = toRate.decimalDigits || 2;
    const result = Number(convertedAmount.toFixed(decimalDigits));

    return isNaN(result) || !isFinite(result) ? price : result;
  }, [effectiveSelectedCurrency, allCurrencies]);

  const formatPrice = useCallback((price: number, fromCurrency: string = 'USD'): string => {
    const convertedPrice = convertPrice(price, fromCurrency);
    const currency = allCurrencies.find((c) => c.currencyCode === effectiveSelectedCurrency);

    if (!currency) {
      // Fallback with thousand separators
      return `$${formatCurrencyAmount(price, 2)}`;
    }

    return currencyApi.formatPrice(convertedPrice, currency);
  }, [convertPrice, allCurrencies, effectiveSelectedCurrency]);

  const formatPriceWithCode = useCallback((price: number, fromCurrency: string = 'USD'): string => {
    const convertedPrice = convertPrice(price, fromCurrency);
    const currency = allCurrencies.find((c) => c.currencyCode === effectiveSelectedCurrency);

    if (!currency) {
      // Fallback with thousand separators
      return `$${formatCurrencyAmount(price, 2)} / USD`;
    }

    return currencyApi.formatPriceWithCode(convertedPrice, currency);
  }, [convertPrice, allCurrencies, effectiveSelectedCurrency]);

  return {
    convertPrice,
    formatPrice,
    formatPriceWithCode,
    selectedCurrency: effectiveSelectedCurrency,
  };
}

/**
 * Hook for admin currency management
 */
export function useCurrencyAdmin() {
  const { data, error, isLoading, mutate } = useSWR(
    '/currency/admin/all',
    currencyAdminApi.getAllCurrencies,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    currencies: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}
