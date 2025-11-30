import { useMemo } from 'react';
import { useCurrencyConverter } from './use-currency';
import { QuickViewProduct } from '@luxury/ui';

/**
 * Hook to convert product prices to selected currency
 */
export function useCurrencyProducts(products: QuickViewProduct[], fromCurrency: string = 'USD'): QuickViewProduct[] {
  const { convertPrice } = useCurrencyConverter();

  return useMemo(() => {
    if (!products || !Array.isArray(products)) {
      return [];
    }

    return products.map(product => {
      // Ensure valid price values
      const validPrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
      const validCompareAtPrice = typeof product.compareAtPrice === 'number' && !isNaN(product.compareAtPrice) ? product.compareAtPrice : undefined;

      const convertedPrice = validPrice > 0 ? convertPrice(validPrice, fromCurrency) : 0;
      const convertedCompareAtPrice = validCompareAtPrice ? convertPrice(validCompareAtPrice, fromCurrency) : undefined;

      return {
        ...product,
        price: typeof convertedPrice === 'number' && !isNaN(convertedPrice) ? convertedPrice : 0,
        compareAtPrice: typeof convertedCompareAtPrice === 'number' && !isNaN(convertedCompareAtPrice) ? convertedCompareAtPrice : undefined,
      };
    });
  }, [products, convertPrice, fromCurrency]);
}

/**
 * Hook to convert a single product's prices to selected currency
 */
export function useCurrencyProduct(product: QuickViewProduct | null, fromCurrency: string = 'USD'): QuickViewProduct | null {
  const { convertPrice } = useCurrencyConverter();

  return useMemo(() => {
    if (!product) return null;

    // Ensure valid price values
    const validPrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
    const validCompareAtPrice = typeof product.compareAtPrice === 'number' && !isNaN(product.compareAtPrice) ? product.compareAtPrice : undefined;

    const convertedPrice = validPrice > 0 ? convertPrice(validPrice, fromCurrency) : 0;
    const convertedCompareAtPrice = validCompareAtPrice ? convertPrice(validCompareAtPrice, fromCurrency) : undefined;

    return {
      ...product,
      price: typeof convertedPrice === 'number' && !isNaN(convertedPrice) ? convertedPrice : 0,
      compareAtPrice: typeof convertedCompareAtPrice === 'number' && !isNaN(convertedCompareAtPrice) ? convertedCompareAtPrice : undefined,
    };
  }, [product, convertPrice, fromCurrency]);
}
