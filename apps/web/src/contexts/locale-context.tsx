'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocale as useNextIntlLocale } from 'next-intl';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

// Language types
export type Language = 'en' | 'fr' | 'es';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

export const languages: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

// Currency types
export type Currency = 'USD' | 'EUR';

export interface CurrencyOption {
  code: Currency;
  name: string;
  symbol: string;
  rate: number; // Conversion rate from USD
}

export const currencies: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
];

// Context types
interface LocaleContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  formatPrice: (price: number) => string;
  convertPrice: (price: number) => number;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const CURRENCY_KEY = 'nextpik_ecommerce_currency';
const LOCALE_COOKIE = 'NEXT_LOCALE';

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Read current locale from next-intl (server-set)
  const nextIntlLocale = useNextIntlLocale() as Language;

  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [isInitialized, setIsInitialized] = useState(false);

  // The language is now sourced from next-intl
  const language = nextIntlLocale;

  // Load currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem(CURRENCY_KEY) as Currency;
    if (savedCurrency && currencies.some(c => c.code === savedCurrency)) {
      setCurrencyState(savedCurrency);
    }
    setIsInitialized(true);
  }, []);

  // Set language by writing the NEXT_LOCALE cookie and reloading
  const setLanguage = useCallback((lang: Language) => {
    document.cookie = `${LOCALE_COOKIE}=${lang};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
    localStorage.setItem('nextpik_ecommerce_language', lang);
    window.location.reload();
  }, []);

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem(CURRENCY_KEY, curr);
  };

  const convertPrice = (price: number): number => {
    const currencyOption = currencies.find(c => c.code === currency);
    if (!currencyOption) return price;
    return price * currencyOption.rate;
  };

  const formatPrice = (price: number): string => {
    const currencyOption = currencies.find(c => c.code === currency);
    if (!currencyOption) return `$${formatCurrencyAmount(price, 2)}`;

    const convertedPrice = convertPrice(price);
    const { symbol, code } = currencyOption;

    // Format based on currency
    if (code === 'EUR') {
      return `${formatCurrencyAmount(convertedPrice, 2).replace('.', ',')} ${symbol}`;
    } else {
      return `${symbol}${formatCurrencyAmount(convertedPrice, 2)}`;
    }
  };

  // Don't render children until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null;
  }

  return (
    <LocaleContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        formatPrice,
        convertPrice,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
