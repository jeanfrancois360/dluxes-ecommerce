import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useSWR from 'swr';
import { currencyApi, CurrencyRate } from '@/lib/api/currency';
import { useCallback, useMemo } from 'react';

// Currency store for managing selected currency
interface CurrencyStore {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      selectedCurrency: 'USD',
      setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
    }),
    {
      name: 'currency-storage',
    }
  )
);

/**
 * Hook to get all available currency rates
 */
export function useCurrencyRates() {
  const { data, error, isLoading, mutate } = useSWR<CurrencyRate[]>(
    '/currency/rates',
    currencyApi.getRates,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    currencies: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}

/**
 * Hook to get the currently selected currency
 */
export function useSelectedCurrency() {
  const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();
  const { currencies, isLoading } = useCurrencyRates();

  const current = currencies.find((c) => c.currencyCode === selectedCurrency) || currencies.find((c) => c.currencyCode === 'USD');

  return {
    currency: current,
    selectedCurrency,
    setSelectedCurrency,
    isLoading,
  };
}

/**
 * Hook to convert prices to the selected currency
 */
export function useCurrencyConverter() {
  const { selectedCurrency } = useCurrencyStore();
  const { currencies } = useCurrencyRates();

  const convertPrice = useCallback((price: number, fromCurrency: string = 'USD'): number => {
    // Validate input
    if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) {
      return 0;
    }

    if (fromCurrency === selectedCurrency || !currencies.length) {
      return price;
    }

    const fromRate = currencies.find((c) => c.currencyCode === fromCurrency);
    const toRate = currencies.find((c) => c.currencyCode === selectedCurrency);

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
  }, [selectedCurrency, currencies]);

  const formatPrice = useCallback((price: number, fromCurrency: string = 'USD'): string => {
    const convertedPrice = convertPrice(price, fromCurrency);
    const currency = currencies.find((c) => c.currencyCode === selectedCurrency);

    if (!currency) {
      return `$${price.toFixed(2)}`;
    }

    return currencyApi.formatPrice(convertedPrice, currency);
  }, [convertPrice, currencies, selectedCurrency]);

  const formatPriceWithCode = useCallback((price: number, fromCurrency: string = 'USD'): string => {
    const convertedPrice = convertPrice(price, fromCurrency);
    const currency = currencies.find((c) => c.currencyCode === selectedCurrency);

    if (!currency) {
      return `$${price.toFixed(2)} / USD`;
    }

    return currencyApi.formatPriceWithCode(convertedPrice, currency);
  }, [convertPrice, currencies, selectedCurrency]);

  return {
    convertPrice,
    formatPrice,
    formatPriceWithCode,
    selectedCurrency,
  };
}

/**
 * Hook for admin currency management
 */
export function useCurrencyAdmin() {
  const { data, error, isLoading, mutate } = useSWR(
    '/currency/admin/all',
    currencyApi.getRates,
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
