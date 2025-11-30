'use client';

import { useCurrencyConverter } from '@/hooks/use-currency';

interface PriceProps {
  amount: number;
  className?: string;
  showCode?: boolean;
  fromCurrency?: string;
}

export function Price({ amount, className = '', showCode = false, fromCurrency = 'USD' }: PriceProps) {
  const { formatPrice, formatPriceWithCode } = useCurrencyConverter();

  const formatted = showCode ? formatPriceWithCode(amount, fromCurrency) : formatPrice(amount, fromCurrency);

  return <span className={className}>{formatted}</span>;
}

interface ComparePriceProps {
  price: number;
  compareAtPrice?: number;
  priceClassName?: string;
  compareClassName?: string;
  fromCurrency?: string;
}

export function ComparePrice({
  price,
  compareAtPrice,
  priceClassName = '',
  compareClassName = '',
  fromCurrency = 'USD',
}: ComparePriceProps) {
  const { formatPrice } = useCurrencyConverter();

  return (
    <div className="flex items-center gap-3">
      <span className={priceClassName}>{formatPrice(price, fromCurrency)}</span>
      {compareAtPrice && compareAtPrice > price && (
        <span className={compareClassName}>{formatPrice(compareAtPrice, fromCurrency)}</span>
      )}
    </div>
  );
}
